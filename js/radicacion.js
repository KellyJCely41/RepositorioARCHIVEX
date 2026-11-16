
document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. VALIDAR SESIÓN
    // ==========================================

    let sesion;

    try {
        sesion = JSON.parse(localStorage.getItem("archivex_sesion"));
    } catch (error) {
        sesion = null;
    }

    if (!sesion) {
        window.location.href = "../acceso/login.html";
        return;
    }

    // ==========================================
    // 2. ELEMENTOS DEL FORMULARIO
    // ==========================================

    const formulario = document.getElementById("formRadicacion");

    if (!formulario) {
        console.error("No se encontró el formulario de radicación.");
        return;
    }

    const tipoRadicacion = document.getElementById("tipoRadicacion");
    const canalOrigen = document.getElementById("canalOrigen");
    const terceroRadicacion = document.getElementById("terceroRadicacion");
    const serieTrd = document.getElementById("serieTrd");
    const subserieTrd = document.getElementById("subserieTrd");
    const funcionarioResponsable = document.getElementById("funcionarioResponsable");
    const diasRespuesta = document.getElementById("diasRespuesta");
    const asuntoRadicado = document.getElementById("asuntoRadicado");
    const observaciones = document.getElementById("observaciones");

    const consecutivoElemento = document.getElementById("consecutivoRadicado");
    const buscador = document.getElementById("buscarRadicado");
    const avatar = document.getElementById("inicialesUsuario");

    const CLAVE_RADICADOS = "archivex_radicaciones";
    const CLAVE_RECEPCIONES = "archivex_recepciones";
    const CLAVE_EMPRESAS = "archivex_empresas";

    // ==========================================
    // 3. FUNCIONES DE ALMACENAMIENTO
    // ==========================================

    function obtenerDatos(clave) {

        try {
            const datos = JSON.parse(localStorage.getItem(clave));
            return Array.isArray(datos) ? datos : [];

        } catch (error) {
            console.error(`Error al consultar ${clave}:`, error);
            return [];
        }
    }

    function guardarDatos(clave, datos) {

        localStorage.setItem(
            clave,
            JSON.stringify(datos)
        );
    }

    function obtenerRadicados() {
        return obtenerDatos(CLAVE_RADICADOS);
    }

    // ==========================================
    // 4. GENERAR NÚMERO DE RADICADO
    // ==========================================

    function generarNumeroRadicado() {

        const anio = new Date().getFullYear();
        const radicados = obtenerRadicados();

        const consecutivos = radicados
            .filter(registro =>
                registro.numeroRadicado &&
                registro.numeroRadicado.startsWith(`RAD-${anio}-`)
            )
            .map(registro =>
                parseInt(registro.numeroRadicado.split("-")[2], 10)
            )
            .filter(numero => Number.isInteger(numero));

        const siguiente = consecutivos.length > 0
            ? Math.max(...consecutivos) + 1
            : 1;

        return `RAD-${anio}-${String(siguiente).padStart(4, "0")}`;
    }

    function actualizarConsecutivo() {

        if (consecutivoElemento) {

            consecutivoElemento.textContent =
                `Próximo consecutivo: ${generarNumeroRadicado()}`;
        }
    }

    // ==========================================
    // 5. CALCULAR FECHA DE RESPUESTA
    // ==========================================

    function calcularFechaRespuesta(fechaInicial, cantidadDias) {

        const fecha = new Date(fechaInicial);

        let diasContados = 0;

        while (diasContados < cantidadDias) {

            fecha.setDate(fecha.getDate() + 1);

            const diaSemana = fecha.getDay();

            // Excluir sábados y domingos
            if (diaSemana !== 0 && diaSemana !== 6) {
                diasContados++;
            }
        }

        return fecha;
    }

    function formatearFecha(fecha) {

        return fecha.toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }

    // ==========================================
    // 6. IDENTIFICAR EMPRESA O TERCERO
    // ==========================================

    function buscarEmpresa(nombre) {

        const empresas = obtenerDatos(CLAVE_EMPRESAS);

        const nombreBuscado = nombre.trim().toLowerCase();

        return empresas.find(empresa =>
            String(empresa.razonSocial || "").trim().toLowerCase()
                === nombreBuscado
        ) || null;
    }

    // ==========================================
    // 7. IDENTIFICAR RECEPCIÓN RELACIONADA
    // ==========================================

    function buscarRecepcion(nombre) {

        const recepciones = obtenerDatos(CLAVE_RECEPCIONES);

        const nombreBuscado = nombre.trim().toLowerCase();

        if (tipoRadicacion.value !== "entrada") {
            return null;
        }

        return recepciones.find(recepcion =>
            String(recepcion.nombreRemitente || "").trim().toLowerCase()
                === nombreBuscado &&
            recepcion.estado === "Recibido"
        ) || null;
    }

    // ==========================================
    // 8. MENSAJES DEL FORMULARIO
    // ==========================================

    let mensaje = document.getElementById("mensajeRadicacion");

    if (!mensaje) {

        mensaje = document.createElement("div");

        mensaje.id = "mensajeRadicacion";
        mensaje.className = "mensaje-radicacion";

        formulario.prepend(mensaje);
    }

    const estilosMensaje = document.createElement("style");

    estilosMensaje.textContent = `
        .mensaje-radicacion {
            display: none;
            padding: 12px 15px;
            margin-bottom: 15px;
            border-radius: 7px;
        }

        .mensaje-radicacion.error {
            display: block;
            background: #fee4e2;
            color: #b42318;
        }

        .mensaje-radicacion.exito {
            display: block;
            background: #dcfae6;
            color: #067647;
        }

        .tabla-radicados-generada {
            margin-top: 25px;
            background: white;
            padding: 20px;
            border-radius: 10px;
            overflow-x: auto;
        }

        .tabla-radicados-generada h2 {
            margin-bottom: 15px;
        }

        .tabla-radicados-generada table {
            width: 100%;
            border-collapse: collapse;
            min-width: 650px;
        }

        .tabla-radicados-generada th,
        .tabla-radicados-generada td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
            text-align: left;
        }

        .tabla-radicados-generada th {
            background: #f1f5f9;
        }

        .btn-imprimir-radicado {
            padding: 7px 12px;
            background: #2563A6;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
    `;

    document.head.appendChild(estilosMensaje);

    function mostrarMensaje(texto, tipo) {

        mensaje.textContent = texto;
        mensaje.className = `mensaje-radicacion ${tipo}`;
        mensaje.style.display = "block";
    }

    function ocultarMensaje() {

        mensaje.textContent = "";
        mensaje.style.display = "none";
    }

    // ==========================================
    // 9. GENERAR COMPROBANTE IMPRIMIBLE
    // ==========================================

    function imprimirSticker(radicado) {

        const ventana = window.open("", "_blank", "width=650,height=550");

        if (!ventana) {

            alert(
                "El radicado fue guardado. Permita las ventanas emergentes para imprimir el comprobante."
            );

            return;
        }

        const contenido = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Comprobante de Radicación</title>

                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 30px;
                        color: #263445;
                    }

                    .sticker {
                        max-width: 520px;
                        margin: auto;
                        padding: 25px;
                        border: 2px solid #2563A6;
                        border-radius: 10px;
                    }

                    h1 {
                        color: #2563A6;
                        text-align: center;
                    }

                    .numero {
                        font-size: 27px;
                        font-weight: bold;
                        text-align: center;
                        margin: 25px 0;
                    }

                    .dato {
                        padding: 8px 0;
                        border-bottom: 1px solid #ddd;
                    }

                    .pie {
                        text-align: center;
                        margin-top: 25px;
                        font-size: 12px;
                    }

                    @media print {
                        button {
                            display: none;
                        }
                    }
                </style>
            </head>

            <body>

                <div class="sticker">

                    <h1>ARCHIVEX</h1>

                    <p style="text-align:center">
                        GESTIÓN DOCUMENTAL INSTITUCIONAL
                    </p>

                    <div class="numero">
                        ${escaparHTML(radicado.numeroRadicado)}
                    </div>

                    <div class="dato">
                        <strong>Fecha:</strong>
                        ${escaparHTML(radicado.fecha)}
                    </div>

                    <div class="dato">
                        <strong>Tipo:</strong>
                        ${escaparHTML(radicado.tipoRadicacion)}
                    </div>

                    <div class="dato">
                        <strong>Remitente / Destinatario:</strong>
                        ${escaparHTML(radicado.tercero)}
                    </div>

                    <div class="dato">
                        <strong>Asunto:</strong>
                        ${escaparHTML(radicado.asunto)}
                    </div>

                    <div class="dato">
                        <strong>Funcionario:</strong>
                        ${escaparHTML(radicado.funcionarioResponsable)}
                    </div>

                    <div class="pie">
                        Documento registrado en el sistema ARCHIVEX.
                    </div>

                    <div style="text-align:center; margin-top:20px">
                        <button onclick="window.print()">
                            Imprimir comprobante
                        </button>
                    </div>

                </div>

            </body>
            </html>
        `;

        ventana.document.write(contenido);
        ventana.document.close();
    }

    function escaparHTML(valor) {

        return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[caracter]);
    }

    // ==========================================
    // 10. REGISTRAR NUEVO RADICADO
    // ==========================================

    formulario.addEventListener("submit", (evento) => {

        evento.preventDefault();
        ocultarMensaje();

        if (!formulario.checkValidity()) {
            formulario.reportValidity();
            return;
        }

        const cantidadDias = Number(diasRespuesta.value);

        if (!Number.isInteger(cantidadDias) || cantidadDias < 1) {

            mostrarMensaje(
                "Ingrese un plazo de respuesta válido.",
                "error"
            );

            diasRespuesta.focus();
            return;
        }

        const tercero = terceroRadicacion.value.trim();

        const fechaActual = new Date();

        const fechaVencimiento = calcularFechaRespuesta(
            fechaActual,
            cantidadDias
        );

        const numeroRadicado = generarNumeroRadicado();

        const empresa = buscarEmpresa(tercero);

        const recepcion = buscarRecepcion(tercero);

        // Datos de la nueva radicación
        const nuevoRadicado = {

            id: Date.now(),

            numeroRadicado: numeroRadicado,

            numeroRecepcion: recepcion
                ? recepcion.numeroRecepcion
                : "",

            tipoRadicacion: tipoRadicacion.value,

            canalOrigen: canalOrigen.value,

            tercero: tercero,

            remitente: tercero,

            identificacionRemitente: empresa
                ? empresa.nit
                : recepcion
                    ? recepcion.identificacionRemitente
                    : "",

            empresaId: empresa ? empresa.id : null,

            recepcionId: recepcion ? recepcion.id : null,

            serieTrd: serieTrd.value,

            subserieTrd: subserieTrd.value,

            funcionarioResponsable: funcionarioResponsable.value,

            diasRespuesta: cantidadDias,

            fechaVencimiento: fechaVencimiento.toISOString(),

            asunto: asuntoRadicado.value.trim(),

            descripcion: asuntoRadicado.value.trim(),

            observaciones: observaciones.value.trim(),

            fechaRadicacion: fechaActual.toISOString(),

            fecha: formatearFecha(fechaActual),

            estado: "Pendiente",

            usuarioRegistro: sesion.nombre || sesion.usuario || "Usuario ARCHIVEX",

            usuarioId: sesion.id || null

        };

        try {

            const radicados = obtenerRadicados();

            radicados.push(nuevoRadicado);

            guardarDatos(CLAVE_RADICADOS, radicados);

            // Marcar recepción como radicada si se encontró una coincidencia
            if (recepcion) {

                const recepciones = obtenerDatos(CLAVE_RECEPCIONES);

                const indice = recepciones.findIndex(
                    registro => registro.id === recepcion.id
                );

                if (indice !== -1) {

                    recepciones[indice].estado = "Radicado";

                    recepciones[indice].numeroRadicado = numeroRadicado;

                    guardarDatos(CLAVE_RECEPCIONES, recepciones);
                }
            }

            mostrarMensaje(
                `Radicado generado correctamente: ${numeroRadicado}`,
                "exito"
            );

            // Limpiar campos
            formulario.reset();

            // Actualizar consecutivo
            actualizarConsecutivo();

            // Actualizar historial
            renderizarHistorial();

            // Ofrecer impresión del comprobante
            const deseaImprimir = confirm(
                `El documento quedó radicado con el número ${numeroRadicado}.\n\n¿Desea imprimir el comprobante?`
            );

            if (deseaImprimir) {
                imprimirSticker(nuevoRadicado);
            }

            console.log("Radicado registrado:", nuevoRadicado);

        } catch (error) {

            console.error("Error al registrar radicado:", error);

            mostrarMensaje(
                "No fue posible guardar el radicado. Verifique el almacenamiento del navegador.",
                "error"
            );
        }

    });

    // ==========================================
    // 11. HISTORIAL DE RADICADOS
    // ==========================================

    const seccionHistorial = document.createElement("section");

    seccionHistorial.className = "tabla-radicados-generada";

    seccionHistorial.innerHTML = `
        <h2>Historial de Radicados</h2>

        <div style="overflow-x:auto">
            <table>
                <thead>
                    <tr>
                        <th>Número de Radicado</th>
                        <th>Tipo</th>
                        <th>Remitente / Destinatario</th>
                        <th>Asunto</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Acción</th>
                    </tr>
                </thead>

                <tbody id="tablaHistorialRadicados"></tbody>
            </table>
        </div>
    `;

    document.querySelector(".dashboard-content")
        .appendChild(seccionHistorial);

    const tablaHistorial = document.getElementById(
        "tablaHistorialRadicados"
    );

    // ==========================================
    // 12. MOSTRAR HISTORIAL
    // ==========================================

    function renderizarHistorial(filtro = "") {

        const radicados = obtenerRadicados();

        const termino = filtro.toLowerCase().trim();

        const filtrados = radicados.filter(radicado => {

            const texto = [
                radicado.numeroRadicado,
                radicado.tercero,
                radicado.asunto,
                radicado.tipoRadicacion
            ].join(" ").toLowerCase();

            return texto.includes(termino);
        });

        tablaHistorial.innerHTML = "";

        if (filtrados.length === 0) {

            tablaHistorial.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center;padding:20px">
                        No hay radicados registrados.
                    </td>
                </tr>
            `;

            return;
        }

        filtrados
            .slice()
            .reverse()
            .forEach(radicado => {

                const fila = document.createElement("tr");

                fila.innerHTML = `
                    <td>
                        <strong>
                            ${escaparHTML(radicado.numeroRadicado)}
                        </strong>
                    </td>

                    <td>${escaparHTML(radicado.tipoRadicacion)}</td>

                    <td>${escaparHTML(radicado.tercero)}</td>

                    <td>${escaparHTML(radicado.asunto)}</td>

                    <td>${escaparHTML(radicado.fecha)}</td>

                    <td>${escaparHTML(radicado.estado)}</td>

                    <td>
                        <button
                            type="button"
                            class="btn-imprimir-radicado"
                            data-id="${radicado.id}">
                            Imprimir
                        </button>
                    </td>
                `;

                tablaHistorial.appendChild(fila);
            });
    }

    // ==========================================
    // 13. BUSCAR RADICADOS
    // ==========================================

    if (buscador) {

        buscador.addEventListener("input", () => {
            renderizarHistorial(buscador.value);
        });
    }

    // ==========================================
    // 14. IMPRIMIR DESDE EL HISTORIAL
    // ==========================================

    tablaHistorial.addEventListener("click", (evento) => {

        const boton = evento.target.closest("[data-id]");

        if (!boton) return;

        const id = Number(boton.dataset.id);

        const radicado = obtenerRadicados().find(
            registro => registro.id === id
        );

        if (radicado) {
            imprimirSticker(radicado);
        }
    });

    // ==========================================
    // 15. MOSTRAR INICIALES DEL USUARIO
    // ==========================================

    if (avatar) {

        const nombre = sesion.nombre || sesion.usuario || "Usuario";

        avatar.textContent = nombre
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(palabra => palabra.charAt(0).toUpperCase())
            .join("");
    }

    // ==========================================
    // 16. CERRAR SESIÓN
    // ==========================================

    const botonCerrarSesion = document.getElementById("btnCerrarSesion");

    if (botonCerrarSesion) {

        botonCerrarSesion.addEventListener("click", (evento) => {

            evento.preventDefault();

            if (confirm("¿Está seguro de cerrar la sesión?")) {

                localStorage.removeItem("archivex_sesion");

                window.location.href = "../acceso/login.html";
            }
        });
    }

    // ==========================================
    // 17. INICIALIZAR MÓDULO
    // ==========================================

    actualizarConsecutivo();

    renderizarHistorial();

    console.log("Módulo de radicación ARCHIVEX iniciado correctamente.");

});
