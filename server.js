const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Geçici Bellek Veritabanı
let memoryProducts = [
  { id: 1, name: 'Motosiklet Kaskı', price: 4500.00, stock: 15 },
  { id: 2, name: 'Motosiklet Eldiveni', price: 1200.00, stock: 40 },
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

// 1. FRONTEND ARAYÜZÜ (Ana Sayfa)
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
            .card { background: white; border-radius: 10px; padding: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e1e8ed; transition: transform 0.2s; }
            .card:hover { transform: translateY(-5px); }
            .card h3 { margin-top: 0; color: #333; }
            .price { font-size: 24px; color: #2ecc71; font-weight: bold; margin: 15px 0; }
            .stock { color: #7f8c8d; font-size: 14px; }
            .btn { display: block; width: 100%; text-align: center; background: #2a5298; color: white; padding: 10px; border-radius: 5px; text-decoration: none; font-weight: bold; margin-top: 15px; }
            .btn:hover { background: #1e3c72; }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <h1>E-Ticaret Mağazası</h1>
            </header>
            <h2 style="color: #2a5298;">Mağazadaki Ürünler</h2>
            <div class="grid" id="products-grid"></div>
        </div>

        <script>
            fetch('/products')
                .then(res => res.json())
                .then(products => {
                    const grid = document.getElementById('products-grid');
                    grid.innerHTML = products.map(p => \`
                        <div class="card">
                            <h3>\${p.name}</h3>
                            <div class="price">\${p.price} TL</div>
                            <div class="stock">Stok Durumu: <strong>\${p.stock} Adet</strong></div>
                            <a href="#" class="btn" onclick="alert('Bu proje bir bulut mimari demosudur, gerçek satış yapılmamaktadır.')">Sepete Ekle</a>
                        </div>
                    \`).join('');
                });
        </script>
    </body>
    </html>
  `);
});

// 2. BACKEND API ENDPOINTLERİ
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', database: isDatabaseConnected ? 'PostgreSQL' : 'In-Memory', timestamp: new Date() });
});

app.get('/products', async (req, res) => {
  if (isDatabaseConnected && pool) {
    try {
      const result = await pool.query('SELECT * FROM products');
      return res.json(result.rows);
    } catch (err) {
      return res.json(memoryProducts);
    }
  } else {
    return res.json(memoryProducts);
  }
});

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda sorunsuz çalışıyor.`);
});
