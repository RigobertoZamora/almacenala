//require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); 
const path = require('path');

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));
/*
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
*/
const db = mysql.createConnection({
    host: "localhost",//process.env.DB_HOST//   localhost seguramente,
    user: "root",//process.env.DB_USER//   root tal vez,
    password:"", //process.env.DB_PASSWORD/ el que le tengas a MySQL,
    database: "final_almacen",//process.env.DB_NAME//  el nombre de la base de datos local que hayas decidido, se recomienda final_almacen,
   
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
    db.query('SELECT Productos.clave, Productos.descripcion, UnidadesMedida.descripcion AS unidades, Proveedores.descripcion AS proveedor, Productos.precioUnitario AS precio FROM Productos INNER JOIN Proveedores ON Productos.idProveedor = Proveedores.idProveedor INNER JOIN UnidadesMedida ON Productos.idUnidadMedida = UnidadesMedida.idUnidadMedida', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});
app.post('/api/productos', (req, res) => {
    const { clave, descripcion, existencia, unidades, proveedor, precio } = req.body;
    
    // El frontend debe enviar el ID (número), no texto.
    const query = 'INSERT INTO Productos (clave, descripcion, existencia, idUnidadMedida, idProveedor, precioUnitario) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(query, [clave, descripcion, existencia, unidades, proveedor, precio], (err, result) => {
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


// ==========================================
// --- RUTAS API: DOCUMENTOS ---
// ==========================================
app.get('/api/documentos', (req, res) => {
    // se añadio aqui las comas y orden del CASE
    const query = `
        SELECT 
            Documentos.idDocumento, 
            Documentos.noDocumento, 
            Documentos.fecha, 
            Conceptos.descripcion AS concepto,
            CASE
                WHEN DocumentosEntrada.idDocumento IS NOT NULL THEN 'Entrada'
                WHEN DocumentosSalida.idDocumento IS NOT NULL THEN 'Salida'
                ELSE 'Registro Huérfano'
            END AS tipoDocumento,
            Proveedores.descripcion AS proveedor,
            Destinos.descripcion AS destino
        FROM Documentos 
        INNER JOIN Conceptos ON Documentos.idConcepto = Conceptos.idConcepto
        LEFT JOIN DocumentosEntrada ON Documentos.idDocumento = DocumentosEntrada.idDocumento
        LEFT JOIN Proveedores ON DocumentosEntrada.idProveedor = Proveedores.idProveedor
        LEFT JOIN DocumentosSalida ON Documentos.idDocumento = DocumentosSalida.idDocumento
        LEFT JOIN Destinos ON DocumentosSalida.idDestino = Destinos.idDestino
        ORDER BY Documentos.fecha DESC;`;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error en BD:", err.message); 
            return res.status(500).json({ error: 'Error al obtener documentos.' }); 
        }
        res.json(results);
    });
});





// ==========================================
// --- RUTAS API: DOCUMENTOS/productos---   aqui creo que se podria unir a la consulta de arriba pero no pude y por eso decidi dividirla 
// ==========================================
//sirve para poder ver los productos relacionados a un documento 
app.get('/api/documentos/:id/detalle', (req, res) => {
    const idDocumento = req.params.id;
    // Consulta que SOLO trae los productos del documento necesario
    const query = `
        SELECT 
            p.clave, 
            p.descripcion, 
            p.precioUnitario, 
            dp.cantidad, 
            dp.subtotal 
        FROM documentosproductos dp
        JOIN productos p ON dp.idProducto = p.idProducto
        WHERE dp.idDocumento = ?
    `;

    db.query(query, [idDocumento], (error, resultados) => {
        if (error) {
            console.error("Error al obtener detalles:", error);
            return res.status(500).json({ error: "Error en la base de datos" });
        }
        res.json(resultados);
    });
});

