require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); 
const path = require('path');

const app = express();

app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
    // Si la petición trae datos en el body...
    if (req.body) {
        // Recorremos cada campo que el usuario mandó (clave, descripcion, etc.)
        for (let campo in req.body) {
            // Si el campo es texto, le arrancamos los símbolos de inyección < y >
            if (typeof req.body[campo] === 'string') {
                req.body[campo] = req.body[campo].replace(/[<>]/g, ''); 
            }
        }
    }
    // Todo limpio, puedes pasar a la ruta correspondiente
    next(); 
});
app.use(express.static(path.join(__dirname)));

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
//espejo del pool que usa promesas, para usar async/await en las rutas de documentos
const dbPromesas = db.promise();

// Probamos la conexión al Pool
db.getConnection((err, connection) => {
    if (err) throw err;
    console.log('✅ Conectado al Pool de MySQL (Modo Híbrido)');
    // Siempre debemos liberar la conexión de prueba para que regrese al pool
    connection.release(); 
});

// ==========================================
// --- RUTAS API: CONCEPTOS ---
// ==========================================
app.get('/api/conceptos', (req, res) => {
    db.query('SELECT * FROM Conceptos', (err, results) => {
        if (err) {
            console.error("Error en BD:", err.message); 
            return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
        }
        res.json(results);
    });
});
app.post('/api/conceptos', (req, res) => {
    const { clave, descripcion } = req.body;
    db.query('INSERT INTO Conceptos (clave, descripcion) VALUES (?, ?)', [clave, descripcion], (err, result) => {
        if (err) {
            console.error("Error en BD:", err.message); 
            return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
        }
        res.json({ mensaje: 'Concepto guardado' });
    });
});
app.delete('/api/conceptos/:clave', (req, res) => {
    db.query('DELETE FROM Conceptos WHERE clave = ?', [req.params.clave], (err, result) => {
        if (err) {
            console.error("Error en BD:", err.message); 
            return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
        }
        res.json({ mensaje: 'Concepto eliminado' });
    });
});

// ==========================================
// --- RUTAS API: DESTINOS ---
// ==========================================
app.get('/api/destinos', (req, res) => {
    db.query('SELECT * FROM Destinos', (err, results) => {
        if (err) {
            console.error("Error en BD:", err.message); 
            return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
        }
        res.json(results);
    });
});
app.post('/api/destinos', (req, res) => {
    const { clave, descripcion } = req.body;
    db.query('INSERT INTO Destinos (clave, descripcion) VALUES (?, ?)', [clave, descripcion], (err, result) => {
        if (err) {
            console.error("Error en BD:", err.message); 
            return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
        }
        res.json({ mensaje: 'Destino guardado' });
    });
});
app.delete('/api/destinos/:clave', (req, res) => {
    db.query('DELETE FROM Destinos WHERE clave = ?', [req.params.clave], (err, result) => {
        if (err) {
            console.error("Error en BD:", err.message); 
            return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
        }
        res.json({ mensaje: 'Destino eliminado' });
    });
});

// ==========================================
// --- RUTAS API: UNIDADES DE MEDIDA ---
// ==========================================
app.get('/api/unidades', (req, res) => {
    db.query('SELECT * FROM UnidadesMedida', (err, results) => {
        if (err) {
            console.error("Error en BD:", err.message); 
            return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
        }
        res.json(results);
    });
});
app.post('/api/unidades', (req, res) => {
    const { clave, descripcion } = req.body;
    db.query('INSERT INTO UnidadesMedida (clave, descripcion) VALUES (?, ?)', [clave, descripcion], (err, result) => {
        if (err) {
            console.error("Error en BD:", err.message); 
            return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
        }
        res.json({ mensaje: 'Unidad guardada' });
    });
});
app.delete('/api/unidades/:clave', (req, res) => {
    db.query('DELETE FROM UnidadesMedida WHERE clave = ?', [req.params.clave], (err, result) => {
        if (err) {
            console.error("Error en BD:", err.message); 
            return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
        }
        res.json({ mensaje: 'Unidad eliminada' });
    });
});

