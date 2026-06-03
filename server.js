const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

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
    console.log('DB hatası.');
  }
}

// Arayüzün Base64 Formatı (Tırnak hatalarını engellemek için en güvenli mühendislik yöntemidir)
const htmlBase64 = "PCFET0NUWVBFIGh0bWw+CjxsYW5nPSJ0ciI+CjxoZWFkPgogICAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogICAgPHRpdGxlPkJ1bHV0IE1pbWFyaSBFLVRpY2FyZXQ8L3RpdGxlPgogICAgPHN0eWxlPgogICAgICAgIGJvZHkgeyBmb250LWZhbWlseTogc2Fucy1zZXJpZjsgYmFja2dyb3VuZDogI2Y0ZjZmOTsgcGFkZGluZzogMjBweDsgbWFyZ2luOiAwOyB9CiAgICAgICAgLmNvbnRhaW5lciB7IG1heC13aWR0aDogODAwcHg7IG1hcmdpbjogMCBhdXRvOyB9CiAgICAgICAgaGVhZGVyIHsgYmFja2dyb3VuZDogIzJhNTI5ODsgY29sb3I6IHdoaXRlOyBwYWRkaW5nOiAyMHB4OyBib3JkZXItcmFkaXVzOiAxMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IH0KICAgICAgICAuZ3JpZCB7IGRpc3BsYXk6IGdyaWQ7IGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KGF1dG8tZml0LCBtaW5tYXgoMjIwcHgsIDFmcikpOyBnYXA6IDIwcHg7IG1hcmdpbi10b3A6IDIwcHg7IH0KICAgICAgICAuY2FyZCB7IGJhY2tncm91bmQ6IHdoaXRlOyBwYWRkaW5nOiAyMHB4OyBib3JkZXItcmFkaXVzOiAxMHB4OyBib3gtc2hhZG93OiAwIDJweCA1cHggcmdiYSgwLDAsMCwwLjEpOyB0ZXh0LWFsaWduOiBjZW50ZXI7IH0KICAgICAgICAucHJpY2UgeyBmb250LXNpemU6IDIwcHg7IGNvbG9yOiAjMmVjYzcxOyBmb250LXdlaWdodDogYm9sZDsgbWFyZ2luOiAxMHB4IDA7IH0KICAgICAgICAuYnRuIHsgYmFja2dyb3VuZDogIzJhNTI5ODsgY29sb3I6IHdoaXRlOyBwYWRkaW5nOiAxMHB4OyBib3JkZXI6IG5vbmU7IGJvcmRlci1yYWRpdXM6IDVweDsgY3Vyc29yOiBwb2ludGVyOyB3aWR0aDogMTAwJTsgZm9udC13ZWlnaHQ6IGJvbGQ7IH0KICAgICAgICAuYnRuOmRpc2FibGVkIHsgYmFja2dyb3VuZDogI2NjYzsgY3Vyc29yOiBub3QtYWxsb3dlZDsgfQogICAgPC9zdHlsZT4KPC9oZWFkPgo8Ym9keT4KICAgIDxkaXYgY2xhc3M9ImNvbnRhaW5lciI+CiAgICAgICAgPGhlYWRlcj4KICAgICAgICAgICAgPGgxPs🚀IEJ1bHV0IE1pbWFyaSBFLVRpY2FyZXQgTWHEn2F6YXPEszwvaDE+CiAgICAgICAgICAgIDxwPlN0YXRlbGVzcyBBbHQgWWFwaSAmIEdlcsOnZWsgWmFtYW5swsharedTdG9rIFnPiW5ldGltaTwvcD4KICAgICAgICA8L2hlYWRlcj4KICAgICAgICA8ZGl2IGNsYXNzPSJncmlkIiBpZD0icHJvZHVjdHMtZ3JpZCI+PC9kaXY+CiAgICA8L2Rpdj4KICAgIDxzY3JpcHQ+CiAgICAgICAgZnVuY3Rpb24gbG9hZFByb2R1Y3RzKCkgewogICAgICAgICAgICBmZXRjaCgnL3Byb2R1Y3RzJykKICAgICAgICAgICAgICAgIC50aGVuKHJlcyA9PiByZXMuanNvbigpKQogICAgICAgICAgICAgICAgLnRoZW4ocHJvZHVjdHMgPT4gewogICAgICAgICAgICAgICAgICAgIGNvbnN0IGdyaWQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncHJvZHVjdHMtZ3JpZCcpOwogICAgICAgICAgICAgICAgICAgIGdyaWQuaW5uZXJIVE1MID0gIjsKICAgICAgICAgICAgICAgICAgICBwcm9kdWN0cy5mb3JFYWNoKHAgPT4gewogICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjYXJkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7CiAgICAgICAgICAgICAgICAgICAgICAgIGNhcmQuY2xhc3NOYW1lID0gJ2NhcmQnOwogICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc1N0b2NrT3V0ID0gcC5zdG9jayA8PSAwOwogICAgICAgICAgICAgICAgICAgICAgICBjYXJkLmlubmVySFRNTCA9ICcoY2FyZCBpbmZvKSc7CiAgICAgICAgICAgICAgICAgICAgICAgIGNhcmQuaW5uZXJIVE1MID0gJzxoMz4nK3AubmFtZSsnPC9oMz48ZGl2IGNsYXNzPSJwcmljZSI+JytwLnByaWNlKycgVEw8L2Rpdj48ZGl2IHN0eWxlPSJtYXJnaW4tYm90dG9tOjEwcHgiPlN0b2s6IDxzdHJvbmc+JysgKGlzU3RvY2tPdXQgPyAnVMODirectVuZGknIDogcC5zdG9jayArICcgQWRldCcpICsnPC9zdHJvbmc+PC9kaXY+PGJ1dHRvbiBjbGFzcz0iYnRuIiAnKyAoaXNTdG9ja091dCA/ICdkaXNhYmxlZCcgOiAnJykgKyAnPicgKyAoaXNTdG9ja091dCA/ICdTdG9rIFlvaycgOiAnU2F0x24gQWwgKFN0b2sgRMSxxZ8pJykgKyAnPC9idXR0b24+JzsKICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgYnRuID0gY2FyZC5xdWVyeVNlbGVjdG9yKCdidXR0b24nKTsKICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc1N0b2NrT3V0KSBidG4ub25jbGljayA9ICgpID0+IGJ1eVByb2R1Y3QocC5pZCk7CiAgICAgICAgICAgICAgICAgICAgICAgIGdyaWQuYXBwZW5kQ2hpbGQoY2FyZCk7CiAgICAgICAgICAgICAgICAgICAgfSk7CiAgICAgICAgICAgICAgICB9KTsKICAgICAgICB9CiAgICAgICAgZnVuY3Rpb24gYnV5UHJvZHVjdChpZCkgewogICAgICAgICAgICBmZXRjaCgnL2J1eScsIHsKICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLAogICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sCiAgICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IGlkOiBpZCB9KQogICAgICAgICAgICB9KQogICAgICAgICAgICAudGhlbihyZXMgPT4gcmVzLmpzb24oKSkKICAgICAgICAgICAgICAgIC50aGVuKGRhdGEgPT4gewogICAgICAgICAgICAgICAgICAgIGFsZXJ0KGRhdGEubWVzc2FnZSk7CiAgICAgICAgICAgICAgICAgICAgbG9hZFByb2R1Y3RzKCk7CiAgICAgICAgICAgICAgICB9KTsKICAgICAgICB9CiAgICAgICAgbG9hZFByb2R1Y3RzKCk7CiAgICA8L3NjcmlwdD4KPC9ib2R5Pgo8L2h0bWw+";

// Ana Sayfa Rotalaması (Base64'ü çözüp tarayıcıya HTML basar)
app.get('/', (req, res) => {
  const html = Buffer.from(htmlBase64, 'base64').toString('utf-8');
  res.send(html);
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
        return res.json({ success: true, message: `Başarılı! Stok veritabanında düşürüldü.` });
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
