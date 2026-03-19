require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); 
const path = require('path');

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});


db.connect(err => {
    if (err) throw err;
    console.log('✅ Conectado a la base de datos MySQL');
});

// ==========================================
// --- RUTAS API: CONCEPTOS ---
// ==========================================
app.get('/api/conceptos', (req, res) => {
    db.query('SELECT * FROM Conceptos', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});
app.post('/api/conceptos', (req, res) => {
    const { clave, descripcion } = req.body;
    db.query('INSERT INTO Conceptos (clave, descripcion) VALUES (?, ?)', [clave, descripcion], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ mensaje: 'Concepto guardado' });
    });
});
app.delete('/api/conceptos/:clave', (req, res) => {
    db.query('DELETE FROM Conceptos WHERE clave = ?', [req.params.clave], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ mensaje: 'Concepto eliminado' });
    });
});

// ==========================================
// --- RUTAS API: DESTINOS ---
// ==========================================
app.get('/api/destinos', (req, res) => {
    db.query('SELECT * FROM Destinos', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});
app.post('/api/destinos', (req, res) => {
    const { clave, descripcion } = req.body;
    db.query('INSERT INTO Destinos (clave, descripcion) VALUES (?, ?)', [clave, descripcion], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ mensaje: 'Destino guardado' });
    });
});
app.delete('/api/destinos/:clave', (req, res) => {
    db.query('DELETE FROM Destinos WHERE clave = ?', [req.params.clave], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ mensaje: 'Destino eliminado' });
    });
});

// ==========================================
// --- RUTAS API: UNIDADES DE MEDIDA ---
// ==========================================
app.get('/api/unidades', (req, res) => {
    db.query('SELECT * FROM UnidadesMedida', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});
app.post('/api/unidades', (req, res) => {
    const { clave, descripcion } = req.body;
    db.query('INSERT INTO UnidadesMedida (clave, descripcion) VALUES (?, ?)', [clave, descripcion], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ mensaje: 'Unidad guardada' });
    });
});
app.delete('/api/unidades/:clave', (req, res) => {
    db.query('DELETE FROM UnidadesMedida WHERE clave = ?', [req.params.clave], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ mensaje: 'Unidad eliminada' });
    });
});

// ==========================================
// --- RUTAS API: PROVEEDORES ---
// ==========================================
app.get('/api/proveedores', (req, res) => {
    db.query('SELECT * FROM Proveedores', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});
app.post('/api/proveedores', (req, res) => {
    const { clave, descripcion, rfc, telefono, correo } = req.body;
    const query = 'INSERT INTO Proveedores (clave, descripcion, rfc, telefono, correo) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [clave, descripcion, rfc, telefono, correo], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ mensaje: 'Proveedor guardado' });
    });
});
app.delete('/api/proveedores/:clave', (req, res) => {
    db.query('DELETE FROM Proveedores WHERE clave = ?', [req.params.clave], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ mensaje: 'Proveedor eliminado' });
    });
});

// ==========================================
// --- RUTAS API: PRODUCTOS ---
// ==========================================
app.get('/api/productos', (req, res) => {
    db.query('SELECT * FROM Productos', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});
app.post('/api/productos', (req, res) => {
    const { clave, descripcion, unidades, proveedor, precio } = req.body;
    
    // El frontend debe enviar el ID (número), no texto.
    const query = 'INSERT INTO Productos (clave, descripcion, idUnidadMedida, idProveedor, precioUnitario) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [clave, descripcion, unidades, proveedor, precio], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ mensaje: 'Producto guardado' });
    });
});
app.delete('/api/productos/:clave', (req, res) => {
    db.query('DELETE FROM Productos WHERE clave = ?', [req.params.clave], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ mensaje: 'Producto eliminado' });
    });
});

// Iniciar servidor
app.listen(3000, () => console.log('🚀 Servidor corriendo en http://localhost:3000'));