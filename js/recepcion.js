
document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. VALIDAR SESIÓN
    // ==========================================

    const sesionGuardada = localStorage.getItem("archivex_sesion");

    if (!sesionGuardada) {
        window.location.href = "../acceso/login.html";
        return;
    }

    let sesion;

    try {
        sesion = JSON.parse(sesionGuardada);
    } catch (error) {
        localStorage.removeItem("archivex_sesion");
        window.location.href = "../acceso/login.html";
        return;
    }

    // ==========================================
    // 2. ELEMENTOS DEL FORMULARIO
    // ==========================================

    const formulario = document.getElementById("formRecepcion");

    if (!formulario) {
        console.error("No se encontró el formulario de recepción.");
        return;
    }

    const tipoRemitente = document.getElementById("tipoRemitente");
    const identificacionRemitente = document.getElementById("identificacionRemitente");
    const nombreRemitente = document.getElementById("nombreRemitente");
    const medioRecepcion = document.getElementById("medioRecepcion");
    const folios = document.getElementById("folios");
    const dependenciaDestino = document.getElementById("dependenciaDestino");
    const asunto = document.getElementById("asunto");
    const archivoSoporte = document.getElementById("archivoSoporte");

    // ==========================================
    // 3. CLAVE DE ALMACENAMIENTO
    // ==========================================

    const CLAVE_RECEPCIONES = "archivex_recepciones";

    function obtenerRecepciones() {
        try {
            const registros = JSON.parse(
                localStorage.getItem(CLAVE_RECEPCIONES)
            );

            return Array.isArray(registros) ? registros : [];

        } catch (error) {
            console.error("Error al consultar las recepciones:", error);
            return [];
        }
    }

    function guardarRecepciones(registros) {
        localStorage.setItem(
            CLAVE_RECEPCIONES,
            JSON.stringify(registros)
        );
    }

    // ==========================================
    // 4. GENERAR CONSECUTIVO DE RECEPCIÓN
    // ==========================================

    function generarNumeroRecepcion() {

        const registros = obtenerRecepciones();
        const anioActual = new Date().getFullYear();

        const consecutivosAnio = registros
            .filter(registro =>
                registro.numeroRecepcion &&
                registro.numeroRecepcion.startsWith(`REC-${anioActual}-`)
            )
            .map(registro =>
                parseInt(registro.numeroRecepcion.split("-")[2], 10)
            )
            .filter(numero => Number.isInteger(numero));

        const siguienteNumero = consecutivosAnio.length > 0
            ? Math.max(...consecutivosAnio) + 1
            : 1;

        return `REC-${anioActual}-${String(siguienteNumero).padStart(4, "0")}`;
    }

    // ==========================================
    // 5. MENSAJES DEL FORMULARIO
    // ==========================================

    let mensaje = document.getElementById("mensajeRecepcion");

    if (!mensaje) {
        mensaje = document.createElement("div");
        mensaje.id = "mensajeRecepcion";
        mensaje.className = "mensaje-recepcion";

        formulario.prepend(mensaje);
    }

    function mostrarMensaje(texto, tipo) {
        mensaje.textContent = texto;
        mensaje.className = `mensaje-recepcion ${tipo}`;
        mensaje.style.display = "block";
    }

    function ocultarMensaje() {
        mensaje.textContent = "";
        mensaje.style.display = "none";
    }

    // ==========================================
    // 6. VALIDAR ARCHIVO ADJUNTO
    // ==========================================

    function validarArchivo() {

        const archivo = archivoSoporte.files[0];

        if (!archivo) {
            return true;
        }

        const extensionesPermitidas = [
            "application/pdf",
            "image/jpeg",
            "image/png"
        ];

        const extension = archivo.name.split(".").pop().toLowerCase();

        const extensiones = ["pdf", "jpg", "jpeg", "png"];

        if (
            !extensiones.includes(extension) ||
            !extensionesPermitidas.includes(archivo.type)
        ) {
            mostrarMensaje(
                "El archivo debe estar en formato PDF, JPG o PNG.",
                "error"
            );

            return false;
        }

        const tamanioMaximo = 25 * 1024 * 1024;

        if (archivo.size > tamanioMaximo) {
            mostrarMensaje(
                "El archivo supera el tamaño máximo permitido de 25 MB.",
                "error"
            );

            return false;
        }

        return true;
    }

    // ==========================================
    // 7. REGISTRAR RECEPCIÓN
    // ==========================================

    formulario.addEventListener("submit", (evento) => {

        evento.preventDefault();
        ocultarMensaje();

        // Validar campos obligatorios
        if (!formulario.checkValidity()) {
            formulario.reportValidity();
            return;
        }

        // Validar número de folios
        const cantidadFolios = Number(folios.value);

        if (
            !Number.isInteger(cantidadFolios) ||
            cantidadFolios < 1
        ) {
            mostrarMensaje(
                "Ingrese un número de folios válido.",
                "error"
            );

            folios.focus();
            return;
        }

        // Validar archivo
        if (!validarArchivo()) {
            return;
        }

        // Obtener información del archivo
        const archivo = archivoSoporte.files[0];

        // Generar número de recepción
        const numeroRecepcion = generarNumeroRecepcion();

        // Fecha y hora de registro
        const fechaActual = new Date();

        // Crear registro
        const nuevaRecepcion = {

            id: Date.now(),

            numeroRecepcion: numeroRecepcion,

            tipoRemitente: tipoRemitente.value,

            identificacionRemitente:
                identificacionRemitente.value.trim(),

            nombreRemitente:
                nombreRemitente.value.trim(),

            medioRecepcion: medioRecepcion.value,

            folios: cantidadFolios,

            dependenciaDestino: dependenciaDestino.value,

            asunto: asunto.value.trim(),

            archivoNombre: archivo ? archivo.name : "",

            archivoTipo: archivo ? archivo.type : "",

            archivoTamanio: archivo ? archivo.size : 0,

            estado: "Recibido",

            fechaRecepcion: fechaActual.toISOString(),

            usuarioResponsable:
                sesion.nombre || sesion.usuario || "Usuario ARCHIVEX",

            usuarioId: sesion.id || null

        };

        // Consultar registros existentes
        const recepciones = obtenerRecepciones();

        // Agregar nuevo registro
        recepciones.push(nuevaRecepcion);

        // Guardar información
        try {

            guardarRecepciones(recepciones);

            mostrarMensaje(
                `¡Recepción registrada correctamente! Número: ${numeroRecepcion}`,
                "exito"
            );

            console.log("Nueva recepción registrada:", nuevaRecepcion);

            // Limpiar formulario
            formulario.reset();

        } catch (error) {

            console.error("Error al guardar la recepción:", error);

            mostrarMensaje(
                "No fue posible guardar el registro. Verifique el almacenamiento del navegador.",
                "error"
            );
        }

    });

    // ==========================================
    // 8. LIMPIAR MENSAJE AL MODIFICAR CAMPOS
    // ==========================================

    formulario.addEventListener("input", ocultarMensaje);
    formulario.addEventListener("change", ocultarMensaje);

    // ==========================================
    // 9. MOSTRAR INICIALES DEL USUARIO
    // ==========================================

    const avatar = document.getElementById("inicialesUsuario");

    if (avatar) {

        const nombre = sesion.nombre || sesion.usuario || "Usuario";

        const iniciales = nombre
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(palabra => palabra.charAt(0).toUpperCase())
            .join("");

        avatar.textContent = iniciales || "US";
    }

    // ==========================================
    // 10. CERRAR SESIÓN
    // ==========================================

    const botonCerrarSesion = document.getElementById("btnCerrarSesion");

    if (botonCerrarSesion) {

        botonCerrarSesion.addEventListener("click", (evento) => {

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

    console.log("Módulo de recepción ARCHIVEX iniciado correctamente.");

});
