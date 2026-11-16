
/* =====================================================
   ARCHIVEX - GESTIÓN DE EXPEDIENTES
   Archivo: expedientes.js
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    // -------------------------------------------------
    // 1. VALIDAR SESIÓN
    // -------------------------------------------------

    let sesion;

    try {
        sesion = JSON.parse(localStorage.getItem("archivex_sesion") || "null");
    } catch (error) {
        sesion = null;
    }

    if (!sesion) {
        window.location.href = "../acceso/login.html";
        return;
    }

    // -------------------------------------------------
    // 2. ELEMENTOS DEL HTML
    // -------------------------------------------------

    const tablaExpedientes = document.getElementById("tablaExpedientes");
    const buscarExpediente = document.getElementById("buscarExpediente");
    const filtroExpedientes = document.getElementById("filtroExpedientes");
    const btnNuevoExpediente = document.getElementById("btnNuevoExpediente");
    const totalExpedientes = document.getElementById("totalExpedientes");
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    const inicialesUsuario = document.getElementById("inicialesUsuario");

    const CLAVE_EXPEDIENTES = "archivex_expedientes";
    const CLAVE_RADICACIONES = "archivex_radicaciones";
    const CLAVE_DIGITALIZACIONES = "archivex_digitalizaciones";
    const CLAVE_TRD = "archivex_trd";

    let expedienteEditando = null;

    // -------------------------------------------------
    // 3. FUNCIONES DE ALMACENAMIENTO
    // -------------------------------------------------

    function leerDatos(clave) {
        try {
            const datos = JSON.parse(localStorage.getItem(clave) || "[]");
            return Array.isArray(datos) ? datos : [];
        } catch (error) {
            console.error(`Error leyendo ${clave}:`, error);
            return [];
        }
    }

    function guardarDatos(clave, datos) {
        localStorage.setItem(clave, JSON.stringify(datos));
    }

    function obtenerExpedientes() {
        return leerDatos(CLAVE_EXPEDIENTES);
    }

    function obtenerRadicaciones() {
        return leerDatos(CLAVE_RADICACIONES);
    }

    function obtenerDigitalizaciones() {
        return leerDatos(CLAVE_DIGITALIZACIONES);
    }

    function obtenerTRD() {
        return leerDatos(CLAVE_TRD);
    }

    // -------------------------------------------------
    // 4. INFORMACIÓN DEL USUARIO
    // -------------------------------------------------

    if (inicialesUsuario) {
        const nombre = sesion.nombre || sesion.usuario || "Usuario";

        inicialesUsuario.textContent = nombre
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(palabra => palabra.charAt(0).toUpperCase())
            .join("");
    }

    // -------------------------------------------------
    // 5. FUNCIONES AUXILIARES
    // -------------------------------------------------

    function escaparHTML(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[caracter]);
    }

    function generarCodigoExpediente() {
        const año = new Date().getFullYear();
        const expedientes = obtenerExpedientes();

        const codigosDelAño = expedientes
            .filter(item => item.codigo && item.codigo.startsWith(`EXP-${año}-`))
            .map(item => Number(item.codigo.split("-").pop()))
            .filter(numero => Number.isFinite(numero));

        const siguiente = Math.max(0, ...codigosDelAño) + 1;

        return `EXP-${año}-${String(siguiente).padStart(3, "0")}`;
    }

    function nombreDependencia(valor) {
        const dependencias = {
            gerencia: "Gerencia / Dirección General",
            juridica: "Oficina Jurídica",
            financiera: "Gestión Financiera",
            archivo: "Archivo Central"
        };

        return dependencias[valor] || valor || "No asignada";
    }

    function nombreEstado(estado) {
        const estados = {
            abierto: "Abierto / Activo",
            tramite: "En trámite",
            cerrado: "Cerrado"
        };

        return estados[estado] || estado;
    }

    function claseEstado(estado) {
        const clases = {
            abierto: "verde",
            tramite: "amarillo",
            cerrado: "azul"
        };

        return clases[estado] || "azul";
    }

    function mostrarMensaje(mensaje, tipo = "info") {

        let contenedor = document.getElementById("mensajeExpedientes");

        if (!contenedor) {
            contenedor = document.createElement("div");
            contenedor.id = "mensajeExpedientes";

            document.querySelector(".dashboard-content").prepend(contenedor);
        }

        contenedor.textContent = mensaje;
        contenedor.style.padding = "12px 16px";
        contenedor.style.marginBottom = "15px";
        contenedor.style.borderRadius = "8px";

        if (tipo === "exito") {
            contenedor.style.background = "#E8F7EE";
            contenedor.style.color = "#18794E";
        } else if (tipo === "error") {
            contenedor.style.background = "#FDECEC";
            contenedor.style.color = "#B42318";
        } else {
            contenedor.style.background = "#EAF4FF";
            contenedor.style.color = "#2563A6";
        }
    }

    // -------------------------------------------------
    // 6. OBTENER DOCUMENTOS DIGITALIZADOS
    // -------------------------------------------------

    function obtenerDocumentosDigitalizados() {

        const radicaciones = obtenerRadicaciones();
        const digitalizaciones = obtenerDigitalizaciones();

        return digitalizaciones.map(digitalizacion => {

            const radicado = radicaciones.find(item =>
                item.id === digitalizacion.radicadoId
            );

            return {
                ...digitalizacion,
                radicado
            };

        }).filter(item =>
            item.radicado &&
            item.estado === "Digitalizado e indexado"
        );
    }

    // -------------------------------------------------
    // 7. MOSTRAR EXPEDIENTES
    // -------------------------------------------------

    function mostrarExpedientes() {

        const expedientes = obtenerExpedientes();

        const texto = [
            buscarExpediente?.value || "",
            filtroExpedientes?.value || ""
        ].join(" ").trim().toLowerCase();

        const filtrados = expedientes.filter(expediente => {

            const contenido = [
                expediente.codigo,
                expediente.nombre,
                expediente.serie,
                expediente.codigoSerie,
                expediente.codigoSubserie,
                expediente.subserie,
                expediente.dependencia
            ].join(" ").toLowerCase();

            return contenido.includes(texto);
        });

        tablaExpedientes.innerHTML = "";

        const activos = expedientes.filter(item =>
            item.estado !== "cerrado"
        ).length;

        if (totalExpedientes) {
            totalExpedientes.textContent = `Total: ${activos} Activos`;
        }

        if (filtrados.length === 0) {
            tablaExpedientes.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:25px;">
                        No hay expedientes registrados con esos criterios.
                    </td>
                </tr>
            `;
            return;
        }

        filtrados.forEach(expediente => {

            const cantidadDocumentos = Array.isArray(expediente.documentos)
                ? expediente.documentos.length
                : 0;

            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>
                    <strong>${escaparHTML(expediente.codigo)}</strong>
                </td>

                <td>
                    <div class="exp-celda-titulo">
                        ${escaparHTML(expediente.nombre)}
                    </div>

                    <span class="exp-sub">
                        Dependencia: ${escaparHTML(nombreDependencia(expediente.dependencia))}
                    </span>
                </td>

                <td>
                    ${escaparHTML(expediente.codigoSerie)} -
                    ${escaparHTML(expediente.serie)}
                    <br>
                    <small>
                        ${escaparHTML(expediente.codigoSubserie)}
                        ${escaparHTML(expediente.subserie)}
                    </small>
                </td>

                <td>
                    ${Number(expediente.folios) || 0}
                    <br>
                    <small>${cantidadDocumentos} documento(s)</small>
                </td>

                <td>
                    <span class="badge ${claseEstado(expediente.estado)}">
                        ${escaparHTML(nombreEstado(expediente.estado))}
                    </span>
                </td>

                <td>
                    <div class="acciones-fila-grupo">

                        <button
                            type="button"
                            class="btn-accion-tabla"
                            data-accion="ver"
                            data-id="${escaparHTML(expediente.id)}"
                            title="Ver documentos del expediente">
                            <i data-lucide="folder-open"></i>
                        </button>

                        <button
                            type="button"
                            class="btn-accion-tabla"
                            data-accion="indice"
                            data-id="${escaparHTML(expediente.id)}"
                            title="Generar índice electrónico">
                            <i data-lucide="file-text"></i>
                        </button>

                        <button
                            type="button"
                            class="btn-accion-tabla"
                            data-accion="editar"
                            data-id="${escaparHTML(expediente.id)}"
                            title="Editar expediente">
                            <i data-lucide="pencil"></i>
                        </button>

                    </div>
                </td>
            `;

            tablaExpedientes.appendChild(fila);
        });

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    // -------------------------------------------------
    // 8. CREAR MODAL DE EXPEDIENTES
    // -------------------------------------------------

    function crearModal() {

        if (document.getElementById("modalExpediente")) return;

        const modal = document.createElement("div");
        modal.id = "modalExpediente";

        modal.innerHTML = `
            <div class="modal-exp-contenido">

                <div class="modal-exp-header">
                    <h2 id="tituloModalExpediente">Crear Nuevo Expediente</h2>

                    <button type="button" id="cerrarModalExpediente">
                        &times;
                    </button>
                </div>

                <form id="formularioExpediente">

                    <div class="campo-exp">
                        <label for="codigoExpediente">Código del expediente</label>
                        <input type="text" id="codigoExpediente" readonly>
                    </div>

                    <div class="campo-exp">
                        <label for="nombreExpediente">Nombre del expediente *</label>
                        <input type="text" id="nombreExpediente"
                            placeholder="Ej: Contratos de prestación de servicios 2026"
                            required>
                    </div>

                    <div class="campo-exp">
                        <label for="dependenciaExpediente">Dependencia responsable *</label>
                        <select id="dependenciaExpediente" required>
                            <option value="">Seleccione una dependencia</option>
                            <option value="gerencia">Gerencia / Dirección General</option>
                            <option value="juridica">Oficina Jurídica</option>
                            <option value="financiera">Gestión Financiera</option>
                            <option value="archivo">Archivo Central</option>
                        </select>
                    </div>

                    <div class="campo-exp">
                        <label for="serieExpediente">Serie documental *</label>
                        <select id="serieExpediente" required>
                            <option value="">Seleccione una serie</option>
                        </select>
                    </div>

                    <div class="campo-exp">
                        <label for="subserieExpediente">Subserie documental *</label>
                        <select id="subserieExpediente" required disabled>
                            <option value="">Seleccione primero una serie</option>
                        </select>
                    </div>

                    <div class="campo-exp">
                        <label for="foliosExpediente">Número de folios registrados *</label>
                        <input type="number" id="foliosExpediente"
                            min="0" value="0" required>
                    </div>

                    <div class="campo-exp campo-exp-completo">
                        <label for="documentosExpediente">
                            Asociar documentos digitalizados
                        </label>

                        <select id="documentosExpediente" multiple size="5">
                        </select>

                        <small>
                            Mantenga presionada la tecla Ctrl (Windows)
                            para seleccionar varios documentos.
                        </small>
                    </div>

                    <div class="campo-exp">
                        <label for="estadoExpediente">Estado del expediente *</label>
                        <select id="estadoExpediente" required>
                            <option value="abierto">Abierto / Activo</option>
                            <option value="tramite">En trámite</option>
                            <option value="cerrado">Cerrado</option>
                        </select>
                    </div>

                    <div class="campo-exp campo-exp-completo">
                        <label for="observacionesExpediente">Observaciones</label>
                        <textarea id="observacionesExpediente" rows="3"
                            placeholder="Información adicional del expediente"></textarea>
                    </div>

                    <div class="acciones-modal-exp">
                        <button type="button" class="btn-secundario"
                            id="cancelarModalExpediente">
                            Cancelar
                        </button>

                        <button type="submit" class="btn-primario">
                            Guardar Expediente
                        </button>
                    </div>

                </form>
            </div>
        `;

        document.body.appendChild(modal);

        const estilos = document.createElement("style");

        estilos.textContent = `
            #modalExpediente {
                position: fixed;
                inset: 0;
                background: rgba(15, 35, 60, .55);
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
                z-index: 9999;
                overflow-y: auto;
            }

            .modal-exp-contenido {
                background: #fff;
                width: 100%;
                max-width: 760px;
                padding: 25px;
                border-radius: 12px;
                box-shadow: 0 10px 35px rgba(0,0,0,.2);
                max-height: 90vh;
                overflow-y: auto;
            }

            .modal-exp-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .modal-exp-header h2 {
                color: #2563A6;
                font-size: 20px;
                margin: 0;
            }

            #cerrarModalExpediente {
                border: 0;
                background: transparent;
                font-size: 28px;
                cursor: pointer;
            }

            #formularioExpediente {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 15px;
            }

            .campo-exp {
                display: flex;
                flex-direction: column;
                gap: 7px;
            }

            .campo-exp label {
                font-size: 13px;
                font-weight: 600;
            }

            .campo-exp input,
            .campo-exp select,
            .campo-exp textarea {
                width: 100%;
                padding: 11px;
                border: 1px solid #D5DDE8;
                border-radius: 7px;
                font: inherit;
                box-sizing: border-box;
            }

            .campo-exp select[multiple] {
                min-height: 120px;
            }

            .campo-exp small {
                color: #667085;
                font-size: 12px;
            }

            .campo-exp-completo,
            .acciones-modal-exp {
                grid-column: 1 / -1;
            }

            .acciones-modal-exp {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 10px;
            }

            @media(max-width: 600px) {
                #formularioExpediente {
                    grid-template-columns: 1fr;
                }

                .campo-exp-completo,
                .acciones-modal-exp {
                    grid-column: auto;
                }
            }
        `;

        document.head.appendChild(estilos);

        document.getElementById("cerrarModalExpediente")
            .addEventListener("click", cerrarModal);

        document.getElementById("cancelarModalExpediente")
            .addEventListener("click", cerrarModal);

        document.getElementById("formularioExpediente")
            .addEventListener("submit", guardarExpediente);

        document.getElementById("serieExpediente")
            .addEventListener("change", cargarSubseries);
    }

    // -------------------------------------------------
    // 9. CARGAR SERIES Y SUBSERIES DESDE LAS TRD
    // -------------------------------------------------

    function cargarSeries() {

        const selector = document.getElementById("serieExpediente");
        const trd = obtenerTRD();

        const series = [];

        trd.forEach(item => {
            if (!series.some(serie => serie.codigo === item.codigo)) {
                series.push({
                    codigo: item.codigo,
                    nombre: item.serie
                });
            }
        });

        selector.innerHTML = `<option value="">Seleccione una serie</option>`;

        series.forEach(item => {
            const opcion = document.createElement("option");

            opcion.value = item.codigo;
            opcion.textContent = `${item.codigo} - ${item.nombre}`;

            selector.appendChild(opcion);
        });
    }

    function cargarSubseries() {

        const codigoSerie = document.getElementById("serieExpediente").value;
        const selector = document.getElementById("subserieExpediente");

        const subseries = obtenerTRD().filter(item =>
            String(item.codigo) === String(codigoSerie)
        );

        selector.innerHTML = `<option value="">Seleccione una subserie</option>`;

        subseries.forEach(item => {

            const opcion = document.createElement("option");

            opcion.value = item.codigoSubserie;
            opcion.textContent = `${item.codigoSubserie} - ${item.subserie}`;

            selector.appendChild(opcion);
        });

        selector.disabled = subseries.length === 0;
    }

    // -------------------------------------------------
    // 10. CARGAR DOCUMENTOS DISPONIBLES
    // -------------------------------------------------

    function cargarDocumentosSeleccionables(documentosActuales = []) {

        const selector = document.getElementById("documentosExpediente");
        const documentos = obtenerDocumentosDigitalizados();

        selector.innerHTML = "";

        if (documentos.length === 0) {

            const opcion = document.createElement("option");
            opcion.value = "";
            opcion.textContent = "No hay documentos digitalizados disponibles";
            opcion.disabled = true;

            selector.appendChild(opcion);
            return;
        }

        documentos.forEach(documento => {

            const radicado = documento.radicado;
            const expedienteActual = radicado.expedienteId;

            // Mostrar documentos libres o los que ya pertenecen
            // al expediente que se está editando.
            if (
                expedienteActual &&
                expedienteActual !== expedienteEditando
            ) {
                return;
            }

            const opcion = document.createElement("option");

            opcion.value = documento.radicadoId;

            opcion.textContent =
                `${radicado.numeroRadicado} - ${radicado.asunto || documento.nombreArchivo}`;

            if (documentosActuales.includes(documento.radicadoId)) {
                opcion.selected = true;
            }

            selector.appendChild(opcion);
        });

        if (selector.options.length === 0) {
            const opcion = document.createElement("option");
            opcion.value = "";
            opcion.textContent = "No hay documentos disponibles para este expediente";
            opcion.disabled = true;
            selector.appendChild(opcion);
        }
    }

    // -------------------------------------------------
    // 11. ABRIR Y CERRAR MODAL
    // -------------------------------------------------

    function abrirModal() {

        crearModal();

        document.getElementById("tituloModalExpediente").textContent =
            expedienteEditando
                ? "Editar Expediente"
                : "Crear Nuevo Expediente";

        document.getElementById("modalExpediente").style.display = "flex";

        cargarSeries();
    }

    function cerrarModal() {

        const modal = document.getElementById("modalExpediente");

        if (modal) {
            modal.style.display = "none";
        }

        expedienteEditando = null;
    }

    // -------------------------------------------------
    // 12. CREAR NUEVO EXPEDIENTE
    // -------------------------------------------------

    if (btnNuevoExpediente) {

        btnNuevoExpediente.addEventListener("click", () => {

            expedienteEditando = null;

            abrirModal();

            const formulario = document.getElementById("formularioExpediente");
            formulario.reset();

            document.getElementById("codigoExpediente").value =
                generarCodigoExpediente();

            document.getElementById("subserieExpediente").innerHTML =
                `<option value="">Seleccione primero una serie</option>`;

            document.getElementById("subserieExpediente").disabled = true;

            cargarDocumentosSeleccionables();
        });
    }

    // -------------------------------------------------
    // 13. GUARDAR EXPEDIENTE
    // -------------------------------------------------

    function guardarExpediente(evento) {

        evento.preventDefault();

        const codigo = document.getElementById("codigoExpediente").value;
        const nombre = document.getElementById("nombreExpediente").value.trim();
        const dependencia = document.getElementById("dependenciaExpediente").value;
        const codigoSerie = document.getElementById("serieExpediente").value;
        const codigoSubserie = document.getElementById("subserieExpediente").value;
        const folios = Number(document.getElementById("foliosExpediente").value);
        const estado = document.getElementById("estadoExpediente").value;
        const observaciones = document.getElementById("observacionesExpediente").value.trim();

        const selectorDocumentos = document.getElementById("documentosExpediente");

        const documentosSeleccionados = Array.from(selectorDocumentos.selectedOptions)
            .map(opcion => opcion.value)
            .filter(Boolean);

        if (
            !codigo || !nombre || !dependencia ||
            !codigoSerie || !codigoSubserie ||
            !Number.isInteger(folios) || folios < 0
        ) {
            mostrarMensaje(
                "Complete los campos obligatorios del expediente.",
                "error"
            );
            return;
        }

        const trd = obtenerTRD();

        const registroTRD = trd.find(item =>
            String(item.codigo) === String(codigoSerie) &&
            String(item.codigoSubserie) === String(codigoSubserie)
        );

        if (!registroTRD) {
            mostrarMensaje(
                "La serie y subserie seleccionadas no corresponden a una TRD registrada.",
                "error"
            );
            return;
        }

        const expedientes = obtenerExpedientes();

        const documentosOcupados = obtenerRadicaciones().filter(radicado =>
            documentosSeleccionados.includes(radicado.id) &&
            radicado.expedienteId &&
            radicado.expedienteId !== expedienteEditando
        );

        if (documentosOcupados.length > 0) {
            mostrarMensaje(
                "Uno o más radicados seleccionados ya pertenecen a otro expediente.",
                "error"
            );
            return;
        }

        const radicaciones = obtenerRadicaciones();

        const documentos = documentosSeleccionados.map(radicadoId => {

            const radicado = radicaciones.find(item =>
                item.id === radicadoId
            );

            const digitalizacion = obtenerDigitalizaciones().find(item =>
                item.radicadoId === radicadoId
            );

            return {
                radicadoId,
                numeroRadicado: radicado?.numeroRadicado || "",
                nombreArchivo: digitalizacion?.nombreArchivo || "",
                fechaAsociacion: new Date().toISOString()
            };
        });

        const fechaActual = new Date().toISOString();

        const indiceExistente = expedientes.findIndex(item =>
            item.id === expedienteEditando
        );

        const registro = {
            id: expedienteEditando || "EXP-ID-" + Date.now(),
            codigo,
            nombre,
            dependencia,

            codigoSerie,
            serie: registroTRD.serie,

            codigoSubserie,
            subserie: registroTRD.subserie,

            folios,
            documentos,

            estado,
            observaciones,

            usuarioResponsable: sesion.nombre || sesion.usuario,
            usuarioId: sesion.usuarioId || sesion.id || null,

            fechaCreacion: indiceExistente >= 0
                ? expedientes[indiceExistente].fechaCreacion
                : fechaActual,

            fechaActualizacion: fechaActual
        };

        if (indiceExistente >= 0) {
            expedientes[indiceExistente] = registro;
        } else {
            expedientes.push(registro);
        }

        guardarDatos(CLAVE_EXPEDIENTES, expedientes);

        // Actualizar la relación de los radicados con el expediente.
        radicaciones.forEach(radicado => {

            if (radicado.expedienteId === registro.id) {
                delete radicado.expedienteId;
                delete radicado.codigoExpediente;
            }

            if (documentosSeleccionados.includes(radicado.id)) {
                radicado.expedienteId = registro.id;
                radicado.codigoExpediente = registro.codigo;
            }
        });

        guardarDatos(CLAVE_RADICACIONES, radicaciones);

        const estabaEditando = indiceExistente >= 0;

        cerrarModal();
        mostrarExpedientes();

        mostrarMensaje(
            estabaEditando
                ? "Expediente actualizado correctamente."
                : "Expediente creado correctamente.",
            "exito"
        );
    }

    // -------------------------------------------------
    // 14. EDITAR EXPEDIENTE
    // -------------------------------------------------

    function editarExpediente(id) {

        const expediente = obtenerExpedientes().find(item =>
            item.id === id
        );

        if (!expediente) return;

        if (expediente.estado === "cerrado") {
            mostrarMensaje(
                "Este expediente está cerrado y no se puede modificar.",
                "error"
            );
            return;
        }

        expedienteEditando = id;

        abrirModal();

        document.getElementById("formularioExpediente").reset();

        document.getElementById("codigoExpediente").value = expediente.codigo;
        document.getElementById("nombreExpediente").value = expediente.nombre;
        document.getElementById("dependenciaExpediente").value = expediente.dependencia;
        document.getElementById("foliosExpediente").value = expediente.folios;
        document.getElementById("estadoExpediente").value = expediente.estado;
        document.getElementById("observacionesExpediente").value =
            expediente.observaciones || "";

        document.getElementById("serieExpediente").value =
            expediente.codigoSerie;

        cargarSubseries();

        document.getElementById("subserieExpediente").value =
            expediente.codigoSubserie;

        const documentosActuales = (expediente.documentos || [])
            .map(item => item.radicadoId);

        cargarDocumentosSeleccionables(documentosActuales);
    }

    // -------------------------------------------------
    // 15. CONSULTAR DOCUMENTOS DEL EXPEDIENTE
    // -------------------------------------------------

    function verExpediente(id) {

        const expediente = obtenerExpedientes().find(item =>
            item.id === id
        );

        if (!expediente) return;

        const documentos = expediente.documentos || [];

        let detalle = "";

        documentos.forEach((documento, indice) => {
            detalle += `\n${indice + 1}. ${documento.numeroRadicado} - ${documento.nombreArchivo}`;
        });

        if (documentos.length === 0) {
            detalle = "\nEste expediente todavía no tiene documentos asociados.";
        }

        alert(
            "CONSULTA DEL EXPEDIENTE\n\n" +
            "Código: " + expediente.codigo + "\n" +
            "Nombre: " + expediente.nombre + "\n" +
            "Dependencia: " + nombreDependencia(expediente.dependencia) + "\n" +
            "Serie: " + expediente.codigoSerie + " - " + expediente.serie + "\n" +
            "Subserie: " + expediente.codigoSubserie + " - " + expediente.subserie + "\n" +
            "Folios registrados: " + expediente.folios + "\n" +
            "Estado: " + nombreEstado(expediente.estado) + "\n\n" +
            "DOCUMENTOS ASOCIADOS:" + detalle
        );
    }

    // -------------------------------------------------
    // 16. GENERAR ÍNDICE ELECTRÓNICO IMPRIMIBLE
    // -------------------------------------------------

    function generarIndice(id) {

        const expediente = obtenerExpedientes().find(item =>
            item.id === id
        );

        if (!expediente) return;

        const radicaciones = obtenerRadicaciones();
        const digitalizaciones = obtenerDigitalizaciones();

        const documentos = (expediente.documentos || []).map((item, indice) => {

            const radicado = radicaciones.find(registro =>
                registro.id === item.radicadoId
            );

            const digitalizacion = digitalizaciones.find(registro =>
                registro.radicadoId === item.radicadoId
            );

            return {
                orden: indice + 1,
                numero: item.numeroRadicado,
                fecha: radicado?.fecha || radicado?.fechaRadicacion || "",
                asunto: radicado?.asunto || "",
                archivo: digitalizacion?.nombreArchivo || item.nombreArchivo || "",
                tipo: digitalizacion?.tipoDocumental || ""
            };
        });

        const ventana = window.open("", "_blank");

        if (!ventana) {
            mostrarMensaje(
                "El navegador bloqueó la ventana del índice. Permita las ventanas emergentes para ARCHIVEX.",
                "error"
            );
            return;
        }

        const filas = documentos.length
            ? documentos.map(item => `
                <tr>
                    <td>${item.orden}</td>
                    <td>${escaparHTML(item.numero)}</td>
                    <td>${escaparHTML(item.fecha)}</td>
                    <td>${escaparHTML(item.asunto)}</td>
                    <td>${escaparHTML(item.tipo)}</td>
                    <td>${escaparHTML(item.archivo)}</td>
                </tr>
            `).join("")
            : `<tr><td colspan="6">No hay documentos asociados al expediente.</td></tr>`;

        ventana.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Índice electrónico - ${escaparHTML(expediente.codigo)}</title>

                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 35px;
                        color: #222;
                    }

                    h1, h2 {
                        color: #2563A6;
                    }

                    .encabezado {
                        text-align: center;
                        margin-bottom: 30px;
                    }

                    .datos {
                        margin-bottom: 25px;
                        line-height: 1.8;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 12px;
                    }

                    th, td {
                        border: 1px solid #999;
                        padding: 9px;
                        text-align: left;
                    }

                    th {
                        background: #EAF4FF;
                    }

                    .firma {
                        margin-top: 55px;
                    }

                    button {
                        padding: 10px 18px;
                        background: #2563A6;
                        color: white;
                        border: 0;
                        border-radius: 5px;
                        cursor: pointer;
                    }

                    @media print {
                        button {
                            display: none;
                        }
                    }
                </style>
            </head>

            <body>

                <div class="encabezado">
                    <h1>ARCHIVEX</h1>
                    <h2>ÍNDICE ELECTRÓNICO DEL EXPEDIENTE</h2>
                    <p>Gestión Documental Institucional</p>
                </div>

                <div class="datos">
                    <strong>Código:</strong> ${escaparHTML(expediente.codigo)}<br>
                    <strong>Nombre:</strong> ${escaparHTML(expediente.nombre)}<br>
                    <strong>Dependencia:</strong> ${escaparHTML(nombreDependencia(expediente.dependencia))}<br>
                    <strong>Serie:</strong> ${escaparHTML(expediente.codigoSerie)} - ${escaparHTML(expediente.serie)}<br>
                    <strong>Subserie:</strong> ${escaparHTML(expediente.codigoSubserie)} - ${escaparHTML(expediente.subserie)}<br>
                    <strong>Folios registrados:</strong> ${Number(expediente.folios) || 0}<br>
                    <strong>Estado:</strong> ${escaparHTML(nombreEstado(expediente.estado))}<br>
                    <strong>Fecha de generación:</strong> ${new Date().toLocaleDateString("es-CO")}
                </div>

                <h3>Relación de documentos</h3>

                <table>
                    <thead>
                        <tr>
                            <th>Orden</th>
                            <th>Número de radicado</th>
                            <th>Fecha</th>
                            <th>Asunto</th>
                            <th>Tipo documental</th>
                            <th>Archivo digital</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${filas}
                    </tbody>
                </table>

                <div class="firma">
                    <p>Responsable: ${escaparHTML(sesion.nombre || sesion.usuario)}</p>
                    <p>Firma: __________________________________</p>
                </div>

                <br>
                <button onclick="window.print()">Imprimir índice</button>

            </body>
            </html>
        `);

        ventana.document.close();
    }

    // -------------------------------------------------
    // 17. ACCIONES DE LA TABLA
    // -------------------------------------------------

    tablaExpedientes.addEventListener("click", evento => {

        const boton = evento.target.closest("button[data-accion]");

        if (!boton) return;

        const accion = boton.dataset.accion;
        const id = boton.dataset.id;

        if (accion === "ver") {
            verExpediente(id);
        }

        if (accion === "indice") {
            generarIndice(id);
        }

        if (accion === "editar") {
            editarExpediente(id);
        }
    });

    // -------------------------------------------------
    // 18. BUSCADORES
    // -------------------------------------------------

    if (buscarExpediente) {
        buscarExpediente.addEventListener("input", mostrarExpedientes);
    }

    if (filtroExpedientes) {
        filtroExpedientes.addEventListener("input", mostrarExpedientes);
    }

    // -------------------------------------------------
    // 19. CERRAR SESIÓN
    // -------------------------------------------------

    if (btnCerrarSesion) {

        btnCerrarSesion.addEventListener("click", evento => {

            evento.preventDefault();

            if (confirm("¿Está seguro de cerrar la sesión de ARCHIVEX?")) {
                localStorage.removeItem("archivex_sesion");
                window.location.href = "../acceso/login.html";
            }
        });
    }

    // -------------------------------------------------
    // 20. INICIAR MÓDULO
    // -------------------------------------------------

    mostrarExpedientes();

});
