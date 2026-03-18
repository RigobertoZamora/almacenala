const API_URL = 'https://api-almacen-backend.onrender.com';
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
                filasHTML += `<td>${item.unidades || '-'}</td><td>$${item.precio || '0.00'}</td>`;
            }
            // Si es proveedores, añadimos las columnas extra
            if (nombreTabla === 'proveedores') {
                filasHTML += `<td>${item.rfc || '-'}</td>`;
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
            rfc: e.target.querySelector('#rfc')?.value,
            telefono: e.target.querySelector('#tel')?.value,
            correo: e.target.querySelector('#correo')?.value,
            unidades: e.target.querySelector('#uni')?.value,
            proveedor: e.target.querySelector('#prov')?.value,
            precio: e.target.querySelector('#precio')?.value
        };

        const URL_DINAMICA = `${API_URL}${catalogoActual}`;

        try {
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
    actualizarTabla();
    navegar('vista-documentos');
}

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