
const API_URL = 'http://localhost:3000/api/';
/*https://api-almacen-backend.onrender.com/api
*/

let catalogoActual = ""; // Guardará 'conceptos', 'destinos', etc.

// ==========================================
// 1. NAVEGACIÓN Y VISTAS
// ==========================================
function navegar(idVista) {
    document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
    document.getElementById(idVista).classList.add('activa');
}

function abrirCatalogo(nombreCatalogo, idVistaDestino) {
    catalogoActual = nombreCatalogo.toLowerCase(); 
    navegar(idVistaDestino);

    let vistaActiva = document.getElementById(idVistaDestino);
    let titulo = vistaActiva.querySelector('.titulo-catalogo');
    let formulario = vistaActiva.querySelector('.formCatalogo');

    if (titulo) titulo.innerText = "Catálogo de " + nombreCatalogo;
    if (formulario) formulario.reset();

    if (catalogoActual === 'productos') {
        cargarSelectoresProductos();
    }
}

async function abrirTabla(idVista){
    // 1. Mostramos la vista en pantalla
    navegar(idVista);

    // 2. Extraemos el nombre de la tabla (ej. de "reporte-conceptos" sacamos "conceptos")
    const nombreTabla = idVista.replace('reporte-', '');
    
    // 3. Apuntamos al cuerpo de la tabla correcta en el HTML
    const tbody = document.getElementById(`tabla-${nombreTabla}`);
    if (!tbody) return;

    // Ponemos un mensaje de carga mientras el servidor responde
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Cargando datos...</td></tr>`;

    try {
        // 4. Consultamos a Node.js (GET)
        const respuesta = await fetch(`${API_URL}${nombreTabla}`);
        const datos = await respuesta.json();
        
        tbody.innerHTML = ""; // Limpiamos el mensaje de carga

        // Si la base de datos está vacía
        if (datos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">No hay registros en ${nombreTabla}</td></tr>`;
            return;
        }

        // 5. Dibujamos las filas con la información
        datos.forEach(item => {
            // Generamos las columnas base que tienen todas las tablas
            let filasHTML = `<td>${item.clave}</td><td>${item.descripcion}</td>`;
            
            // Si es productos, añadimos las columnas extra
            if (nombreTabla === 'productos') {
                filasHTML += `<td>${item.unidades || '-'}</td><td>${item.proveedor || '-'}</td><td>$${item.precio || '0.00'}</td>`;
            }
            // Si es proveedores, añadimos las columnas extra
            if (nombreTabla === 'proveedores') {
                filasHTML += `<td>${item.rfc || '-'}</td>`;
            }

            if (nombreTabla === 'proveedores') {
                filasHTML += `<td>${item.telefono || '-'}</td>`;
            }

            if (nombreTabla === 'proveedores') {
                filasHTML += `<td>${item.correo || '-'}</td>`;
            }

            // Agregamos el botón de eliminar al final
            filasHTML += `
            <td>
                <button class="btn btn-danger btn-sm" onclick="eliminarRegistro('${nombreTabla}', '${item.clave}')">
                    Borrar
                </button>
            </td>`;

            tbody.innerHTML += `<tr>${filasHTML}</tr>`;
        });

    } catch (error) {
        console.error(`Error al cargar ${nombreTabla}:`, error);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger fw-bold">Error de conexión con la base de datos</td></tr>`;
    }
}

async function eliminarRegistro(tabla, clave) {
    if (confirm(`¿Estás seguro de eliminar el registro ${clave} de ${tabla}?`)) {
        try {
            await fetch(`${API_URL}${tabla}/${clave}`, { method: 'DELETE' });
            // Recargamos la tabla para ver que desapareció
            abrirTabla(`reporte-${tabla}`); 
        } catch (error) {
            alert("No se pudo eliminar el registro.");
        }
    }
}

// ==========================================
// 2. GUARDADO DINÁMICO EN BASE DE DATOS
// ==========================================
// Seleccionamos TODOS los formularios y evitamos el error null
document.querySelectorAll('.formCatalogo').forEach(formulario => {
    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // e.target es el formulario específico que acabas de enviar. 
        // Usamos querySelector interno para que no se confunda con los IDs repetidos en tu HTML.
        // Usamos el operador '?.' para evitar errores si el campo no existe en esa vista
        const datos = {
            clave: e.target.querySelector('#clave')?.value,
            descripcion: e.target.querySelector('#desc')?.value,
            existencia: parseFloat(e.target.querySelector('#existencia')?.value) || 0,
            rfc: e.target.querySelector('#rfc')?.value,
            telefono: e.target.querySelector('#tel')?.value,
            correo: e.target.querySelector('#correo')?.value,
            unidades: parseInt(e.target.querySelector('#uni')?.value),
            proveedor: parseInt(e.target.querySelector('#prov')?.value),
            precio: parseFloat(e.target.querySelector('#precio')?.value)
        };

        const URL_DINAMICA = `${API_URL}${catalogoActual}`;

        try {
            console.log(datos);
            await fetch(URL_DINAMICA, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });

            alert(`Guardado exitosamente en el catálogo de: ${catalogoActual}`);
            formulario.reset();
        } catch (error) {
            console.error("Error al guardar:", error);
            alert("Hubo un error de conexión con la base de datos.");
        }
    });
});

