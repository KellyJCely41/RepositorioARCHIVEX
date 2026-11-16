
/* =========================================================
   ARCHIVEX - MÓDULO DE TRANSFERENCIAS DOCUMENTALES
   Archivo: transferencias.js
   Almacenamiento temporal: localStorage
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const CLAVE_TRANSFERENCIAS = "archivex_transferencias";
    const CLAVE_EXPEDIENTES = "archivex_expedientes";
    const CLAVE_SESION = "archivex_sesion";

    const sesion = leerObjeto(CLAVE_SESION);

    if (!sesion) {
        window.location.href = "../acceso/login.html";
        return;
    }

    const tabla = document.getElementById("tablaTransferencias");
    const contador = document.getElementById("totalTransferencias");
    const btnNueva = document.getElementById("btnNuevaTransferencia");
    const buscar = document.getElementById("buscarTransferencia");
    const buscarGlobal = document.getElementById("buscarTransferenciaGlobal");
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    const inicialesUsuario = document.getElementById("inicialesUsuario");

    let transferencias = leerLista(CLAVE_TRANSFERENCIAS);
    let expedientes = leerLista(CLAVE_EXPEDIENTES);

    mostrarUsuario();
    actualizarEstados();
    renderizarTabla();

    if (btnNueva) {
        btnNueva.addEventListener("click", abrirFormulario);
    }

    if (buscar) {
        buscar.addEventListener("input", renderizarTabla);
    }

    if (buscarGlobal) {
        buscarGlobal.addEventListener("input", () => {
            if (buscar) buscar.value = buscarGlobal.value;
            renderizarTabla();
        });
    }

    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", cerrarSesion);
    }

    if (tabla) {
        tabla.addEventListener("click", manejarAcciones);
    }

    /* =====================================================
       FUNCIONES GENERALES
    ===================================================== */

    function leerObjeto(clave) {
        try {
            return JSON.parse(localStorage.getItem(clave));
        } catch {
            return null;
        }
    }

    function leerLista(clave) {
        const datos = leerObjeto(clave);
        return Array.isArray(datos) ? datos : [];
    }

    function guardarTransferencias() {
        localStorage.setItem(
            CLAVE_TRANSFERENCIAS,
            JSON.stringify(transferencias)
        );
    }

    function guardarExpedientes() {
        localStorage.setItem(
            CLAVE_EXPEDIENTES,
            JSON.stringify(expedientes)
        );
    }

    function fechaLocal(fecha = new Date()) {
        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, "0");
        const dia = String(fecha.getDate()).padStart(2, "0");

        return `${anio}-${mes}-${dia}`;
    }

    function formatearFecha(fecha) {
        if (!fecha) return "No registrada";

        const partes = String(fecha).substring(0, 10).split("-");

        if (partes.length !== 3) return fecha;

        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function escaparHTML(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[caracter]);
    }

    function nombreUsuario() {
        return sesion.nombre || sesion.usuario || sesion.correo || "Funcionario";
    }

    function mostrarUsuario() {
        if (!inicialesUsuario) return;

        inicialesUsuario.textContent = nombreUsuario()
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(p => p.charAt(0).toUpperCase())
            .join("") || "US";
    }

    function cerrarSesion() {
        if (!confirm("¿Deseas cerrar la sesión de ARCHIVEX?")) return;

        localStorage.removeItem(CLAVE_SESION);
        window.location.href = "../acceso/login.html";
    }

    function generarCodigo() {
        const anio = new Date().getFullYear();
        const prefijo = `TRF-${anio}-`;

        const numeros = transferencias
            .filter(t => t.codigoTransferencia?.startsWith(prefijo))
            .map(t => Number(t.codigoTransferencia.replace(prefijo, "")))
            .filter(Number.isFinite);

        const siguiente = numeros.length ? Math.max(...numeros) + 1 : 1;

        return prefijo + String(siguiente).padStart(3, "0");
    }

    function obtenerExpediente(id) {
        return expedientes.find(e => String(e.id) === String(id));
    }

    function nombreTipo(tipo) {
        return tipo === "primaria"
            ? "Transferencia Primaria"
            : "Transferencia Secundaria";
    }

    function obtenerDestino(tipo) {
        return tipo === "primaria"
            ? "Archivo Central"
            : "Archivo Histórico";
    }

    function obtenerOrigen(tipo) {
        return tipo === "primaria"
            ? "Archivo de Gestión"
            : "Archivo Central";
    }

    /* =====================================================
       ESTADOS Y VIGENCIA
    ===================================================== */

    function actualizarEstados() {
        let cambios = false;

        transferencias.forEach(t => {
            if (
                t.estado === "Programada" &&
                t.fechaProgramada < fechaLocal()
            ) {
                t.estado = "Pendiente";
                cambios = true;
            }
        });

        if (cambios) guardarTransferencias();
    }

    function claseEstado(estado) {
        switch (estado) {
            case "Completado":
                return "verde";
            case "Inventario aprobado":
                return "verde";
            case "Pendiente":
                return "rojo";
            case "Programada":
                return "azul";
            default:
                return "amarillo";
        }
    }

    /* =====================================================
       TABLA DE TRANSFERENCIAS
    ===================================================== */

    function renderizarTabla() {
        if (!tabla) return;

        actualizarEstados();

        const filtro = (buscar?.value || "").toLowerCase().trim();

        const resultados = transferencias.filter(t => {
            const texto = [
                t.codigoTransferencia,
                t.codigoExpediente,
                t.nombreExpediente,
                t.dependencia,
                t.tipo,
                nombreTipo(t.tipo),
                t.estado
            ].join(" ").toLowerCase();

            return texto.includes(filtro);
        });

        if (contador) {
            contador.textContent = `${transferencias.length} Transferencias`;
        }

        if (resultados.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:25px;">
                        No hay transferencias registradas.
                    </td>
                </tr>
            `;
            return;
        }

        tabla.innerHTML = resultados.map(t => {
            const esPrimaria = t.tipo === "primaria";
            const tipoClase = esPrimaria ? "azul" : "morado";
            const estadoClase = claseEstado(t.estado);

            let acciones = `
                <button type="button"
                    class="btn-accion-tabla"
                    data-accion="inventario"
                    data-id="${escaparHTML(t.id)}"
                    title="Ver inventario documental">
                    <i data-lucide="file-spreadsheet"></i>
                </button>
            `;

            if (t.estado !== "Completado") {
                if (t.estado !== "Inventario aprobado") {
                    acciones += `
                        <button type="button"
                            class="btn-accion-tabla"
                            data-accion="aprobar"
                            data-id="${escaparHTML(t.id)}"
                            title="Aprobar inventario">
                            <i data-lucide="check-circle"></i>
                        </button>
                    `;
                } else {
                    acciones += `
                        <button type="button"
                            class="btn-accion-tabla"
                            data-accion="completar"
                            data-id="${escaparHTML(t.id)}"
                            title="Confirmar traslado">
                            <i data-lucide="check-check"></i>
                        </button>
                    `;
                }
            }

            return `
                <tr>
                    <td>
                        <strong>${escaparHTML(t.codigoTransferencia)}</strong>
                        <br>
                        <span class="transf-sub">
                            ${escaparHTML(t.codigoExpediente)}
                        </span>
                    </td>

                    <td>
                        <div class="transf-celda-titulo">
                            ${escaparHTML(t.dependencia)}
                        </div>
                        <span class="transf-sub">
                            ${escaparHTML(t.nombreExpediente)}
                        </span>
                    </td>

                    <td>
                        <span class="badge ${tipoClase}">
                            ${nombreTipo(t.tipo)}
                        </span>
                        <br>
                        <span class="transf-sub">
                            ${obtenerOrigen(t.tipo)} → ${obtenerDestino(t.tipo)}
                        </span>
                    </td>

                    <td>${formatearFecha(t.fechaProgramada)}</td>

                    <td>
                        <span class="badge ${estadoClase}">
                            ${escaparHTML(t.estado)}
                        </span>
                    </td>

                    <td>
                        <div class="acciones-fila-grupo">
                            ${acciones}
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        if (window.lucide) lucide.createIcons();
    }

    /* =====================================================
       FORMULARIO DE PROGRAMACIÓN
    ===================================================== */

    function abrirFormulario() {
        expedientes = leerLista(CLAVE_EXPEDIENTES);

        const disponibles = expedientes.filter(e => {
            const estado = String(e.estado || "").toLowerCase();
            return !["eliminado", "cerrado"].includes(estado);
        });

        if (disponibles.length === 0) {
            alert("No hay expedientes disponibles. Registra primero un expediente.");
            return;
        }

        const opciones = disponibles.map(e => `
            <option value="${escaparHTML(e.id)}">
                ${escaparHTML(e.codigo)} - ${escaparHTML(e.nombre)}
            </option>
        `).join("");

        const modal = document.createElement("div");
        modal.id = "modalTransferenciaArchivex";

        modal.innerHTML = `
            <div class="modal-transf-fondo">
                <div class="modal-transf-contenido">

                    <div class="modal-transf-cabecera">
                        <div>
                            <h2>Programar transferencia documental</h2>
                            <p>Registra el expediente y el traslado correspondiente.</p>
                        </div>
                        <button type="button" id="cerrarModalTransf"
                                class="modal-transf-cerrar">&times;</button>
                    </div>

                    <form id="formTransferencia">

                        <div class="campo-transf">
                            <label>Código de transferencia</label>
                            <input type="text" value="${generarCodigo()}" readonly>
                        </div>

                        <div class="campo-transf">
                            <label for="tipoTransferencia">Tipo de transferencia *</label>
                            <select id="tipoTransferencia" required>
                                <option value="">Seleccionar tipo</option>
                                <option value="primaria">
                                    Primaria (Gestión → Central)
                                </option>
                                <option value="secundaria">
                                    Secundaria (Central → Histórico)
                                </option>
                            </select>
                        </div>

                        <div class="campo-transf">
                            <label for="expedienteTransferencia">Expediente *</label>
                            <select id="expedienteTransferencia" required>
                                <option value="">Seleccionar expediente</option>
                                ${opciones}
                            </select>
                            <small id="ayudaExpedienteTransf">
                                Selecciona el expediente que será transferido.
                            </small>
                        </div>

                        <div class="campo-transf">
                            <label for="dependenciaTransferencia">
                                Dependencia remitente *
                            </label>
                            <input type="text" id="dependenciaTransferencia"
                                   maxlength="120"
                                   placeholder="Ej. Oficina Jurídica" required>
                        </div>

                        <div class="campo-transf">
                            <label for="fechaTransferencia">
                                Fecha programada *
                            </label>
                            <input type="date" id="fechaTransferencia"
                                   min="${fechaLocal()}"
                                   value="${fechaLocal()}" required>
                        </div>

                        <div class="campo-transf">
                            <label for="observacionesTransferencia">Observaciones</label>
                            <textarea id="observacionesTransferencia" rows="3"
                                placeholder="Información adicional del traslado"></textarea>
                        </div>

                        <div class="modal-transf-acciones">
                            <button type="button" id="cancelarTransferencia"
                                    class="btn-cancelar-transf">
                                Cancelar
                            </button>
                            <button type="submit" class="btn-guardar-transf">
                                Programar transferencia
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        `;

        agregarEstilos();
        document.body.appendChild(modal);

        document.getElementById("cerrarModalTransf")
            .addEventListener("click", cerrarModal);

        document.getElementById("cancelarTransferencia")
            .addEventListener("click", cerrarModal);

        document.getElementById("formTransferencia")
            .addEventListener("submit", registrarTransferencia);

        const tipo = document.getElementById("tipoTransferencia");
        const selector = document.getElementById("expedienteTransferencia");
        const ayuda = document.getElementById("ayudaExpedienteTransf");

        function actualizarAyuda() {
            const seleccionado = obtenerExpediente(selector.value);

            if (tipo.value === "primaria") {
                ayuda.textContent =
                    "Traslado desde el Archivo de Gestión al Archivo Central.";
            } else if (tipo.value === "secundaria") {
                ayuda.textContent =
                    "Solo deben seleccionarse expedientes ubicados en el Archivo Central.";
            } else {
                ayuda.textContent = "Selecciona el tipo de transferencia.";
            }

            if (seleccionado && tipo.value === "secundaria") {
                ayuda.textContent +=
                    " Ubicación actual: " +
                    (seleccionado.ubicacionArchivo || "Archivo de Gestión") + ".";
            }
        }

        tipo.addEventListener("change", actualizarAyuda);
        selector.addEventListener("change", actualizarAyuda);
    }

    function cerrarModal() {
        document.getElementById("modalTransferenciaArchivex")?.remove();
    }

    /* =====================================================
       REGISTRAR TRANSFERENCIA
    ===================================================== */

    function registrarTransferencia(evento) {
        evento.preventDefault();

        const tipo = document.getElementById("tipoTransferencia").value;
        const expedienteId = document.getElementById("expedienteTransferencia").value;
        const dependencia = document.getElementById("dependenciaTransferencia").value.trim();
        const fechaProgramada = document.getElementById("fechaTransferencia").value;
        const observaciones = document.getElementById("observacionesTransferencia").value.trim();

        const expediente = obtenerExpediente(expedienteId);

        if (!tipo || !expediente || !dependencia || !fechaProgramada) {
            alert("Completa todos los campos obligatorios.");
            return;
        }

        if (!["primaria", "secundaria"].includes(tipo)) {
            alert("Selecciona un tipo de transferencia válido.");
            return;
        }

        if (fechaProgramada < fechaLocal()) {
            alert("La fecha programada no puede ser anterior a hoy.");
            return;
        }

        const ubicacion = expediente.ubicacionArchivo || "Archivo de Gestión";

        if (tipo === "primaria" && ubicacion !== "Archivo de Gestión") {
            alert(
                "La transferencia primaria requiere un expediente ubicado " +
                "en el Archivo de Gestión."
            );
            return;
        }

        if (tipo === "secundaria" && ubicacion !== "Archivo Central") {
            alert(
                "La transferencia secundaria requiere un expediente ubicado " +
                "en el Archivo Central. Primero debe realizarse la transferencia primaria."
            );
            return;
        }

        const yaProgramada = transferencias.some(t =>
            String(t.expedienteId) === String(expediente.id) &&
            t.estado !== "Completado"
        );

        if (yaProgramada) {
            alert("Este expediente ya tiene una transferencia pendiente.");
            return;
        }

        const codigo = generarCodigo();

        const documentos = Array.isArray(expediente.documentos)
            ? expediente.documentos
            : [];

        const inventario = documentos.map((documento, indice) => ({
            numero: indice + 1,
            radicado: documento.numeroRadicado || "",
            nombreDocumento: documento.nombreArchivo || documento.nombre || "Documento asociado"
        }));

        const nueva = {
            id: `TRF-${Date.now()}`,
            codigoTransferencia: codigo,

            expedienteId: expediente.id,
            codigoExpediente: expediente.codigo,
            nombreExpediente: expediente.nombre,

            tipo,
            origen: obtenerOrigen(tipo),
            destino: obtenerDestino(tipo),

            dependencia,
            fechaProgramada,
            fechaRegistro: new Date().toISOString(),

            observaciones,
            inventario,

            estado: "Programada",

            usuarioRegistro: nombreUsuario(),
            usuarioId: sesion.id || sesion.usuario || null
        };

        transferencias.push(nueva);
        guardarTransferencias();

        cerrarModal();
        renderizarTabla();

        alert(`Transferencia ${codigo} programada correctamente.`);
    }

    /* =====================================================
       ACCIONES DE LA TABLA
    ===================================================== */

    function manejarAcciones(evento) {
        const boton = evento.target.closest("button[data-accion]");
        if (!boton) return;

        const transferencia = transferencias.find(
            t => t.id === boton.dataset.id
        );

        if (!transferencia) return;

        switch (boton.dataset.accion) {
            case "inventario":
                verInventario(transferencia);
                break;

            case "aprobar":
                aprobarInventario(transferencia);
                break;

            case "completar":
                completarTransferencia(transferencia);
                break;
        }
    }

    /* =====================================================
       VER INVENTARIO DOCUMENTAL
    ===================================================== */

    function verInventario(transferencia) {
        const expediente = obtenerExpediente(transferencia.expedienteId);
        const documentos = transferencia.inventario || [];

        const filas = documentos.length
            ? documentos.map(doc => `
                <tr>
                    <td>${doc.numero}</td>
                    <td>${escaparHTML(doc.radicado || "—")}</td>
                    <td>${escaparHTML(doc.nombreDocumento)}</td>
                </tr>
            `).join("")
            : `
                <tr>
                    <td colspan="3">
                        No hay documentos asociados registrados en el expediente.
                    </td>
                </tr>
            `;

        const modal = document.createElement("div");
        modal.id = "modalInventarioTransf";

        modal.innerHTML = `
            <div class="modal-transf-fondo">
                <div class="modal-transf-contenido modal-inventario">

                    <div class="modal-transf-cabecera">
                        <div>
                            <h2>Inventario documental</h2>
                            <p>${escaparHTML(transferencia.codigoTransferencia)}</p>
                        </div>
                        <button type="button" id="cerrarInventario"
                                class="modal-transf-cerrar">&times;</button>
                    </div>

                    <p><strong>Expediente:</strong>
                        ${escaparHTML(transferencia.codigoExpediente)}
                        - ${escaparHTML(transferencia.nombreExpediente)}
                    </p>

                    <p><strong>Tipo:</strong> ${nombreTipo(transferencia.tipo)}</p>
                    <p><strong>Origen:</strong> ${transferencia.origen}</p>
                    <p><strong>Destino:</strong> ${transferencia.destino}</p>
                    <p><strong>Dependencia:</strong> ${escaparHTML(transferencia.dependencia)}</p>
                    <p><strong>Folios:</strong> ${escaparHTML(expediente?.folios ?? "No informado")}</p>

                    <div class="tabla-contenedor">
                        <table class="tabla-datos">
                            <thead>
                                <tr>
                                    <th>N.º</th>
                                    <th>Radicado</th>
                                    <th>Documento</th>
                                </tr>
                            </thead>
                            <tbody>${filas}</tbody>
                        </table>
                    </div>

                    <div class="modal-transf-acciones">
                        <button type="button" id="imprimirInventario"
                                class="btn-guardar-transf">
                            Imprimir inventario
                        </button>
                    </div>

                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById("cerrarInventario")
            .addEventListener("click", () => modal.remove());

        document.getElementById("imprimirInventario")
            .addEventListener("click", () => {
                const contenido = modal.querySelector(".modal-inventario").innerHTML;
                const ventana = window.open("", "_blank");

                if (!ventana) {
                    alert("Permite las ventanas emergentes para imprimir el inventario.");
                    return;
                }

                ventana.document.write(`
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                        <meta charset="UTF-8">
                        <title>Inventario ${escaparHTML(transferencia.codigoTransferencia)}</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 25px; color: #222; }
                            h2 { color: #2563A6; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #bbb; padding: 9px; text-align: left; }
                            th { background: #eaf4ff; }
                            button { display: none; }
                        </style>
                    </head>
                    <body>${contenido}</body>
                    </html>
                `);

                ventana.document.close();
                ventana.focus();
                ventana.print();
            });
    }

    /* =====================================================
       APROBAR INVENTARIO
    ===================================================== */

    function aprobarInventario(transferencia) {
        if (transferencia.estado === "Completado") return;

        const confirmar = confirm(
            `¿Confirmas la aprobación del inventario de ${transferencia.codigoTransferencia}?`
        );

        if (!confirmar) return;

        transferencia.estado = "Inventario aprobado";
        transferencia.fechaAprobacion = new Date().toISOString();
        transferencia.usuarioAprobacion = nombreUsuario();

        guardarTransferencias();
        renderizarTabla();

        alert("Inventario aprobado. Ya puedes confirmar el traslado documental.");
    }

    /* =====================================================
       COMPLETAR TRASLADO
    ===================================================== */

    function completarTransferencia(transferencia) {
        if (transferencia.estado !== "Inventario aprobado") {
            alert("Primero debes aprobar el inventario documental.");
            return;
        }

        expedientes = leerLista(CLAVE_EXPEDIENTES);

        const expediente = obtenerExpediente(transferencia.expedienteId);

        if (!expediente) {
            alert("No se encontró el expediente relacionado.");
            return;
        }

        const confirmar = confirm(
            `¿Confirmas que el expediente ${transferencia.codigoExpediente} ` +
            `fue entregado al ${transferencia.destino}?`
        );

        if (!confirmar) return;

        const ubicacionEsperada = transferencia.tipo === "primaria"
            ? "Archivo de Gestión"
            : "Archivo Central";

        if (
            (expediente.ubicacionArchivo || "Archivo de Gestión") !== ubicacionEsperada
        ) {
            alert(
                "La ubicación actual del expediente no coincide con el origen " +
                "de esta transferencia. Verifica el historial antes de continuar."
            );
            return;
        }

        expediente.ubicacionArchivo = transferencia.destino;
        expediente.fechaUltimaTransferencia = new Date().toISOString();
        expediente.ultimaTransferenciaId = transferencia.id;

        transferencia.estado = "Completado";
        transferencia.fechaCompletado = new Date().toISOString();
        transferencia.usuarioEntrega = nombreUsuario();

        guardarExpedientes();
        guardarTransferencias();

        renderizarTabla();

        alert(
            `Transferencia ${transferencia.codigoTransferencia} completada.\n` +
            `Nueva ubicación: ${transferencia.destino}.`
        );
    }

    /* =====================================================
       ESTILOS DEL MODAL
    ===================================================== */

    function agregarEstilos() {
        if (document.getElementById("estilosTransferencias")) return;

        const estilos = document.createElement("style");
        estilos.id = "estilosTransferencias";

        estilos.textContent = `
            .modal-transf-fondo {
                position: fixed;
                inset: 0;
                z-index: 9999;
                background: rgba(15, 30, 50, .60);
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
                overflow-y: auto;
            }

            .modal-transf-contenido {
                background: #fff;
                width: 100%;
                max-width: 650px;
                max-height: 90vh;
                overflow-y: auto;
                padding: 25px;
                border-radius: 14px;
                box-shadow: 0 12px 35px rgba(0,0,0,.20);
            }

            .modal-inventario {
                max-width: 850px;
            }

            .modal-transf-cabecera {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 15px;
                margin-bottom: 22px;
            }

            .modal-transf-cabecera h2 {
                margin: 0 0 6px;
                color: #2563A6;
                font-size: 21px;
            }

            .modal-transf-cabecera p {
                color: #64748b;
                margin: 0;
                font-size: 13px;
            }

            .modal-transf-cerrar {
                background: transparent;
                border: none;
                color: #64748b;
                font-size: 28px;
                cursor: pointer;
            }

            .campo-transf {
                display: flex;
                flex-direction: column;
                gap: 7px;
                margin-bottom: 16px;
            }

            .campo-transf label {
                color: #334155;
                font-size: 13px;
                font-weight: 600;
            }

            .campo-transf input,
            .campo-transf select,
            .campo-transf textarea {
                width: 100%;
                box-sizing: border-box;
                padding: 11px 12px;
                border: 1px solid #cbd5e1;
                border-radius: 7px;
                font: inherit;
                font-size: 14px;
                background: #fff;
            }

            .campo-transf small {
                color: #64748b;
                font-size: 12px;
            }

            .modal-transf-acciones {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 22px;
            }

            .btn-cancelar-transf,
            .btn-guardar-transf {
                border: none;
                padding: 11px 17px;
                border-radius: 7px;
                cursor: pointer;
                font-weight: 600;
            }

            .btn-cancelar-transf {
                background: #e2e8f0;
                color: #334155;
            }

            .btn-guardar-transf {
                background: #2563A6;
                color: #fff;
            }

            .btn-guardar-transf:hover {
                background: #1d4f85;
            }

            @media (max-width: 600px) {
                .modal-transf-contenido {
                    padding: 18px;
                }
            }
        `;

        document.head.appendChild(estilos);
    }

});