// ==========================================
// --- RUTAS API: PROVEEDORES ---
// ==========================================
app.get('/api/proveedores', (req, res) => {
    db.query('SELECT * FROM Proveedores', (err, results) => {
        if (err) {
            console.error("Error en BD:", err.message); 
            return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
        }
        res.json(results);
    });
});
app.post('/api/proveedores', (req, res) => {
    const { clave, descripcion, rfc, telefono, correo } = req.body;
    const query = 'INSERT INTO Proveedores (clave, descripcion, rfc, telefono, correo) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [clave, descripcion, rfc, telefono, correo], (err, result) => {
        if (err) {
            console.error("Error en BD:", err.message); 
            return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
        }
        res.json({ mensaje: 'Proveedor guardado' });
    });
});
app.delete('/api/proveedores/:clave', (req, res) => {
    db.query('DELETE FROM Proveedores WHERE clave = ?', [req.params.clave], (err, result) => {
        if (err) {
            console.error("Error en BD:", err.message); 
            return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
        }
        res.json({ mensaje: 'Proveedor eliminado' });
    });
});

// ==========================================
// --- RUTAS API: PRODUCTOS ---
// ==========================================
app.get('/api/productos', (req, res) => {
    db.query('SELECT Productos.idProducto, Productos.clave, Productos.descripcion, Productos.existencia, UnidadesMedida.descripcion AS unidades, Proveedores.descripcion AS proveedor, Productos.precioUnitario AS precio FROM Productos INNER JOIN Proveedores ON Productos.idProveedor = Proveedores.idProveedor INNER JOIN UnidadesMedida ON Productos.idUnidadMedida = UnidadesMedida.idUnidadMedida', (err, results) => {
        if (err) {
            console.error("Error en BD:", err.message); 
            return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
        }
        res.json(results);
    });
});
app.post('/api/productos', (req, res) => {
    const { clave, descripcion, existencia, unidades, proveedor, precio } = req.body;
    
    // El frontend debe enviar el ID (número), no texto.
    const query = 'INSERT INTO Productos (clave, descripcion, existencia, idUnidadMedida, idProveedor, precioUnitario) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [clave, descripcion, existencia, unidades, proveedor, precio], (err, result) => {
        if (err) {
            console.error("Error en BD:", err.message); 
            return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
        }
        res.json({ mensaje: 'Producto guardado' });
    });
});

app.delete('/api/productos/:clave', (req, res) => {
    db.query('DELETE FROM Productos WHERE clave = ?', [req.params.clave], (err, result) => {
        if (err) {
            console.error("Error en BD:", err.message); 
            return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
        }
        res.json({ mensaje: 'Producto eliminado' });
    });
});

// ==========================================
// --- RUTAS API: DOCUMENTOS ---
// ==========================================
//Pregunta a Rodo sobre la consulta que necesita para sus datos
app.get('/api/documentos', (req, res) => {
    const query = `SELECT Documentos.idDocumento, Documentos.noDocumento, Documentos.fecha, Conceptos.descripcion AS concepto, 
                    CASE
                        WHEN DocumentosEntrada.idDocumento IS NOT NULL THEN 'Entrada'
                        WHEN DocumentosSalida.idDocumento IS NOT NULL THEN 'Salida'
                        ELSE 'RegistroHuérfano'
                    END AS tipoDocumento,
                    Proveedores.descripcion AS proveedor,
                    Destinos.descripcion AS destino
                    FROM Documentos 
                    INNER JOIN Conceptos 
                    ON Documentos.idConcepto = Conceptos.idConcepto
                    LEFT JOIN DocumentosEntrada
                    ON Documentos.idDocumento = DocumentosEntrada.idDocumento
                    LEFT JOIN Proveedores
                    ON DocumentosEntrada.idProveedor = Proveedores.idProveedor
                    LEFT JOIN DocumentosSalida
                    ON Documentos.idDocumento = DocumentosSalida.idDocumento
                    LEFT JOIN Destinos
                    ON DocumentosSalida.idDestino = Destinos.idDestino
                    ORDER BY Documentos.fecha DESC;`;
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error en BD:", err.message); 
            return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
        }
        res.json(results);
    });
});