//-------------------------------------------------------------------


// ==========================================
// 3. LÓGICA DE DOCUMENTOS Y MOVIMIENTOS
// ==========================================
let movimientosActuales = [];
let tipoDocumentoActual = "";

function abrirDocumento(tipo) {
    tipoDocumentoActual = tipo;
    movimientosActuales = [];
    document.getElementById('titulo-doc').innerText = "Documento de " + tipo;
    document.getElementById('doc-tipo').value = tipo;
    document.getElementById('lbl-entidad').innerText = (tipo === 'Entrada') ? "Proveedor" : "Destino";
    // ---Cargar los datos de la base de datos ---
    if (tipo === 'Entrada') {
        cargarSelect('proveedores', 'doc-entidad');
    } else {
        cargarSelect('destinos', 'doc-entidad');
    }
    cargarSelect('conceptos', 'doc-concepto');
    actualizarTabla();
    navegar('vista-documentos');
}

async function cargarSelect(tabla, idSelect) {
    const select = document.getElementById(idSelect); 
    // Ponemos un mensaje de carga
    select.innerHTML = '<option value="">Cargando...</option>';
    try {
        const response = await fetch(`${API_URL}${tabla}`);
        const datos = await response.json();
        select.innerHTML = '<option value="">Seleccione una opción...</option>';
        datos.forEach(item => {
            // Usamos 'descripcion' o 'nombre' dependiendo de la tabla
            const texto = item.descripcion || item.nombre || item.nombre_proveedor;
            const id = item.id || item.clave;
            select.innerHTML += `<option value="${id}">${texto}</option>`;
        });
    } catch (error) {
        console.error(`Error al cargar ${tabla}:`, error);
        select.innerHTML = '<option value="">Error al cargar datos</option>';
    }
}


    // --------------------------------------------------

const inPre = document.getElementById('m-precio');
const inCan = document.getElementById('m-cant');
const inSub = document.getElementById('m-sub');

if(inPre && inCan && inSub) {
    [inPre, inCan].forEach(input => {
        input.addEventListener('input', () => {
            const res = (parseFloat(inPre.value) || 0) * (parseFloat(inCan.value) || 0);
            inSub.value = res.toFixed(2);
        });
    });
}

function agregarMovimiento() {
    const p = document.getElementById('m-prod').value;
    const pre = parseFloat(inPre.value) || 0;
    const can = parseFloat(inCan.value) || 0;

    if(p && can > 0) {
        movimientosActuales.push({ 
            no: movimientosActuales.length + 1, 
            producto: p, 
            precio: pre, 
            cantidad: can, 
            subtotal: pre * can 
        });
        actualizarTabla();
        bootstrap.Modal.getInstance(document.getElementById('modalProd')).hide();
        document.getElementById('m-prod').value = ""; inPre.value = ""; inCan.value = ""; inSub.value = "";
    }
}

function actualizarTabla() {
    const cuerpo = document.getElementById('tabla-movimientos');
    if(!cuerpo) return;
    
    cuerpo.innerHTML = "";
    let total = 0;

    movimientosActuales.forEach(m => {
        total += m.subtotal;
        cuerpo.innerHTML += `<tr>
            <td>${m.no}</td><td>${m.producto}</td><td>${m.cantidad}</td>
            <td>$${m.precio.toFixed(2)}</td><td>$${m.subtotal.toFixed(2)}</td>
        </tr>`;
    });
    document.getElementById('doc-total').innerText = `$${total.toFixed(2)}`;
}





function guardarDocumentoCompleto() {
    const dataFinal = {
        numero: document.getElementById('doc-numero').value,
        fecha: document.getElementById('doc-fecha').value,
        tipo: tipoDocumentoActual,
        entidad: document.getElementById('doc-entidad').value,
        concepto: document.getElementById('doc-concepto').value,
        items: movimientosActuales
    };
    console.log("Objeto preparado para la BD:", dataFinal);
    alert("Documento generado. Revisa la consola.");
}






