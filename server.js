const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Geçici Bellek Veritabanı (Başlangıç Stokları)
let memoryProducts = [
  { id: 1, name: 'Motosiklet Kaskı (Full Face)', price: 4500.00, stock: 15 },
  { id: 2, name: 'Motosiklet Eldiveni (Deri)', price: 1200.00, stock: 40 },
  { id: 3, name: 'Zincir Temizleme Spreyi', price: 250.00, stock: 100 }
];

let isDatabaseConnected = false;
let pool = null;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    isDatabaseConnected = true;
  } catch (err) {
    isDatabaseConnected = false;
  }
}

// 1. FRONTEND ARAYÜZÜ (Geliştirilmiş Stok Yönetimli Arayüz)
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
                <h1>🚀 Bulut Mimari E-Ticaret Mağazası</h1>
                <p>Stateless Alt Yapı & Gerçek Zamanlı Stok Yönetimi</p>
                <div class="status-badge">Sistem Durumu: Canlı (Yük Dengeleyici Aktif)</div>
            </header>
            
            <h2 style="color: #2a5298;">📦 Mağazadaki Ürünler</h2>
            <div class="grid" id="products-grid"></div>
        </div>

        <script>
            // Ürünleri API'den çekip ekrana basan fonksiyon
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
                                        \${isOutOftock ? 'Stok Yok' : 'Satın Al (Stok Düş)'}
                                    </button>
                                </div>
                            \`;
                        }).join('');
                    });
            }

            // Stok düşürme isteği atan fonksiyon
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
                        loadProducts(); // Ekrandaki stokları güncellemek için listeyi yeniden yükle
                    } else {
                        alert('Hata: ' + data.message);
                    }
                })
                .catch(err => alert('Sistem hatası oluştu.'));
            }

            // İlk açılışta ürünleri yükle
            loadProducts();
        </script>
    </body>
    </html>
  `);
});

// 2. BACKEND API ENDPOINTLERİ
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', database: isDatabaseConnected ? 'PostgreSQL' : 'In-Memory', timestamp: new Date() });
});

// Tüm Ürünleri Listele
app.get('/products', async (req, res) => {
  if (isDatabaseConnected && pool) {
    try {
      const result = await pool.query('SELECT * FROM products ORDER BY id ASC');
      return res.json(result.rows);
    } catch (err) {
      return res.json(memoryProducts);
    }
  } else {
    return res.json(memoryProducts);
  }
});

// YENİ: Gerçek Zamanlı Stok Düşürme Rotası (POST /buy)
app.post('/buy', async (req, res) => {
  const productId = parseInt(req.body.id);

  if (isDatabaseConnected && pool) {
    try {
      // Önce stok kontrolü yap
      const checkRes = await pool.query('SELECT stock, name FROM products WHERE id = $1', [productId]);
      if (checkRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Ürün bulunamadı.' });
      }

      if (checkRes.rows[0].stock <= 0) {
        return res.status(400).json({ success: false, message: 'Bu ürünün stoğu tükenmiştir!' });
      }

      // Veritabanında stoku 1 azalt
      await pool.query('UPDATE products SET stock = stock - 1 WHERE id = $1', [productId]);
      return res.json({ success: true, message: `Başarılı! ${checkRes.rows[0].name} stoku 1 adet düşürüldü.` });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Veritabanı işlemi başarısız oldu.' });
    }
  } else {
    // Veritabanı bağlı değilse lokal hafızadan düş
    const product = memoryProducts.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Ürün bulunamadı.' });
    }

    if (product.stock <= 0) {
      return res.status(400).json({ success: false, message: 'Bu ürünün stoğu tükenmiştir!' });
    }

    product.stock -= 1;
    return res.json({ success: true, message: `Başarılı! ${product.name} stoku lokal hafızada 1 adet düşürüldü.` });
  }
});

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda sorunsuz çalışıyor.`);
});
