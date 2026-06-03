const express = require('express');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Geçici Bellek Veritabanı
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
    console.log('Veritabanı bağlantı hatası.');
  }
}

// Ana Sayfa - HTML Dosyasını Gönderir
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
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
        return res.json({ success: true, message: `Başarılı! veritabanından düşüldü.` });
      }
    } catch (err) {
      console.log('Hafızaya geçiliyor.');
    }
  }

  const product = memoryProducts.find(p => p.id === productId);
  if (product && product.stock > 0) {
    product.stock -= 1;
    return res.json({ success: true, message: `Başarılı! ${product.name} stoku düşürüldü.` });
  }
  return res.status(400).json({ success: false, message: 'Stok yetersiz.' });
});

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda aktif.`);
});