// ==========================================
// 4. CORRECCIÓN DEL SUBMENÚ (Este es el que se bloqueaba)
// ==========================================
document.addEventListener("DOMContentLoaded", function(){
    let submenus = document.querySelectorAll('.dropdown-submenu > a');
    if (submenus.length > 0) {
        submenus.forEach(function(submenu){
            submenu.addEventListener('click', function (e) {
                e.preventDefault();       
                e.stopPropagation();      
                
                let submenuMenu = this.nextElementSibling;
                submenuMenu.classList.toggle('show');
            });
        });
    }
});

async function cargarSelectoresProductos() {
    try {
        // 1. Pedimos los datos al backend (hacemos dos peticiones a la vez)
        const [resProv, resUni] = await Promise.all([
            fetch(`${API_URL}proveedores`),
            fetch(`${API_URL}unidades`)
        ]);

        const proveedores = await resProv.json();
        const unidades = await resUni.json();

        // 2. Apuntamos a los <select> del HTML
        const selectProv = document.getElementById('prov');
        const selectUni = document.getElementById('uni');

        // 3. Llenamos las opciones (el 'value' guarda la clave numérica, el texto muestra la descripción)
        selectProv.innerHTML = '<option value="">Selecciona un proveedor...</option>' + 
            proveedores.map(p => `<option value="${p.idProveedor}">${p.descripcion}</option>`).join('');

        selectUni.innerHTML = '<option value="">Selecciona una unidad...</option>' + 
            unidades.map(u => `<option value="${u.idUnidadMedida}">${u.descripcion}</option>`).join('');

    } catch (error) {
        console.error("Error cargando selectores:", error);
    }
}









// ==========================================
// LÓGICA DE DOCUMENTOS DE ENTRADA Y SALIDA
// ==========================================


//funcion para poder mostrar la parte de los reportes:
// Variable global para guardar lo que viene de la DB
let todosLosDocumentos = []; // Variable global para no recargar la DB a cada rato
function reporte(idSeccion) {
    const secciones = document.querySelectorAll('.seccion');
    secciones.forEach(sec => sec.style.display = 'none');
    const seccionAMostrar = document.getElementById(idSeccion);
    if (seccionAMostrar) {
        seccionAMostrar.style.display = 'block';
        // Si entramos a reportes, traemos los datos de la base de datos
        if (idSeccion === 'documents-page') {
            obtenerDatosServidor();
        }
    }
}

async function obtenerDatosServidor() {
    const contenedor = document.getElementById('contenedor-bloques');
    contenedor.innerHTML = '<p class="text-center w-100">Cargando reportes...</p>';

    try {
        const res = await fetch('http://localhost:3000/api/documentos');
        todosLosDocumentos = await res.json();
        // Por defecto mostramos "Ambos"
        mostrarBloques('ambos');
    } catch (error) {
        contenedor.innerHTML = '<p class="text-center text-danger w-100">Error de conexión</p>';
    }
}

function mostrarBloques(filtro) {
    const contenedor = document.getElementById('contenedor-bloques');
    contenedor.innerHTML = ''; 
    const filtrados = todosLosDocumentos.filter(doc => {
        if (filtro === 'ambos') return true;
        return doc.tipoDocumento.toLowerCase() === filtro.toLowerCase();
    });
    filtrados.forEach(doc => {
        const color = doc.tipoDocumento === 'Entrada' ? '#28a745' : '#dc3545';
        
        // Lógica de datos
        const nombreEntidad = doc.tipoDocumento === 'Entrada' ? doc.proveedor : doc.destino;
        const prefijo = doc.tipoDocumento === 'Entrada' ? 'Proveedor: ' : 'Destino: ';
        contenedor.innerHTML += `
            <div class="card-documento" onclick="verDetallePdf(${doc.idDocumento})">
                <div class="d-flex justify-content-between align-items-center">
                    <span style="color: ${color}; font-weight: 800; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
                        ${doc.tipoDocumento}
                    </span>
                    <span class="text-muted small fw-bold">NO.#${doc.noDocumento}</span>
                </div>
                <h3 style="font-size: 18px; margin: 12px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    <span style="font-size: 12px; color: #888; font-weight: 400; text-transform: uppercase;">${prefijo}</span>
                    <span style="font-weight: 700;">${nombreEntidad || 'Sin registro'}</span>
                </h3>
                <div class="footer-card">
                    <span class="small text-secondary">${new Date(doc.fecha).toLocaleDateString()}</span>
                    <div style="background: #f8f9fa; padding: 5px 10px; border-radius: 4px;">
                         <i class="bi bi-file-earmark-pdf text-danger"></i>
                         <span class="ms-1 small fw-bold" style="font-size: 10px;">PDF</span>
                    </div>
                </div>
                <div style="height: 3px; background: ${color}; width: 100%; position: absolute; bottom: 0; left: 0;"></div>
            </div>
        `;
    });
}
// Se Escucha para el cambio de posición (Slider)
document.getElementById('pos-entrada')?.addEventListener('change', () => mostrarBloques('entrada'));
document.getElementById('pos-medio')?.addEventListener('change', () => mostrarBloques('ambos'));
document.getElementById('pos-salida')?.addEventListener('change', () => mostrarBloques('salida'));