// ==========================================
// --- RUTAS API: PDF ---
// ==========================================
//para poder descargar el pdf:
const puppeteer = require('puppeteer');
app.get('/api/pdf/:id', async (req, res) => {
    const idDocumento = req.params.id;

    try {
        // Consulta para traer los datos necesarios para generar el pdf, identifica el tipo
        const [rowsDoc] = await db.promise().query(`
            SELECT d.*, 
            prov.descripcion AS proveedor_nombre,
            dest.descripcion AS destino_nombre,
            CASE 
                WHEN de.idDocumento IS NOT NULL THEN 'ENTRADA'
                WHEN ds.idDocumento IS NOT NULL THEN 'SALIDA'
                ELSE 'MOVIMIENTO'
            END AS tipo_detectado
            FROM documentos d
            LEFT JOIN documentosentrada de ON d.idDocumento = de.idDocumento
            LEFT JOIN proveedores prov ON de.idProveedor = prov.idProveedor
            LEFT JOIN documentossalida ds ON d.idDocumento = ds.idDocumento
            LEFT JOIN destinos dest ON ds.idDestino = dest.idDestino
            WHERE d.idDocumento = ?`, [idDocumento]);
        if (!rowsDoc || rowsDoc.length === 0) return res.status(404).send('Documento no encontrado');//por si no lo encuentra
        
        const doc = rowsDoc[0];
        // con el siguiente codigo manejo los datos y controlo los colores viendo si es de entrada o de salida
        const esEntrada = doc.tipo_detectado === 'ENTRADA';
        const tituloTexto = doc.tipo_detectado;
        const colorTitulo = esEntrada ? '#198754' : '#dc3545'; // Verde para Entrada, Rojo para Salida
        const etiquetaEntidad = esEntrada ? 'PROVEEDOR' : 'DESTINO';//para poner el texto que corresponda, basicamente pregunta si es de entrada ya que ese es el que tiene proveedor, de no ser asi pone destino
        const nombreEntidad = esEntrada ? doc.proveedor_nombre : doc.destino_nombre;//igual pero ahora pone el nombre

        // Consulta de productos para poder poner los datos de los mismos en el pdf
        const [rowsProds] = await db.promise().query(`
            SELECT dp.cantidad, dp.subtotal, p.descripcion, p.clave, p.precioUnitario
            FROM documentosproductos dp
            INNER JOIN productos p ON dp.idProducto = p.idProducto
            WHERE dp.idDocumento = ?`, [idDocumento]);

        //Codigo para colocar los datos en la tabla gracias a un ciclo 
        let filasHtml = '';
        let totalFinal = 0;
        rowsProds.forEach(p => {
            totalFinal += parseFloat(p.subtotal || 0);
            filasHtml += `
                <tr>
                    <td style="color: #666;">${p.clave}</td>
                    <td>${p.descripcion}</td>
                    <td class="text-center">$${parseFloat(p.precioUnitario).toFixed(2)}</td>
                    <td class="text-center">${p.cantidad}</td>
                    <td class="text-end fw-bold">$${parseFloat(p.subtotal).toFixed(2)}</td>
                </tr>`;
        });

        // HTML del pdf, de esto depende la estructura del mismo que se va a descargar
        const htmlContent = `
        <html>
            <head>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { font-family: 'Helvetica', sans-serif; padding: 30px; }
                    .header-border { border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 25px; }
                    .tipo-doc { font-size: 32px; font-weight: 900; color: ${colorTitulo}; }
                    .label-gray { font-size: 11px; color: #777; font-weight: bold; }
                    .info-val { font-size: 18px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="header-border d-flex justify-content-between align-items-end">
                    <div>
                        <h1 class="fw-bold m-0">LA GRAN EMPRESA</h1>
                        <p class="m-0 text-muted">Control de Almacén e Inventarios</p>
                    </div>
                    <div class="text-end">
                        <div class="tipo-doc">${tituloTexto}</div>
                        <p class="m-0 fw-bold">FOLIO: #${doc.noDocumento}</p>
                        <p class="m-0 small">Fecha: ${new Date(doc.fecha).toLocaleDateString()}</p>
                    </div>
                </div>
                    <div class="col-12 d-flex align-items-baseline gap-2 mb-2">
                        <div class="label-gray">${etiquetaEntidad}:</div>
                        <div class="info-val">${nombreEntidad || 'No registrado'}</div>
                    </div>  
                <table class="table table-bordered m-0">
                    <thead class="table-dark">
                        <tr>
                            <th>Clave</th>
                            <th>Producto</th>
                            <th class="text-center">Precio Unit.</th>
                            <th class="text-center">Cant.</th>
                            <th class="text-end">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>${filasHtml}</tbody>
                </table>
                <div class="d-flex justify-content-end mt-4">
                    <div class="p-3 bg-light border text-end" style="min-width: 250px;">
                        <span class="fw-bold me-3">TOTAL:</span>
                        <span class="fs-2 fw-bold">$${totalFinal.toFixed(2)}</span>
                    </div>
                </div>
                <div style="margin-top: 100px;" class="text-center">
                    <div style="width: 250px; border-top: 2px solid #000; margin: 0 auto;"></div>
                    <p class="fw-bold mt-2">Firma de Responsable</p>
                </div>
            </body>
        </html>`;
        //Puppeteer es una librería de Google que funciona como un "navegador invisible"
        //basicamente lo que pasa aqui es que se abre un google oculto pega el html anterior, espera a que se carguen los estilos, Toma una "foto" en formato PDF tamaño A4 y la guarda en la memoria de tu servidor y despues cierra ese google  
        const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();
        //despues de la foto con el PDF en la memoria, gracias a lo siguiente se empaqueta el archivo. se le pone el nombre, se avisa a la pc que es documento PDF, y se envia de regreso al botón de descarga en el navegador.
        res.setHeader('Content-Disposition', `attachment; filename="Folio_${doc.noDocumento}.pdf"`);
        res.contentType("application/pdf");
        res.send(pdfBuffer);
        //manda un error si sucede algo mal
    } catch (error) {
        console.error(error);
        res.status(500).send('Error: ' + error.message);
    }
});
// Iniciar servidor
app.listen(3000, () => console.log('🚀 Servidor corriendo en http://localhost:3000'));