app.get('/api/documentos/:id/detalle', (req, res) => {
    const idDocumento = req.params.id;
    const query = `SELECT
                        Productos.descripcion AS producto,
                        DocumentosProductos.cantidad,
                        DocumentosProductos.subtotal
                   FROM DocumentosProductos
                   INNER JOIN Productos ON DocumentosProductos.idProducto = Productos.idProducto
                   WHERE idDocumento = ?;`;
    db.query(query, [idDocumento], (err, results) => {
        if (err) {
            console.error("Error en BD:", err.message); 
            return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
        }
        res.json(results);
    });
});
/*
//ES UNA VERSIÓN FUNCIONAL, PERO POBRE DE SI MÁS DE 3 USUARIOS ESTÁN INTENTANDO GUARDAR DOCUMENTOS AL MISMO TIEMPO, POR ESO SE RECOMIENDA HACERLO CON TRANSACCIONES Y PROMESAS (VER MÁS ABAJO)
app.post('/api/documentos/entrada', (req, res) => {
    const { noDocumento, fecha, idConcepto, idProveedor, tipo, productos } = req.body;
    const queryDocumento = 'INSERT INTO Documentos (noDocumento, fecha, idConcepto) VALUES (?, ?, ?)';
    db.query(queryDocumento, [noDocumento, fecha, idConcepto], (err, result) => {
        if (err) {
            console.error("Error en BD:", err.message); 
            return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
        }
        const idDocumento = result.insertId;
        const queryEntrada = 'INSERT INTO DocumentosEntrada (idDocumento, idProveedor) VALUES (?, ?)';
        db.query(queryEntrada, [idDocumento, idProveedor], (err, result) => {
            if (err) {
                console.error("Error en BD:", err.message); 
                return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
            }
            const queryProducto = 'INSERT INTO DocumentosProductos (idDocumento, idProducto, cantidad, subtotal) VALUES ?';
            const values = productos.map(p => [idDocumento, p.idProducto, p.cantidad, p.subtotal]);
            db.query(queryProducto, [values], (err, result) => {
                if (err) {
                    console.error("Error en BD:", err.message); 
                    return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
                }
                res.status(201).json({ message: 'Documento de entrada guardado exitosamente.' });
            });
        });
    });
});
*/

app.post('/api/documentos/entrada', async (req, res) => {
    const { numero, fecha, concepto, entidad, movimientos } = req.body;

    // Usamos dbPromesas para esta ruta
    let connection;
    //1. Obtenemos una conexión del pool y la guardamos en una variable para usarla durante toda la ruta (y no perder el contexto de la transacción)
    //usamos try/catch/finally para asegurarnos de liberar la conexión al final, sin importar si hubo error o no
    try {
        connection = await dbPromesas.getConnection();
        //s2. e inicia la transacción atómica
        await connection.beginTransaction();
        // 3. Registrar datos generales y capturar el insertId
        const queryDocumento = 'INSERT INTO Documentos (noDocumento, fecha, idConcepto) VALUES (?, ?, ?)';
        const [resDoc] = await connection.query(queryDocumento, [numero, fecha, concepto]);
        const idGenerado = resDoc.insertId;

        // 4. Registrar en la tabla de Entrada usando el ID capturado
        // Nota: En tu app.js le llamaste "entidad", que para una entrada es el Proveedor
        const queryEntrada = 'INSERT INTO DocumentosEntrada (idDocumento, idProveedor) VALUES (?, ?)';
        await connection.query(queryEntrada, [idGenerado, entidad]);

        // 5. Inserción masiva de los movimientos usando .map()
        if (movimientos && movimientos.length > 0) {
            const queryProducto = 'INSERT INTO DocumentosProductos (idDocumento, idProducto, cantidad, subtotal) VALUES ?';
            // Mapeamos usando los nombres que definiste en tu app.js (producto, cantidad, subtotal)
            const values = movimientos.map(m => [idGenerado, m.producto, m.cantidad, m.subtotal]);
            
            await connection.query(queryProducto, [values]);

            // 6. UPDATE de la tabla Productos (El punto que faltaba en tu checklist)
            // Como las cantidades son diferentes, iteramos para actualizar uno por uno
            for (let item of movimientos) {
                // Al ser entrada, sumamos la cantidad (+)
                const queryUpdate = 'UPDATE Productos SET existencia = existencia + ? WHERE idProducto = ?';
                await connection.query(queryUpdate, [item.cantidad, item.producto]);
            }
        }
        await connection.commit();
        res.status(201).json({ message: 'Guardado exitosamente.' });
    } catch (error) {
        if (connection) await connection.rollback(); 
        console.error("🔥 Error exacto en el backend:", error); 
        
        // Detectamos si el error es por un folio duplicado (Código 1062 de MySQL)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El número de documento ya existe. Por favor, usa otro folio.' });
        }

        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

app.post('/api/documentos/salida', async (req, res) => {
    const { numero, fecha, concepto, entidad, movimientos } = req.body;

    // Usamos dbPromesas para esta ruta
    let connection;
    //1. Obtenemos una conexión del pool y la guardamos en una variable para usarla durante toda la ruta (y no perder el contexto de la transacción)
    //usamos try/catch/finally para asegurarnos de liberar la conexión al final, sin importar si hubo error o no
    try {
        connection = await dbPromesas.getConnection();
        //s2. e inicia la transacción atómica
        await connection.beginTransaction();
        // 3. Registrar datos generales y capturar el insertId
        const queryDocumento = 'INSERT INTO Documentos (noDocumento, fecha, idConcepto) VALUES (?, ?, ?)';
        const [resDoc] = await connection.query(queryDocumento, [numero, fecha, concepto]);
        const idGenerado = resDoc.insertId;

        // 4. Registrar en la tabla de Entrada usando el ID capturado
        // Nota: En tu app.js le llamaste "entidad", que para una entrada es el Proveedor
        const querySalida = 'INSERT INTO DocumentosSalida (idDocumento, idDestino) VALUES (?, ?)';
        await connection.query(querySalida, [idGenerado, entidad]);

        // 5. Inserción masiva de los movimientos usando .map()
        if (movimientos && movimientos.length > 0) {
            const queryProducto = 'INSERT INTO DocumentosProductos (idDocumento, idProducto, cantidad, subtotal) VALUES ?';
            // Mapeamos usando los nombres que definiste en tu app.js (producto, cantidad, subtotal)
            const values = movimientos.map(m => [idGenerado, m.producto, m.cantidad, m.subtotal]);
            
            await connection.query(queryProducto, [values]);

            // 6. UPDATE de la tabla Productos (El punto que faltaba en tu checklist)
            // Como las cantidades son diferentes, iteramos para actualizar uno por uno
            for (let item of movimientos) {
                // 6.1 Primero verificamos cuánta existencia hay
                const queryCheck = 'SELECT existencia, descripcion FROM Productos WHERE idProducto = ?';
                const [rows] = await connection.query(queryCheck, [item.producto]);

                // Validamos por si acaso mandan un ID de producto fantasma
                if (rows.length === 0) {
                    throw new Error(`El producto con ID ${item.producto} no existe en la base de datos.`);
                }

                const existenciaActual = rows[0].existencia;
                const nombreProducto = rows[0].descripcion;

                // 6.2 Evaluamos si alcanza el stock
                if (item.cantidad > existenciaActual) {
                    // Este throw cancela toda la transacción y manda el error a tu catch
                    throw new Error(`Stock insuficiente para "${nombreProducto}". Intentaste sacar ${item.cantidad}, pero solo hay ${existenciaActual} disponibles.`);
                }

                // 6.3 Si pasó la prueba, restamos la cantidad con total seguridad
                const queryUpdate = 'UPDATE Productos SET existencia = existencia - ? WHERE idProducto = ?';
                await connection.query(queryUpdate, [item.cantidad, item.producto]);
            }
        }
        await connection.commit();
        res.status(201).json({ message: 'Guardado exitosamente.' });
    } catch (error) {
        if (connection) await connection.rollback(); 
        console.error("🔥 Error exacto en el backend:", error); 
        
        // Detectamos si el error es por un folio duplicado (Código 1062 de MySQL)
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'El número de documento ya existe. Por favor, usa otro folio.' });
        }

        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});