//funcion para poder ver los datos de cuando vas a preview del documento
async function verDetallePdf(id) {
    const docPrincipal = todosLosDocumentos.find(d => d.idDocumento == id);
    if (!docPrincipal) {
        console.error("No se encontró el doc con ID:", id);
        return;
    }
    try {
        const response = await fetch(`http://localhost:3000/api/documentos/${id}/detalle`);
        const detalles = await response.json();
        // Lógica de detección de tipo 
        const tipo = (docPrincipal.tipoDocumento || "").toLowerCase();
        const esEntrada = tipo === 'entrada';
        // Llenar campos básicos
        document.getElementById('pdf-tipo').innerText = esEntrada ? 'ENTRADA' : 'SALIDA';
        document.getElementById('pdf-tipo').style.color = esEntrada ? '#198754' : '#dc3545';
        document.getElementById('pdf-folio').innerText = docPrincipal.noDocumento || id;
        document.getElementById('pdf-fecha').innerText = new Date(docPrincipal.fecha).toLocaleDateString();
        // Etiqueta de entidad
        const etiqueta = document.getElementById('pdf-etiqueta-entidad');
        if(etiqueta) etiqueta.innerText = esEntrada ? 'PROVEEDOR:' : 'DESTINO:';
        // Nombre de entidad 
        const nombreEntidad = esEntrada ? docPrincipal.proveedor : docPrincipal.destino;
        document.getElementById('pdf-entidad').innerText = nombreEntidad || 'No registrado';
        // Tabla de productos
        const tablaCuerpo = document.getElementById('pdf-tabla-cuerpo');
        tablaCuerpo.innerHTML = '';
        let sumaTotal = 0;
    detalles.forEach(p => {
        const sub = parseFloat(p.subtotal || 0);
        sumaTotal += sub;

        tablaCuerpo.innerHTML += `
            <tr>
                <td class="text-muted small">${p.clave || '---'}</td>
                <td>${p.descripcion || 'Sin descripción'}</td>
                <td class="text-center">$${parseFloat(p.precioUnitario || 0).toFixed(2)}</td>
                <td class="text-center">${p.cantidad || 0}</td>
                <td class="text-end fw-bold">$${sub.toFixed(2)}</td>
            </tr>`;
    });
    document.getElementById('pdf-total').innerText = `$${sumaTotal.toFixed(2)}`;

    // Configurar descarga
        document.getElementById('btn-descargar-server').onclick = async function() {
            // Guardar el contenido original y bloquear el botón
            const contenidoOriginal = this.innerHTML;
            this.disabled = true;
            this.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Descargando...';

            try {
                // Hacer la petición al servidor esperando la respuesta
                const res = await fetch(`http://localhost:3000/api/pdf/${id}`);
                if (!res.ok) throw new Error("Error al generar el PDF en el servidor");
                //Convertir respuesta a archivo (Blob)
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                // Crear enlace invisible y forzar el clic para descargarlo
                const a = document.createElement('a');
                a.href = url;
                a.download = `Documento_${docPrincipal.noDocumento || id}.pdf`; // Nombre automático, aqui se puede cambiar si queremos que diga otra cosa o puede estar pondiente si hacemos un menu en donde el usuario pueda poner el nombre antes de descargar
                document.body.appendChild(a);
                a.click(); 
                // Limpiar la memoria
                a.remove();
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error("Error al descargar:", error);
                alert("Hubo un error al descargar el PDF.");
            } finally {
                //Restaurar el botón, Esto solo pasa cuando el archivo ya se descargó
                this.disabled = false;
                this.innerHTML = contenidoOriginal;
            }
        };
        // Mostrar sección
        document.getElementById('documents-page').style.display = 'none';
        document.getElementById('pdf-view-page').style.display = 'block';
    } catch (error) {
        console.error("Error en el fetch:", error);
    }
}


