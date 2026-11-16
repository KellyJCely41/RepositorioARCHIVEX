
/* =====================================================
   ARCHIVEX - DIGITALIZACIÓN E INDEXACIÓN
   Archivo: digitalizacion.js
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    console.log("ARCHIVEX: digitalizacion.js está cargado");

    // -------------------------------------------------
    // 1. VALIDAR SESIÓN
    // -------------------------------------------------

    const sesion = JSON.parse(
        localStorage.getItem("archivex_sesion") || "null"
    );

    if (!sesion) {
        window.location.href = "../acceso/login.html";
        return;
    }

    // -------------------------------------------------
    // 2. ELEMENTOS DEL HTML
    // -------------------------------------------------

    const buscarRadicado = document.getElementById("buscarRadicado");
    const btnCargarRadicado = document.getElementById("btnCargarRadicado");
    const btnSeleccionarArchivo = document.getElementById("btnSeleccionarArchivo");
    const formIndexacion = document.getElementById("formIndexacion");
    const visorDocumento = document.querySelector(".visor-documento-area");
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    const inicialesUsuario = document.getElementById("inicialesUsuario");

    const claveRadicaciones = "archivex_radicaciones";
    const claveDigitalizaciones = "archivex_digitalizaciones";

    let radicadoSeleccionado = null;
    let archivoSeleccionado = null;
    let urlPrevisualizacion = null;

    // -------------------------------------------------
    // 3. FUNCIONES DE ALMACENAMIENTO
    // -------------------------------------------------

    function obtenerRadicaciones() {
        return JSON.parse(
            localStorage.getItem(claveRadicaciones) || "[]"
        );
    }

    function guardarRadicaciones(radicaciones) {
        localStorage.setItem(
            claveRadicaciones,
            JSON.stringify(radicaciones)
        );
    }

    function obtenerDigitalizaciones() {
        return JSON.parse(
            localStorage.getItem(claveDigitalizaciones) || "[]"
        );
    }

    function guardarDigitalizaciones(digitalizaciones) {
        localStorage.setItem(
            claveDigitalizaciones,
            JSON.stringify(digitalizaciones)
        );
    }

    // -------------------------------------------------
    // 4. INFORMACIÓN DEL USUARIO
    // -------------------------------------------------

    if (inicialesUsuario) {
        const nombre = sesion.nombre || sesion.usuario || "Usuario";

        const iniciales = nombre
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(palabra => palabra.charAt(0).toUpperCase())
            .join("");

        inicialesUsuario.textContent = iniciales;
    }

    // -------------------------------------------------
    // 5. MENSAJES DEL SISTEMA
    // -------------------------------------------------

    function mostrarMensaje(mensaje, tipo = "info") {

        let contenedor = document.getElementById("mensajeDigitalizacion");

        if (!contenedor) {
            contenedor = document.createElement("div");
            contenedor.id = "mensajeDigitalizacion";

            const contenido = document.querySelector(".dashboard-content");

            contenido.prepend(contenedor);
        }

        contenedor.textContent = mensaje;
        contenedor.className = `mensaje-digitalizacion ${tipo}`;

        contenedor.style.padding = "12px 16px";
        contenedor.style.marginBottom = "15px";
        contenedor.style.borderRadius = "8px";
        contenedor.style.fontSize = "14px";

        if (tipo === "error") {
            contenedor.style.background = "#FDECEC";
            contenedor.style.color = "#B42318";
        } else if (tipo === "exito") {
            contenedor.style.background = "#E8F7EE";
            contenedor.style.color = "#18794E";
        } else {
            contenedor.style.background = "#EAF4FF";
            contenedor.style.color = "#2563A6";
        }
    }

    // -------------------------------------------------
    // 6. BUSCAR RADICADO
    // -------------------------------------------------

    function cargarRadicado() {

        const numero = buscarRadicado.value.trim().toUpperCase();

        if (!numero) {
            mostrarMensaje(
                "Ingrese el número de radicado que desea digitalizar.",
                "error"
            );
            buscarRadicado.focus();
            return;
        }

        const radicaciones = obtenerRadicaciones();

        const radicado = radicaciones.find(item =>
            (item.numeroRadicado || "").toUpperCase() === numero
        );

        if (!radicado) {
            radicadoSeleccionado = null;

            mostrarMensaje(
                "No se encontró el radicado. Verifique el número ingresado.",
                "error"
            );

            return;
        }

        radicadoSeleccionado = radicado;

        const digitalizaciones = obtenerDigitalizaciones();

        const existente = digitalizaciones.find(item =>
            item.radicadoId === radicado.id
        );

        if (existente) {
            mostrarMensaje(
                "Este radicado ya tiene un registro de digitalización. Si continúa, actualizará su indexación.",
                "info"
            );
        } else {
            mostrarMensaje(
                `Radicado ${radicado.numeroRadicado} cargado correctamente. Puede seleccionar el archivo e indexarlo.`,
                "exito"
            );
        }

        // Mostrar información del radicado en el visor
        visorDocumento.innerHTML = `
            <div class="placeholder-visor">
                <i data-lucide="file-check"></i>
                <h3>${escaparHTML(radicado.numeroRadicado)}</h3>
                <p><strong>Remitente:</strong> ${escaparHTML(radicado.remitente || radicado.tercero || "No registrado")}</p>
                <p><strong>Asunto:</strong> ${escaparHTML(radicado.asunto || "Sin asunto")}</p>
                <p><strong>Estado:</strong> ${escaparHTML(radicado.estado || "Sin estado")}</p>
                <p>Seleccione el archivo digital para visualizarlo.</p>
                <button type="button" class="btn-secundario-sm" id="btnSeleccionarArchivoVisor">
                    <i data-lucide="upload"></i>
                    <span>Seleccionar archivo</span>
                </button>
            </div>
        `;

        if (window.lucide) {
            lucide.createIcons();
        }

        const botonVisor = document.getElementById("btnSeleccionarArchivoVisor");

        if (botonVisor) {
            botonVisor.addEventListener("click", seleccionarArchivo);
        }
    }

    if (btnCargarRadicado) {
        btnCargarRadicado.addEventListener("click", cargarRadicado);
    }

    if (buscarRadicado) {
        buscarRadicado.addEventListener("keydown", evento => {
            if (evento.key === "Enter") {
                evento.preventDefault();
                cargarRadicado();
            }
        });
    }

    // -------------------------------------------------
    // 7. CREAR SELECTOR DE ARCHIVOS
    // -------------------------------------------------

    const inputArchivo = document.createElement("input");

    inputArchivo.type = "file";
    inputArchivo.accept = ".pdf,.jpg,.jpeg,.png";
    inputArchivo.style.display = "none";

    document.body.appendChild(inputArchivo);

    function seleccionarArchivo() {

        if (!radicadoSeleccionado) {
            mostrarMensaje(
                "Primero debe cargar un radicado.",
                "error"
            );
            return;
        }

        inputArchivo.click();
    }

    if (btnSeleccionarArchivo) {
        btnSeleccionarArchivo.addEventListener("click", seleccionarArchivo);
    }

    // -------------------------------------------------
    // 8. PREVISUALIZAR ARCHIVO
    // -------------------------------------------------

    inputArchivo.addEventListener("change", () => {

        const archivo = inputArchivo.files[0];

        if (!archivo) return;

        const tiposPermitidos = [
            "application/pdf",
            "image/jpeg",
            "image/png"
        ];

        const extensionValida = /\.(pdf|jpg|jpeg|png)$/i.test(archivo.name);

        if (!tiposPermitidos.includes(archivo.type) || !extensionValida) {
            mostrarMensaje(
                "Formato no permitido. Seleccione un archivo PDF, JPG o PNG.",
                "error"
            );

            inputArchivo.value = "";
            return;
        }

        const tamanioMaximo = 25 * 1024 * 1024;

        if (archivo.size > tamanioMaximo) {
            mostrarMensaje(
                "El archivo supera el tamaño máximo permitido de 25 MB.",
                "error"
            );

            inputArchivo.value = "";
            return;
        }

        archivoSeleccionado = archivo;

        if (urlPrevisualizacion) {
            URL.revokeObjectURL(urlPrevisualizacion);
        }

        urlPrevisualizacion = URL.createObjectURL(archivo);

        if (archivo.type === "application/pdf") {

            visorDocumento.innerHTML = `
                <iframe
                    src="${urlPrevisualizacion}"
                    title="Previsualización del documento PDF"
                    style="width:100%; height:420px; border:0; border-radius:8px;">
                </iframe>
            `;

        } else {

            const imagen = document.createElement("img");

            imagen.src = urlPrevisualizacion;
            imagen.alt = "Documento digitalizado";
            imagen.style.maxWidth = "100%";
            imagen.style.maxHeight = "420px";
            imagen.style.objectFit = "contain";

            visorDocumento.innerHTML = "";
            visorDocumento.appendChild(imagen);
        }

        mostrarMensaje(
            `Archivo seleccionado correctamente: ${archivo.name}`,
            "exito"
        );
    });

    // -------------------------------------------------
    // 9. GUARDAR INDEXACIÓN
    // -------------------------------------------------

    if (formIndexacion) {

        formIndexacion.addEventListener("submit", evento => {

            evento.preventDefault();
            alert("ARCHIVEX: Se hizo clic en Guardar e Indexar.");
            

            if (!radicadoSeleccionado) {
                mostrarMensaje(
                    "Debe cargar un radicado antes de indexar.",
                    "error"
                );
                return;
            }

            if (!archivoSeleccionado) {
                mostrarMensaje(
                    "Debe seleccionar un archivo digital.",
                    "error"
                );
                return;
            }

            const palabrasClave = document
                .getElementById("palabrasClave")
                .value.trim();

            const tipoDocumental = document
                .getElementById("tipoDocumentalIndex")
                .value;

            const nivelSeguridad = document
                .getElementById("nivelSeguridad")
                .value;

            const notas = document
                .getElementById("notasIndexacion")
                .value.trim();

            const calidadVerificada = document
                .getElementById("calidadVerificada")
                .checked;

            if (!palabrasClave || !tipoDocumental || !nivelSeguridad) {
                mostrarMensaje(
                    "Complete los campos obligatorios de indexación.",
                    "error"
                );
                return;
            }

            if (!calidadVerificada) {
                mostrarMensaje(
                    "Debe verificar la calidad del documento antes de guardarlo.",
                    "error"
                );
                return;
            }

            const digitalizaciones = obtenerDigitalizaciones();

            const fechaActual = new Date().toISOString();

            const registroExistente = digitalizaciones.findIndex(item =>
                item.radicadoId === radicadoSeleccionado.id
            );

            const registro = {
                id: registroExistente >= 0
                    ? digitalizaciones[registroExistente].id
                    : "DIG-" + Date.now(),

                radicadoId: radicadoSeleccionado.id,
                numeroRadicado: radicadoSeleccionado.numeroRadicado,

                nombreArchivo: archivoSeleccionado.name,
                tipoArchivo: archivoSeleccionado.type,
                tamanioArchivo: archivoSeleccionado.size,

                palabrasClave: palabrasClave,
                tipoDocumental: tipoDocumental,
                nivelSeguridad: nivelSeguridad,
                notasIndexacion: notas,

                calidadVerificada: true,

                estado: "Digitalizado e indexado",

                fechaDigitalizacion: fechaActual,

                usuarioResponsable: sesion.nombre || sesion.usuario,
                usuarioId: sesion.usuarioId || sesion.id || null
            };

            if (registroExistente >= 0) {
                digitalizaciones[registroExistente] = registro;
            } else {
                digitalizaciones.push(registro);
            }

            guardarDigitalizaciones(digitalizaciones);

            // Actualizar el registro original del radicado
            const radicaciones = obtenerRadicaciones();

            const indiceRadicado = radicaciones.findIndex(item =>
                item.id === radicadoSeleccionado.id
            );

            if (indiceRadicado >= 0) {

                radicaciones[indiceRadicado].digitalizado = true;
                radicaciones[indiceRadicado].indexado = true;
                radicaciones[indiceRadicado].fechaDigitalizacion = fechaActual;
                radicaciones[indiceRadicado].estadoDigitalizacion =
                    "Digitalizado e indexado";

                guardarRadicaciones(radicaciones);
            }

            mostrarMensaje(
                "El documento fue digitalizado e indexado correctamente.",
                "exito"
            );

            formIndexacion.reset();

            archivoSeleccionado = null;
            inputArchivo.value = "";

            // Mantener el radicado cargado para permitir una actualización
            visorDocumento.innerHTML = `
                <div class="placeholder-visor">
                    <i data-lucide="check-circle"></i>
                    <h3>Digitalización registrada</h3>
                    <p>Radicado: ${escaparHTML(registro.numeroRadicado)}</p>
                    <p>Archivo: ${escaparHTML(registro.nombreArchivo)}</p>
                    <p>Puede continuar con otro documento.</p>
                </div>
            `;

            if (window.lucide) {
                lucide.createIcons();
            }
        });
    }

    // -------------------------------------------------
    // 10. LIMPIAR FORMULARIO
    // -------------------------------------------------

    if (formIndexacion) {

        formIndexacion.addEventListener("reset", () => {

            setTimeout(() => {

                archivoSeleccionado = null;
                inputArchivo.value = "";

                if (urlPrevisualizacion) {
                    URL.revokeObjectURL(urlPrevisualizacion);
                    urlPrevisualizacion = null;
                }

            }, 0);
        });
    }

    // -------------------------------------------------
    // 11. ESCAPAR TEXTO HTML
    // -------------------------------------------------

    function escaparHTML(valor) {

        return String(valor).replace(/[&<>"']/g, caracter => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[caracter]);
    }

    // -------------------------------------------------
    // 12. CERRAR SESIÓN
    // -------------------------------------------------

    if (btnCerrarSesion) {

        btnCerrarSesion.addEventListener("click", evento => {

            evento.preventDefault();

            const confirmar = confirm(
                "¿Está seguro de que desea cerrar la sesión?"
            );

            if (confirmar) {
                localStorage.removeItem("archivex_sesion");
                window.location.href = "../acceso/login.html";
            }
        });
    }

});