//No se precisaron necesarios
/*
app.get('/api/documentosEntrada', (req, res) => {
    const query = `SELECT Documentos.idDocumento, Documentos.noDocumento, Documentos.fecha, Conceptos.descripcion AS concepto, Proveedores.descripcion AS proveedor  
                    FROM Documentos 
                    INNER JOIN Conceptos 
                    ON Documentos.idConcepto = Conceptos.idConcepto 
                    INNER JOIN DocumentosEntrada 
                    ON Documentos.idDocumento = DocumentosEntrada.idDocumento
                    INNER JOIN Proveedores
                    ON DocumentosEntrada.idProveedor = Proveedores.idProveedor
                    ORDER BY Documentos.fecha DESC;`;
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error en BD:", err.message); 
            return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
        }
        res.json(results);
    });
});

app.get('/api/documentosSalida', (req, res) => {
    const query = `SELECT Documentos.idDocumento, Documentos.noDocumento, Documentos.fecha, Conceptos.descripcion AS concepto, Destinos.descripcion AS destino  
                    FROM Documentos 
                    INNER JOIN Conceptos 
                    ON Documentos.idConcepto = Conceptos.idConcepto 
                    INNER JOIN DocumentosSalida
                    ON Documentos.idDocumento = DocumentosSalida.idDocumento
                    INNER JOIN Destinos
                    ON DocumentosSalida.idDestino = Destinos.idDestino
                    ORDER BY Documentos.fecha DESC;`;
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error en BD:", err.message); 
            return res.status(500).json({ error: 'Ocurrió un error interno al procesar la solicitud.' }); 
        }
        res.json(results);
    });
});

*/

// Iniciar servidor
app.listen(3000, () => console.log('🚀 Servidor corriendo en http://localhost:3000'));