//funcion para mostrar los documentos al hacer una busqueda en la pantalla principal
function ejecutarBusqueda() {
    const textoBusqueda = document.getElementById('input-busqueda').value.toLowerCase();
    const criterio = document.getElementById('buscar-por').value;
    // Obtenemos qué tipo (Entrada/Salida/Ambos) está seleccionado en el slider de arriba
    const selectorActivo = document.querySelector('input[name="posicion"]:checked').id;
    const tipoFiltro = selectorActivo === 'pos-entrada' ? 'entrada' : 
                       selectorActivo === 'pos-salida' ? 'salida' : 'ambos';
    // Filtramos por el tipo (Entrada/Salida/Ambos)
    let resultados = todosLosDocumentos.filter(doc => {
        if (tipoFiltro === 'ambos') return true;
        return doc.tipoDocumento.toLowerCase() === tipoFiltro;
    });

    //Luego filtramos por lo que el usuario escribió
    resultados = resultados.filter(doc => {
        if (criterio === 'numero') {
            return doc.noDocumento.toString().includes(textoBusqueda);
        } else {
            const entidad = (doc.tipoDocumento === 'Entrada' ? doc.proveedor : doc.destino) || "";
            const concepto = doc.concepto || "";
            return entidad.toLowerCase().includes(textoBusqueda) || 
                   concepto.toLowerCase().includes(textoBusqueda);
        }
    });
    //Pintamos solo los resultados
    pintarBloquesFiltrados(resultados);
}
// Función auxiliar para no repetir código, es la que se utiliza para cuando queremos ahora si poner los bloques de nuevo
function pintarBloquesFiltrados(lista) {
    const contenedor = document.getElementById('contenedor-bloques');
    contenedor.innerHTML = '';
    if (lista.length === 0) {
        contenedor.innerHTML = '<p class="text-center w-100 text-muted">No se encontraron documentos...</p>';
        return;
    }
    lista.forEach(doc => {
        const color = doc.tipoDocumento === 'Entrada' ? '#28a745' : '#dc3545';
        const entidad = doc.tipoDocumento === 'Entrada' ? doc.proveedor : doc.destino;
        contenedor.innerHTML += `
            <div class="card-documento" onclick="verDetallePdf(${doc.idDocumento})">
                <div class="d-flex justify-content-between align-items-center">
                    <span style="color: ${color}; font-weight: 800; font-size: 11px; letter-spacing: 1px; text-transform: uppercase;">
                        ${doc.tipoDocumento}
                    </span>
                    <span class="text-muted small fw-bold">#${doc.noDocumento}</span>
                </div>
                <h5>${entidad || 'Sin registro'}</h5>
                <p class="concepto-txt">${doc.concepto}</p>
                <div class="footer-card">
                    <span class="small text-secondary">${new Date(doc.fecha).toLocaleDateString()}</span>
                    <div style="background: #f8f9fa; padding: 5px 10px; border-radius: 4px;">
                         <i class="bi bi-file-earmark-pdf text-danger"></i>
                         <span class="ms-1 small fw-bold" style="font-size: 10px;">PDF</span>
                    </div>
                </div>
                <div style="height: 3px; background: ${color}; width: 100%; position: absolute; bottom: 0; left: 0;"></div>
            </div>
        `;
    });
}

let ordenActual = 'reciente';
function cambiarOrden(criterio, elemento) {
    ordenActual = criterio;

    // Manejar aspecto visual de los botones
    document.querySelectorAll('.btn-orden').forEach(btn => btn.classList.remove('active'));
    elemento.classList.add('active');
    // Aplicar la lógica de ordenamiento a la lista global
    todosLosDocumentos.sort((a, b) => {
        if (criterio === 'reciente') {
            return new Date(b.fecha) - new Date(a.fecha);
        } else if (criterio === 'id') {
            return a.noDocumento - b.noDocumento;
        } else if (criterio === 'alfabetico') {
            const entidadA = (a.tipoDocumento === 'Entrada' ? a.proveedor : a.destino) || "";
            const entidadB = (b.tipoDocumento === 'Entrada' ? b.proveedor : b.destino) || "";
            return entidadA.localeCompare(entidadB);
        }
    });
    //Volver a mostrar los bloques con el filtro actual del selector principal utilizando la funcion anterior
    const filtroActivo = document.querySelector('input[name="posicion"]:checked').id;
    const tipoMap = { 'pos-entrada': 'entrada', 'pos-medio': 'ambos', 'pos-salida': 'salida' };
    mostrarBloques(tipoMap[filtroActivo]);
}
//para cuando damos en el boton de regresar en ver el preview del documento
function regresarALista() {
    document.getElementById('pdf-view-page').style.display = 'none';
    document.getElementById('documents-page').style.display = 'block';
}



