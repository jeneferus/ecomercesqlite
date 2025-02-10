const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Configurar multer para manejar archivos
const storage = multer.memoryStorage();
const upload = multer({ storage });

const db = new sqlite3.Database("./ecommerce.db");

// Crear tablas si no existen
db.run(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    address TEXT,
    quantity INTEGER
  )
`);
db.run(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price REAL,
    image TEXT
  )
`);

// 📌 SUBIR IMAGEN A CLOUDINARY
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se envió ninguna imagen" });
  
  cloudinary.uploader.upload_stream({ resource_type: "image" }, (error, result) => {
    if (error) return res.status(500).json({ error: error.message });
    res.json({ imageUrl: result.secure_url });
  }).end(req.file.buffer);
});

// 📌 CREAR UNA ORDEN
app.post("/api/order", (req, res) => {
  const { name, email, address, quantity } = req.body;
  db.run(
    "INSERT INTO orders (name, email, address, quantity) VALUES (?, ?, ?, ?)",
    [name, email, address, quantity],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ id: this.lastID });
    }
  );
});

// 📌 OBTENER TODAS LAS ÓRDENES
app.get("/api/orders", (req, res) => {
  db.all("SELECT * FROM orders", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 📌 BORRAR UNA ORDEN
app.delete("/api/order/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM orders WHERE id = ?", id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Orden eliminada", deletedId: id });
  });
});

// 📌 AGREGAR UN PRODUCTO
app.post("/api/products", (req, res) => {
  const { name, price, image } = req.body;
  db.run(
    "INSERT INTO products (name, price, image) VALUES (?, ?, ?)",
    [name, price, image],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ id: this.lastID });
    }
  );
});

// 📌 OBTENER TODOS LOS PRODUCTOS
app.get("/api/products", (req, res) => {
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});





// Eliminar un producto
app.delete("/api/products/:id", (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM products WHERE id = ?", [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Producto eliminado correctamente" });
    });
  });
  
  // Modificar un producto
  app.put("/api/products/:id", (req, res) => {
    const { id } = req.params;
    const { name, price, image } = req.body;
    db.run(
      "UPDATE products SET name = ?, price = ?, image = ? WHERE id = ?",
      [name, price, image, id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Producto actualizado correctamente" });
      }
    );
  });
  
  // Eliminar una orden
  app.delete("/api/orders/:id", (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM orders WHERE id = ?", [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Orden eliminada correctamente" });
    });
  });
  


app.listen(5000, () => console.log("🚀 Servidor backend en http://localhost:5000"));
