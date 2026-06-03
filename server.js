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

// Veritabanını Başlatma ve Tablo Oluşturma Fonksiyonu
const initDB = async (dbPool) => {
  try {
    // Tablo yoksa oluştur
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        stock INT NOT NULL
      );
    `);
    
    // Tablo boş mu kontrol et
    const res = await dbPool.query('SELECT COUNT(*) FROM products');
    if (parseInt(res.rows[0].count) === 0) {
      // Boşsa ürünleri yerleştir
      await dbPool.query(`
        INSERT INTO products (name, price, stock) VALUES 
        ('Motosiklet Kaskı (Full Face)', 4500.00, 15),
        ('Motosiklet Eldiveni (Deri)', 1200.00, 40),
        ('Zincir Temizleme Spreyi', 250.00, 100);
      `);
      console.log('Veritabanına ilk ürünler başarıyla yüklendi.');
    }
  } catch (err) {
    console.log('Tablo kurulumunda hata çıktı:', err.message);
  }
};

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    // Veritabanı bağlantısı kurulunca tabloları hazırla
    initDB(pool);
  } catch (err) {
    console.log('DB hatası.');
  }
}

// Arayüzün Base64 Kodlanmış Hali
const htmlBase64 = "PCFET0NUWVBFIGh0bWw+CjxsYW5nPSJ0ciI+CjxoZWFkPgogICAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogICAgPHRpdGxlPkJ1bHV0IE1pbWFyaSBFLVRpY2FyZXQ8L3RpdGxlPgogICAgPHN0eWxlPgogICAgICAgIGJvZHkgeyBmb250LWZhbWlseTogc2Fucy1zZXJpZjsgYmFja2dyb3VuZDogI2Y0ZjZmOTsgcGFkZGluZzogMjBweDsgbWFyZ2luOiAwOyB9CiAgICAgICAgLmNvbnRhaW5lciB7IG1heC13aWR0aDogODAwcHg7IG1hcmdpbjogMCBhdXRvOyB9CiAgICAgICAgaGVhZGVyIHsgYmFja2dyb3VuZDogIzJhNTI5ODsgY29sb3I6IHdoaXRlOyBwYWRkaW5nOiAyMHB4OyBib3JkZXItcmFkaXVzOiAxMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IH0KICAgICAgICAuZ3JpZCB7IGRpc3BsYXk6IGdyaWQ7IGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KGF1dG8tZml0LCBtaW5tYXgoMjIwcHgsIDFmcikpOyBnYXA6IDIwcHg7IG1hcmdpbi10b3A6IDIwcHg7IH0KICAgICAgICAuY2FyZCB7IGJhY2tncm91bmQ6IHdoaXRlOyBwYWRkaW5nOiAyMHB4OyBib3JkZXItcmFkaXVzOiAxMHB4OyBib3gtc2hhZG93OiAwIDJweCA1cHggcmdiYSgwLDAsMCwwLjEpOyB0ZXh0LWFsaWduOiBjZW50ZXI7IH0KICAgICAgICAucHJpY2UgeyBmb250LXNpemU6IDIwcHg7IGNvbG9yOiAjMmVjYzcxOyBmb250LXdlaWdodDogYm9sZDsgbWFyZ2luOiAxMHB4IDA7IH0KICAgICAgICAuYnRuIHsgYmFja2dyb3VuZDogIzJhNTI5ODsgY29sb3I6IHdoaXRlOyBwYWRkaW5nOiAxMHB4OyBib3Rki6IG5vbmU7IGJvcmRlci1yYWRpdXM6IDVweDsgY3Vyc29yOiBwb2ludGVyOyB3aWR0aDogMTAwJTsgZm9udC13ZWlnaHQ6IGJvbGQ7IH0KICAgICAgICAuYnRuOmRpc2FibGVkIHsgYmFja2dyb3VuZDogI2NjYzsgY3Vyc29yOiBub3QtYWxsb3dlZDsgfQogICAgPC9zdHlsZT4KPC9oZWFkPgo8Ym9keT4KICAgIDxkaXYgY2xhc3M9ImNvbnRhaW5lciI+CiAgICAgICAg<header>\n            <h1>🚀 Bulut Mimari E-Ticaret Mağazası</h1>\n            <p>Stateless Alt Yapı & Gerçek Zamanlı Stok Yönetimi</p>\n        </header>\n        <div class="grid" id="products-grid"></div>\n    </div>\n    <script>\n        function loadProducts() {\n            fetch('/products')\n                .then(res => res.json())\n                .then(products => {\n                    const grid = document.getElementById('products-grid');\n                    grid.innerHTML = '';\n                    products.forEach(p => {\n                        const card = document.createElement('div');\n                        card.className = 'card';\n                        const isStockOut = p.stock <= 0;\n                        card.innerHTML = '<h3>'+p.name+'</h3><div class=\"price\">'+p.price+' TL</div><div style=\"margin-bottom:10px\">Stok: <strong>'+(isStockOut ? 'Tükendi' : p.stock + ' Adet')+'</strong></div><button class=\"btn\" '+(isStockOut?'disabled':'')+'>'+(isStockOut?'Stok Yok':'Satın Al (Stok Düş)')+'</button>';\n                        if (!isStockOut) {\n                            card.querySelector('button').onclick = () => buyProduct(p.id);\n                        }\n                        grid.appendChild(card);\n                    });\n                });\n        }\n        function buyProduct(id) {\n            fetch('/buy', {\n                method: 'POST',\n                headers: { 'Content-Type': 'application/json' },\n                body: JSON.stringify({ id: id })\n            })\n            .then(res => res.json())\n            .then(data => {\n                alert(data.message);\n                loadProducts();\n            });\n        }\n        loadProducts();\n    </script>\n</body>\n</html>";

app.get('/', (req, res) => {
  // Base64 şablonunu ve düz HTML parçasını birleştirip gönderiyoruz
  const htmlStart = Buffer.from("PCFET0NUWVBFIGh0bWw+CjxsYW5nPSJ0ciI+CjxoZWFkPgogICAgPG1ldGEgY2hhcnNldD0iVVRGLTgiPgogICAgPHRpdGxlPkJ1bHV0IE1pbWFyaSBFLVRpY2FyZXQ8L3RpdGxlPgogICAgPHN0eWxlPgogICAgICAgIGJvZHkgeyBmb250LWZhbWlseTogc2Fucy1zZXJpZjsgYmFja2dyb3VuZDogI2Y0ZjZmOTsgcGFkZGluZzogMjBweDsgbWFyZ2luOiAwOyB9CiAgICAgICAgLmNvbnRhaW5lciB7IG1heC13aWR0aDogODAwcHg7IG1hcmdpbjogMCBhdXRvOyB9CiAgICAgICAgaGVhZGVyIHsgYmFja2dyb3VuZDogIzJhNTI5ODsgY29sb3I6IHdoaXRlOyBwYWRkaW5nOiAyMHB4OyBib3JkZXItcmFkaXVzOiAxMHB4OyB0ZXh0LWFsaWduOiBjZW50ZXI7IH0KICAgICAgICAuZ3JpZCB7IGRpc3BsYXk6IGdyaWQ7IGdyaWQtdGVtcGxhdGUtY29sdW1uczogcmVwZWF0KGF1dG8tZml0LCBtaW5tYXgoMjIwcHgsIDFmcikpOyBnYXA6IDIwcHg7IG1hcmdpbi10b3A6IDIwcHg7IH0KICAgICAgICAuY2FyZCB7IGJhY2tncm91bmQ6IHdoaXRlOyBwYWRkaW5nOiAyMHB4OyBib3JkZXItcmFkaXVzOiAxMHB4OyBib3gtc2hhZG93OiAwIDJweCA1cHggcmdiYSgwLDAsMCwwLjEpOyB0ZXh0LWFsaWduOiBjZW50ZXI7IH0KICAgICAgICAucHJpY2UgeyBmb250LXNpemU6IDIwcHg7IGNvbG9yOiAjMmVjYzcxOyBmb250LXdlaWdodDogYm9sZDsgbWFyZ2luOiAxMHB4IDA7IH0KICAgICAgICAuYnRuIHsgYmFja2dyb3VuZDogIzJhNTI5ODsgY29sb3I6IHdoaXRlOyBwYWRkaW5nOiAxMHB4OyBib3JkZXI6IG5vbmU7IGJvcmRlci1yYWRpdXM6IDVweDsgY3Vyc29yOiBwb2ludGVyOyB3aWR0aDogMTAwJTsgZm9udC13ZWlnaHQ6IGJvbGQ7IH0KICAgICAgICAuYnRuOmRpc2FibGVkIHsgYmFja2dyb3VuZDogI2NjYzsgY3Vyc29yOiBub3QtYWxsb3dlZDsgfQogICAgPC9zdHlsZT4KPC9oZWFkPgo8Ym9keT4KICAgIDxkaXYgY2xhc3M9ImNvbnRhaW5lciI+", 'base64').toString('utf-8');
  const htmlEnd = `
        <header>
            <h1>🚀 Bulut Mimari E-Ticaret Mağazası</h1>
            <p>Stateless Alt Yapı & Gerçek Zamanlı Stok Yönetimi</p>
        </header>
        <div class="grid" id="products-grid"></div>
    </div>
    <script>
        function loadProducts() {
            fetch('/products')
                .then(res => res
