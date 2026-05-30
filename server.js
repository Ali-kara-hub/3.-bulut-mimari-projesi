const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Geçici Bellek Veritabanı (PostgreSQL yoksa burası çalışacak)
let memoryProducts = [
  { id: 1, name: 'Motosiklet Kaskı (Full Face)', price: 4500.00, stock: 15 },
  { id: 2, name: 'Motosiklet Eldiveni (Deri)', price: 1200.00, stock: 40 },
  { id: 3, name: 'Zincir Temizleme Spreyi', price: 250.00, stock: 100 }
];

let isDatabaseConnected = false;
let pool = null;

// Eğer bulutta veritabanı tanımlıysa bağlanmayı dene
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    isDatabaseConnected = true;
    console.log('Bulut veritabanı bağlantısı aktif.');
  } catch (err) {
    console.log('Bulut veritabanına bağlanılamadı, Lokal hafıza aktif ediliyor.');
    isDatabaseConnected = false;
  }
}

// 1. SAĞLIK KONTROLÜ (Load Balancer İçin Şart)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'UP', 
    database: isDatabaseConnected ? 'PostgreSQL' : 'In-Memory (Failover)',
    timestamp: new Date() 
  });
});

// 2. TÜM ÜRÜNLERİ LİSTELE (GET)
app.get('/products', async (req, res) => {
  if (isDatabaseConnected && pool) {
    try {
      const result = await pool.query('SELECT * FROM products');
      return res.json(result.rows);
    } catch (err) {
      // Veritabanı sorgusu patlarsa çökmek yerine veriyi hafızadan ver
      return res.json(memoryProducts);
    }
  } else {
    // Veritabanı yoksa direkt hafızadaki ürünleri listele
    return res.json(memoryProducts);
  }
});

// 3. YENİ ÜRÜN EKLE (POST)
app.post('/products', async (req, res) => {
  const { name, price, stock } = req.body;
  if (isDatabaseConnected && pool) {
    try {
      const result = await pool.query(
        'INSERT INTO products (name, price, stock) VALUES ($1, $2, $3) RETURNING *',
        [name, price, stock]
      );
      return res.status(201).json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ error: 'Veritabanı hatası.' });
    }
  } else {
    const newProduct = {
      id: memoryProducts.length + 1,
      name,
      price: parseFloat(price),
      stock: parseInt(stock)
    };
    memoryProducts.push(newProduct);
    return res.status(201).json(newProduct);
  }
});

app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda ve Auto-Scaling mimarisine hazır şekilde çalışıyor.`);
});
