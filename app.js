const API_URL = 'https://api-almacen-backend.onrender.com/api/'; // Cambia el puerto si tu servidor usa otro
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
        const valorDescripcion = [e.target.querySelector('#desc')?.value || '', e.target.querySelector('#clave')?.value || '']; 
        const tieneEtiquetasHTML = /[<>]/g.test(valorDescripcion);
        if (tieneEtiquetasHTML) {
            alert("El formulario no debe contener etiquetas HTML :), solo texto limpio.");
            return; 
        }
        
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
// Al abrir un documento, se carga la información necesaria según si es entrada o salida. Esto incluye el título, los selects de proveedores/destinos, conceptos y productos. También se limpia la tabla de movimientos para empezar desde cero.
function abrirDocumento(tipo) {
    tipoDocumentoActual = tipo;
    movimientosActuales = [];
    document.getElementById('titulo-doc').innerText = "Documento de " + tipo;
    document.getElementById('doc-tipo').value = tipo;
    document.getElementById('lbl-entidad').innerText = (tipo === 'Entrada') ? "Proveedor" : "Destino";
    // ---Cargar los datos de la base de datos ---
    if (tipo === 'Entrada') {
        cargarSelect('proveedores', 'doc-entidad','NA');
    } else {
        cargarSelect('destinos', 'doc-entidad','NA');
    }
    cargarSelect('conceptos', 'doc-concepto','NA');
    cargarSelect('productos', 'm-prod', tipo);
    actualizarTabla();
    navegar('vista-documentos');
}
//Se cargan selects cada vez que se abre el modal para agregar un movimiento, así se asegura que el usuario siempre tenga la información más actualizada de productos, destinos, proveedores y conceptos.
async function cargarSelect(tabla, idSelect, tipo) {
    const select = document.getElementById(idSelect); 
    // Ponemos un mensaje de carga
    select.innerHTML = '<option value="" selected disabled>Cargando...</option>';
    try {
        const response = await fetch(`${API_URL}${tabla}`);
        const datos = await response.json();
        select.innerHTML = '<option value="" selected disabled>Seleccione una opción...</option>';
        datos.forEach(item => {
            if(tipo!='Salida'){
                const texto = item.descripcion;
                const id = item.idDestino || item.idProveedor || item.idConcepto || item.idProducto;
                select.innerHTML += `<option value="${id}">${texto}</option>`;
                console.log(id,texto)
            }else{
                if(item.existencia > 0){
                    const texto = item.descripcion + " (Exist: " + item.existencia + ")";
                    const id = item.idProducto;
                    select.innerHTML += `<option value="${id}">${texto}</option>`;
                }
            }
        });
    } catch (error) {
        console.error(`Error al cargar ${tabla}:`, error);
        select.innerHTML = '<option value="">Error al cargar datos</option>';
    }
}


 // ------------ GUARDADO DINÁMICO DE DOCUMENTOS -------------------- //
