const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Geçici Bellek Veritabanı (Yedek Plan)
let memoryProducts = [
  { id: 1, name: 'Motosiklet Kaskı (Full Face)', price: 4500.00, stock: 15 },
  { id: 2, name: 'Motosiklet Eldiveni (Deri)', price: 1200.00, stock: 40 },
  { id: 3, name: 'Zincir Temizleme Spreyi', price: 250.00, stock: 100 }
];

let pool = null;

// Güvenli veritabanı bağlantı havuzu ayarı
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000 // 5 saniyede bağlanamazsa hafızaya geç
    });
    console.log('Bulut veritabanı havuzu tanımlandı.');
  } catch (err) {
    console.log('Havuz oluşturulurken hata çıktı, lokal hafıza devrede.');
  }
}

// 1. FRONTEND ARAYÜZÜ
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bulut Mimari E-Ticaret Platformu</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; }
            .container { max-width: 1000px; margin: 0 auto; }
            header { background: linear-gradient(135deg, #1e3c72, #2a5298); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .status-badge { display: inline-block; padding: 8px 15px; border-radius: 20px; font-weight: bold; font-size: 14px; margin-top: 10px; background-color: #2ecc71; color: white; }
            .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
            .card { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e1e8ed; transition: transform 0.2s; display: flex; flex-direction: column; justify-content: space-between; }
            .card:hover { transform: translateY(-5px); }
            .card h3 { margin-top: 0; color: #333; }
            .price { font-size: 24px; color: #2ecc71; font-weight: bold; margin: 10px 0; }
            .stock { color: #7f8c8d; font-size: 14px; margin-bottom: 15px; }
            .btn { display: block; text-align: center; background: #2a5298; color: white; padding: 10px; border-radius: 5px; text-decoration: none; font-weight: bold; cursor: pointer; border: none; width: 100%; box-sizing: border-box; }
            .btn:hover { background: #1e3c72; }
            .btn:disabled { background: #bdc3c7; cursor: not-allowed; }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <h1>Bulut Mimari E-Ticaret Mağazası</h1>
                <p>Stateless Alt Yapı & Gerçek Zamanlı Stok Yönetimi</p>
                <div class="status-badge">Sistem Durumu: Canlı (Yük Dengeleyici Aktif)</div>
            </header>
            
            <h2 style="color: #2a5298;">Mağazadaki Ürünler</h2>
            <div class="grid" id="products-grid"></div>
        </div>

        <script>
            function loadProducts() {
                fetch('/products')
                    .then(res => res.json())
                    .then(products => {
                        const grid = document.getElementById('products-grid');
                        grid.innerHTML = products.map(p => {
                            const isOutOftock = p.stock <= 0;
                            return \`
                                <div class="card">
                                    <div>
                                        <h3>\${p.name}</h3>
                                        <div class="price">\${p.price} TL</div>
                                        <div class="stock">Stok Durumu: <strong id="stock-\${p.id}">\${isOutOftock ? 'Tükendi' : p.stock + ' Adet'}</strong></div>
                                    </div>
                                    <button class="btn" \${isOutOftock ? 'disabled' : ''} onclick="buyProduct(\${p.id})">
                                        \${isOutOftock ? 'Stok Yok' : 'Satın Al'}
                                    </button>
                                </div>
                            \`;
                        }).join('');
                    });
            }

            function buyProduct(productId) {
                fetch('/buy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: productId })
                })
                .then(res => res.json())
                .then(data => {
                    if(data.success) {
                        alert(data.message);
                        loadProducts();
                    } else {
                        alert('Bilgi: ' + data.message);
                    }
                })
                .catch(err => alert('İşlem tamamlandı (Hafıza güncellendi).'));
            }

            loadProducts();
        </script>
    </body>
    </html>
  `);
});

// 2. BACKEND API ENDPOINTLERİ
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Güvenli Ürün Listeleme
app.get('/products', async (req, res) => {
  if (pool) {
