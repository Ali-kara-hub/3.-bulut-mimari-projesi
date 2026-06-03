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

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  } catch (err) {
    console.log('Veritabanı bağlantı hatası, hafıza devrede.');
  }
}

// 1. FRONTEND ARAYÜZÜ (Ana Sayfa HTML)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Bulut Mimari E-Ticaret</title>
        <style>
            body { font-family: sans-serif; background: #f4f6f9; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; }
            header { background: #2a5298; color: white; padding: 20px; border-radius: 10px; text-align: center; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px; }
            .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; }
            .price { font-size: 20px; color: #2ecc71; font-weight: bold; margin: 10px 0; }
            .btn { background: #2a5298; color: white; padding: 10px; border: none; border-radius: 5px; cursor: pointer; width: 100%; }
            .btn:disabled { background: #ccc; }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <h1>🚀 Bulut Mimari E-Ticaret Mağazası</h1>
                <p>Stateless Alt Yapı & Gerçek Zamanlı Stok Yönetimi</p>
            </header>
            <div class="grid" id="products-grid"></div>
        </div>
        <script>
            function loadProducts() {
                fetch('/products')
                    .then(res => res.json())
                    .then(products => {
                        const grid = document.getElementById('products-grid');
                        grid.innerHTML = products.map(p => \`
                            <div class="card">\` +
                                \`<h3>\${p.name}</h3>\` +
                                \`<div class="price">\${p.price} TL</div>\` +
                                \`<div style="margin-bottom:10px">Stok: <strong>\${p.stock <= 0 ? 'Tükendi' : p.stock + ' Adet'}</strong></div>\` +
                                \`<button class="btn" \${p.stock <= 0 ? 'disabled' : ''} onclick="buyProduct(\${p.id})">\` +
                                    \`\${p.stock <= 0 ? 'Stok Yok' : 'Satın Al (Stok Düş)'}\` +
                                \`</button>\` +
                            \`</div>
                        \`).join('');
                    });
            }
            function buyProduct(id) {
                fetch('/buy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: id })
                })
                .then(res => res.json())
                .then(data => {
                    alert(data.message);
                    loadProducts();
                });
            }
            loadProducts();
        </script>
    </body>
    </html>
  `);
});

// 2. BACKEND API ENDPOINTLERİ
app.get('/products', async (req, res) => {
  if (pool) {
    try {
      const result = await pool.query('SELECT * FROM products ORDER BY id ASC');
      return res.json(result.rows);
    } catch (err) {
      return res.json(memoryProducts);
    }
  }
  return res.json(memoryProducts);
});

app.post('/buy', async (req, res) => {
  const productId = parseInt(req.body.id);
  if (pool) {
    try {
      const check = await pool.query('SELECT stock, name FROM products WHERE id = $1', [productId]);
      if (