//Variables de los inputs para calcular el subtotal dinámicamente cada vez que el usuario modifique el precio o la cantidad
const inPre = document.getElementById('m-precio');
const inCan = document.getElementById('m-cant');
const inSub = document.getElementById('m-sub');
const precios = [];
const nombres = [];
//Evaluar que los inputs existan antes de agregar los event listeners para evitar errores null
//Después de cada input, se hace el cálculo del subtotal y se actualiza el campo correspondiente. Se hace en ambos inputs para que el usuario pueda modificar cualquiera de los dos y siempre tener el subtotal actualizado.
if(inPre && inCan && inSub) {
    [inPre, inCan].forEach(input => {
        input.addEventListener('input', () => {
            const res = (parseFloat(inPre.value) || 0) * (parseFloat(inCan.value) || 0);
            inSub.value = res.toFixed(2);
        });
    });
}
// Agregar un movimiento al documento actual (entrada o salida)
function agregarMovimiento() {
    const p = parseInt(document.getElementById('m-prod').value);
    const pre = parseFloat(inPre.value) || 0;
    precios.push(pre);
    const can = parseFloat(inCan.value) || 0;
    const descripcion = document.getElementById('m-prod').selectedOptions[0]?.text || "Producto desconocido";
    nombres.push(descripcion);
    if(p && can > 0) {
        movimientosActuales.push({ 
            no: movimientosActuales.length + 1, 
            producto: p, 
            cantidad: can, 
            subtotal: pre * can 
        });
        actualizarTabla(descripcion);
        bootstrap.Modal.getInstance(document.getElementById('modalProd')).hide();
        document.getElementById('m-prod').value = ""; inPre.value = ""; inCan.value = ""; inSub.value = "";
    }
}
//Actualizar la tabla de movimientos cada vez que se agrega uno nuevo o se envía el documento
function actualizarTabla() {
    const cuerpo = document.getElementById('tabla-movimientos');
    if(!cuerpo) return;
    
    cuerpo.innerHTML = "";
    let total = 0;

    movimientosActuales.forEach(m => {
        total += m.subtotal;
        cuerpo.innerHTML += `<tr>
            <td>${m.no}</td><td>${nombres[m.no - 1]}</td><td>${m.cantidad}</td>
            <td>$${precios[m.no - 1].toFixed(2)}</td><td>$${m.subtotal.toFixed(2)}</td>
        </tr>`;
    });
    document.getElementById('doc-total').innerText = `$${total.toFixed(2)}`;
}
//Envío de documento de salida o entrada
document.querySelectorAll('.formDocumentos').forEach(formulario => {
    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Armamos UN solo objeto con toda la información
        const payload = {
            numero: parseInt(document.getElementById('doc-numero').value) || 0,
            fecha: document.getElementById('doc-fecha').value,
            concepto: parseInt(document.getElementById('doc-concepto').value) || 0,
            entidad: parseInt(document.getElementById('doc-entidad').value) || 0,
            tipo: document.getElementById('doc-tipo').value.toLowerCase(), // "entrada" o "salida"
            movimientos: movimientosActuales // <- Mandamos el array completo aquí
        };

        console.log("Enviando transacción completa:", payload);

        // 2. Hacemos un SOLO fetch a una ruta que maneje toda la transacción
        try {
            // Se define la ruta dinámicamente según si es entrada o salida
            let URL_DINAMICA = `${API_URL}documentos/${payload.tipo}`; 
            console.log("URL a la que se enviará la transacción:", URL_DINAMICA);

            // CORRECCIÓN: Guardar el resultado del fetch en la variable "response"
            const response = await fetch(URL_DINAMICA, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload) 
            });
            
            // Ahora response sí existe y tiene la propiedad .ok
            if (response.ok) {
                alert(`Guardado exitosamente.`);
                const inputTipo = document.getElementById('doc-tipo');
                const tipoGuardado = inputTipo.value;
                formulario.reset();
                inputTipo.value = tipoGuardado;
                movimientosActuales = []; // Vaciamos la lista local
                actualizarTabla(); // Limpiamos la tabla visual
                cargarSelect('productos', 'm-prod', tipoGuardado); // Recargamos productos para actualizar existencias
            } else {
                throw new Error("Error en la respuesta del servidor");
            }
        } catch (error) {
            console.error("Error al guardar la transacción:", error);
            alert("Hubo un error de conexión con la base de datos, verifica tus datos.");
        }
    });
});
/*
//Lógica fallida por sobrecarga al servidor y vulnerabilidad de intercepción de datos. Se dejó como referencia para futuras mejoras con WebSockets o similar.
document.querySelectorAll('.formDocumentos').forEach(formulario => {
    catalogoActual = "documentos"; // Aseguramos que el endpoint sea 'documentos' para esta sección
    tipo = "/"+document.getElementById('doc-tipo').value.toLowerCase(); // "/entrada" o "/salida"
    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();
        let nuevoDocumento = 0;
        const dataDocumentos = {
            numero: parseInt(document.getElementById('doc-numero').value) || 0,
            fecha: document.getElementById('doc-fecha').value,
            concepto: parseInt(document.getElementById('doc-concepto').value) || 0,
        };
        console.log("Objeto preparado para la BD, tabla principal:", dataDocumentos);
        alert("Documento generado. Revisa la consola.");
        let URL_DINAMICA = `${API_URL}${catalogoActual}`;
        try {
            console.log(dataDocumentos);
            await fetch(URL_DINAMICA, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataDocumentos)
            });
        } catch (error) {
            console.error("Error al guardar:", error);
            alert("Hubo un error de conexión con la base de datos 1.");
        }
        try {
            const response = await fetch(`${API_URL}${catalogoActual}`);
            const datos = await response.json();
            datos.forEach(item => {
                if(item.noDocumento == dataDocumentos.numero)
                    nuevoDocumento = parseInt(item.idDocumento) || 0;
            });
        } catch (error) {
            console.error(`Error al cargar ${catalogoActual}:`, error);
        }
        const dataDocumentosEspecifico = {
            idDocumento: nuevoDocumento,
            entidad: parseInt(document.getElementById('doc-entidad').value) || 0,
        };
        URL_DINAMICA = `${API_URL}${catalogoActual}${tipo}`; // "http://localhost:3000/api/documentos/entrada"
        try {
            console.log(dataDocumentosEspecifico);
            await fetch(URL_DINAMICA, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataDocumentosEspecifico)
            });
        } catch (error) {
            console.error("Error al guardar:", error);
            alert("Hubo un error de conexión con la base de datos 2.");
        }
        tipo = "/movimientos"; // Endpoint para guardar los movimientos relacionados al documento
        const dataDetalle = {
            idDocumento: nuevoDocumento,
            items: movimientosActuales
        };
        URL_DINAMICA = `${API_URL}${catalogoActual}${tipo}`;
        try {
            console.log(dataDetalle);
            await fetch(URL_DINAMICA, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataDetalle)
            });
            alert(`Guardado exitosamente en ${catalogoActual}`);
            formulario.reset();
        } catch (error) {
            console.error("Error al guardar:", error);
            alert("Hubo un error de conexión con la base de datos 3.");
        }
        alert(`Guardado exitosamente en ${catalogoActual}`);
        formulario.reset();
        catalogoActual = ""; // Limpiamos la variable para evitar confusiones futuras
    });
});
*/
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
        selectProv.innerHTML = '<option value="" selected disabled>Selecciona un proveedor...</option>' + 
            proveedores.map(p => `<option value="${p.idProveedor}">${p.descripcion}</option>`).join('');

        selectUni.innerHTML = '<option value="" selected disabled>Selecciona una unidad...</option>' + 
            unidades.map(u => `<option value="${u.idUnidadMedida}">${u.descripcion}</option>`).join('');

    } catch (error) {
        console.error("Error cargando selectores:", error);
    }
}
