const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Yedek Bellek Veritabanı
let memoryProducts = [
  { id: 1, name: 'Motosiklet Kaskı (Full Face)', price: 4500.00, stock: 15 },
  { id: 2, name: 'Motosiklet Eldiveni (Deri)', price: 1200.00, stock: 40 },
  { id: 3, name: 'Zincir Temizleme Spreyi', price: 250.00, stock: 100 }
];

let pool = null;

// Veritabanı Kurulumu
const initDB = async (dbPool) => {
  try {
    await dbPool.query('CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, price NUMERIC(10, 2) NOT NULL, stock INT NOT NULL);');
    const res = await dbPool.query('SELECT COUNT(*) FROM products');
    if (parseInt(res.rows[0].count) === 0) {
      await dbPool.query("INSERT INTO products (name, price, stock) VALUES ('Motosiklet Kaskı (Full Face)', 4500.00, 15), ('Motosiklet Eldiveni (Deri)', 1200.00, 40), ('Zincir Temizleme Spreyi', 250.00, 100);");
      console.log('Veritabanı ürünleri yüklendi.');
    }
  } catch (err) {
    console.log('DB Kurulum hatası: ' + err.message);
  }
};

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    initDB(pool);
  } catch (err) {
    console.log('DB bağlantı kurulamadı.');
  }
}

// Arayüz Rotalaması (Düz ve Hatasız HTML)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Bulut Mimari E-Ticaret</title>
        <style>
            body { font-family: sans-serif; background: #f4f6f9; padding: 20px; margin: 0; }
            .container { max-width: 800px; margin: 0 auto; }
            header { background: #2a5298; color: white; padding: 20px; border-radius: 10px; text-align: center; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-top: 20px; }
            .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; }
            .price { font-size: 20px; color: #2ecc71; font-weight: bold; margin: 10px 0; }
            .btn { background: #2a5298; color: white; padding: 10px; border: none; border-radius: 5px; cursor: pointer; width: 100%; font-weight: bold; }
            .btn:disabled { background: #ccc; cursor: not-allowed; }
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
                    .then(function(res) { return res.json(); })
                    .then(function(products) {
                        var grid = document.getElementById('products-grid');
                        grid.innerHTML = '';
                        products.forEach(function(p) {
                            var card = document.createElement('div');
                            card.className = 'card';
                            var isStockOut = p.stock <= 0;
                            
                            var statusText = isStockOut ? 'Tükendi' : p.stock + ' Adet';
                            var btnText = isStockOut ? 'Stok Yok' : 'Satın Al (Stok Düş)';
                            var disabledAttr = isStockOut ? 'disabled' : '';

                            card.innerHTML = '<h3>' + p.name + '</h3>' +
                                             '<div class="price">' + p.price + ' TL</div>' +
                                             '<div style="margin-bottom:10px">Stok: <strong>' + statusText + '</strong></div>' +
                                             '<button class="btn" ' + disabledAttr + '>' + btnText + '</button>';
                            
                            if (!isStockOut) {
                                card.querySelector('button').onclick = function() { buyProduct(p.id); };
                            }
                            grid.appendChild(card);
                        });
                    });
            }
            function buyProduct(id) {
                fetch('/buy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: id })
                })
                .then(function(res) { return res.json(); })
                .then(function(data) {
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

// TÜM ÜRÜNLERİ LİSTELE
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

// STOK DÜŞÜRME
app.post('/buy', async (req, res) => {
  const productId = parseInt(req.body.id);
  if (pool) {
    try {
      const check = await pool.query('SELECT stock, name FROM products WHERE id = $1', [productId]);
      if (check.rows.length > 0 && check.rows[0].stock > 0) {
        await pool.query('UPDATE products SET stock = stock - 1 WHERE id = $1', [productId]);
        return res.json({ success: true, message: 'Başarılı! Stok güncellendi.' });
      }
    } catch (err) {
      console.log('Hafızaya yönlendiriliyor.');
    }
  }

  const product = memoryProducts.find(p => p.id === productId);
  if (product && product.stock > 0) {
    product.stock -= 1;
    return res.json({ success: true, message: 'Başarılı! ' + product.name + ' stoku düşürüldü.' });
  }
  return res.status(400).json({ success: false, message: 'Stok yetersiz.' });
});

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda aktif.`);
});
