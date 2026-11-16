
/* =========================================================
   ARCHIVEX - MÓDULO DE DISPOSICIÓN FINAL
   Archivo: disposicion.js
   Almacenamiento temporal: localStorage
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const CLAVE_ACTAS = "archivex_disposiciones";
    const CLAVE_EXPEDIENTES = "archivex_expedientes";
    const CLAVE_TRD = "archivex_trd";
    const CLAVE_SESION = "archivex_sesion";

    const sesion = leerObjeto(CLAVE_SESION);

    if (!sesion) {
        window.location.href = "../acceso/login.html";
        return;
    }

    const tabla = document.getElementById("tablaDisposicion");
    const contador = document.getElementById("totalActas");
    const btnNueva = document.getElementById("btnNuevaActa");
    const buscar = document.getElementById("buscarDisposicion");
    const buscarGlobal = document.getElementById("buscarDisposicionGlobal");
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    const inicialesUsuario = document.getElementById("inicialesUsuario");

    let actas = leerLista(CLAVE_ACTAS);
    let expedientes = leerLista(CLAVE_EXPEDIENTES);
    let trd = leerLista(CLAVE_TRD);

    mostrarUsuario();
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

    function guardarActas() {
        localStorage.setItem(CLAVE_ACTAS, JSON.stringify(actas));
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
        return sesion.nombre ||
            sesion.usuario ||
            sesion.correo ||
            "Funcionario";
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

    function generarCodigoActa() {
        const anio = new Date().getFullYear();
        const prefijo = `ACT-${anio}-`;

        const numeros = actas
            .filter(a => a.codigoActa?.startsWith(prefijo))
            .map(a => Number(a.codigoActa.replace(prefijo, "")))
            .filter(Number.isFinite);

        const siguiente = numeros.length
            ? Math.max(...numeros) + 1
            : 1;

        return prefijo + String(siguiente).padStart(3, "0");
    }

    function obtenerExpediente(id) {
        return expedientes.find(e => String(e.id) === String(id));
    }

    function obtenerTRD(id) {
        return trd.find(t => String(t.id) === String(id));
    }

    function normalizar(valor) {
        return String(valor || "").trim().toLowerCase();
    }

    function nombreDisposicion(valor) {
        const nombres = {
            E: "Eliminación",
            S: "Selección",
            CT: "Conservación Total",
            M: "Medio técnico"
        };

        return nombres[String(valor || "").toUpperCase()] ||
            valor ||
            "Sin disposición definida";
    }

    function claseDisposicion(valor) {
        const codigo = String(valor || "").toUpperCase();

        if (codigo === "E") return "amarillo";
        if (codigo === "S") return "morado";
        if (codigo === "CT") return "azul";
        return "gris";
    }

    function claseEstado(estado) {
        switch (estado) {
            case "Aprobada":
            case "Ejecución registrada":
            case "Conservación registrada":
                return "verde";

            case "No aprobada":
                return "rojo";

            case "Pendiente de aprobación":
                return "azul";

            default:
                return "amarillo";
        }
    }

    /* =====================================================
       RENDERIZAR TABLA
    ===================================================== */

    function renderizarTabla() {
        if (!tabla) return;

        const filtro = (buscar?.value || "").toLowerCase().trim();

        const resultados = actas.filter(acta => {
            const texto = [
                acta.codigoActa,
                acta.codigoExpediente,
                acta.nombreExpediente,
                acta.serie,
                acta.subserie,
                acta.disposicion,
                nombreDisposicion(acta.disposicion),
                acta.estado
            ].join(" ").toLowerCase();

            return texto.includes(filtro);
        });

        if (contador) {
            contador.textContent = `${actas.length} Actas registradas`;
        }

        if (resultados.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:25px;">
                        No hay procesos de disposición final registrados.
                    </td>
                </tr>
            `;
            return;
        }

        tabla.innerHTML = resultados.map(acta => {
            let acciones = `
                <button type="button"
                    class="btn-accion-tabla"
                    data-accion="detalle"
                    data-id="${escaparHTML(acta.id)}"
                    title="Ver detalle del acta">
                    <i data-lucide="file-text"></i>
                </button>
            `;

            if (acta.estado === "Pendiente de aprobación") {
                acciones += `
                    <button type="button"
                        class="btn-accion-tabla"
                        data-accion="aprobar"
                        data-id="${escaparHTML(acta.id)}"
                        title="Aprobar acta">
                        <i data-lucide="check-circle"></i>
                    </button>

                    <button type="button"
                        class="btn-accion-tabla"
                        data-accion="rechazar"
                        data-id="${escaparHTML(acta.id)}"
                        title="No aprobar acta">
                        <i data-lucide="x-circle"></i>
                    </button>
                `;
            }

            if (acta.estado === "Aprobada") {
                acciones += `
                    <button type="button"
                        class="btn-accion-tabla"
                        data-accion="ejecutar"
                        data-id="${escaparHTML(acta.id)}"
                        title="Registrar ejecución">
                        <i data-lucide="clipboard-check"></i>
                    </button>
                `;
            }

            return `
                <tr>
                    <td>
                        <strong>${escaparHTML(acta.codigoActa)}</strong>
                        <br>
                        <span class="disp-sub">
                            ${escaparHTML(acta.codigoExpediente)}
                        </span>
                    </td>

                    <td>
                        <div class="disp-celda-titulo">
                            ${escaparHTML(acta.serie)}
                        </div>
                        <span class="disp-sub">
                            ${escaparHTML(acta.subserie || acta.nombreExpediente)}
                        </span>
                    </td>

                    <td>
                        <span class="badge ${claseDisposicion(acta.disposicion)}">
                            ${nombreDisposicion(acta.disposicion)}
                        </span>
                    </td>

                    <td>${formatearFecha(acta.fechaValidacion)}</td>

                    <td>
                        <span class="badge ${claseEstado(acta.estado)}">
                            ${escaparHTML(acta.estado)}
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
       FORMULARIO NUEVA ACTA
    ===================================================== */

    function abrirFormulario() {
        expedientes = leerLista(CLAVE_EXPEDIENTES);
        trd = leerLista(CLAVE_TRD);

        if (expedientes.length === 0) {
            alert("Primero debes registrar expedientes en ARCHIVEX.");
            return;
        }

        if (trd.length === 0) {
            alert("No hay Tablas de Retención Documental registradas. Primero configura el módulo TRD.");
            return;
        }

        const opcionesExpedientes = expedientes
            .filter(e => !["eliminado", "cerrado"].includes(normalizar(e.estado)))
            .map(e => `
                <option value="${escaparHTML(e.id)}">
                    ${escaparHTML(e.codigo)} - ${escaparHTML(e.nombre)}
                </option>
            `).join("");

        const opcionesTRD = trd
            .filter(t => normalizar(t.estado) !== "inactivo")
            .map(t => `
                <option value="${escaparHTML(t.id)}">
                    ${escaparHTML(t.codigo)} - ${escaparHTML(t.serie)}
                    / ${escaparHTML(t.codigoSubserie || "")}
                    ${escaparHTML(t.subserie || "")}
                    (${escaparHTML(t.disposicion || "Sin disposición")})
                </option>
            `).join("");

        const modal = document.createElement("div");
        modal.id = "modalDisposicionArchivex";

        modal.innerHTML = `
            <div class="modal-disp-fondo">
                <div class="modal-disp-contenido">

                    <div class="modal-disp-cabecera">
                        <div>
                            <h2>Generar acta de disposición final</h2>
                            <p>Registra la evaluación documental de acuerdo con la TRD.</p>
                        </div>

                        <button type="button" id="cerrarModalDisp"
                                class="modal-disp-cerrar">&times;</button>
                    </div>

                    <form id="formDisposicion">

                        <div class="campo-disp">
                            <label>Código del acta</label>
                            <input type="text" value="${generarCodigoActa()}" readonly>
                        </div>

                        <div class="campo-disp">
                            <label for="expedienteDisposicion">
                                Expediente *
                            </label>

                            <select id="expedienteDisposicion" required>
                                <option value="">Seleccionar expediente</option>
                                ${opcionesExpedientes}
                            </select>
                        </div>

                        <div class="campo-disp">
                            <label for="trdDisposicion">
                                Serie / Subserie TRD *
                            </label>

                            <select id="trdDisposicion" required>
                                <option value="">Seleccionar serie o subserie</option>
                                ${opcionesTRD}
                            </select>
                            <small id="ayudaTRDDisp">
                                Selecciona la disposición definida en la TRD vigente.
                            </small>
                        </div>

                        <div class="campo-disp">
                            <label for="fechaValidacionDisp">
                                Fecha de validación *
                            </label>

                            <input type="date" id="fechaValidacionDisp"
                                   value="${fechaLocal()}" required>
                        </div>

                        <div class="campo-disp">
                            <label for="observacionesDisp">
                                Justificación / Observaciones *
                            </label>

                            <textarea id="observacionesDisp" rows="4"
                                placeholder="Describe la evaluación documental y su fundamento en la TRD."
                                required></textarea>
                        </div>

                        <div class="campo-disp">
                            <label for="referenciaComite">
                                Referencia del comité o autorización
                            </label>

                            <input type="text" id="referenciaComite"
                                   maxlength="150"
                                   placeholder="Número de sesión, acta o autorización">
                        </div>

                        <p class="aviso-disp">
                            La creación de esta acta no autoriza por sí sola
                            la eliminación de documentos. Se requiere aprobación
                            y registro formal de la ejecución.
                        </p>

                        <div class="modal-disp-acciones">
                            <button type="button" id="cancelarDisp"
                                    class="btn-cancelar-disp">
                                Cancelar
                            </button>

                            <button type="submit" class="btn-guardar-disp">
                                Registrar acta
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        `;

        agregarEstilos();
        document.body.appendChild(modal);

        document.getElementById("cerrarModalDisp")
            .addEventListener("click", cerrarModal);

        document.getElementById("cancelarDisp")
            .addEventListener("click", cerrarModal);

        document.getElementById("formDisposicion")
            .addEventListener("submit", registrarActa);

        const selectorTRD = document.getElementById("trdDisposicion");
        const ayuda = document.getElementById("ayudaTRDDisp");

        selectorTRD.addEventListener("change", () => {
            const seleccion = obtenerTRD(selectorTRD.value);

            if (seleccion) {
                ayuda.textContent =
                    `Disposición definida: ${nombreDisposicion(seleccion.disposicion)}. ` +
                    `Retención en gestión: ${seleccion.retencionGestion || "No informada"}. ` +
                    `Retención central: ${seleccion.retencionCentral || "No informada"}.`;
            }
        });
    }

    function cerrarModal() {
        document.getElementById("modalDisposicionArchivex")?.remove();
    }

    /* =====================================================
       REGISTRAR ACTA
    ===================================================== */

    function registrarActa(evento) {
        evento.preventDefault();

        const expedienteId =
            document.getElementById("expedienteDisposicion").value;

        const trdId =
            document.getElementById("trdDisposicion").value;

        const fechaValidacion =
            document.getElementById("fechaValidacionDisp").value;

        const observaciones =
            document.getElementById("observacionesDisp").value.trim();

        const referenciaComite =
            document.getElementById("referenciaComite").value.trim();

        const expediente = obtenerExpediente(expedienteId);
        const registroTRD = obtenerTRD(trdId);

        if (!expediente || !registroTRD) {
            alert("Selecciona un expediente y una serie o subserie TRD válidos.");
            return;
        }

        if (!["E", "S", "CT", "M"].includes(
            String(registroTRD.disposicion || "").toUpperCase()
        )) {
            alert("La disposición seleccionada no tiene un código válido en la TRD.");
            return;
        }

        if (!fechaValidacion || !observaciones) {
            alert("Completa la fecha de validación y la justificación.");
            return;
        }

        const yaExiste = actas.some(a =>
            String(a.expedienteId) === String(expediente.id) &&
            a.estado !== "No aprobada" &&
            a.estado !== "Ejecución registrada" &&
            a.estado !== "Conservación registrada"
        );

        if (yaExiste) {
            alert("Este expediente ya tiene un proceso de disposición pendiente.");
            return;
        }

        const codigo = generarCodigoActa();

        const nuevaActa = {
            id: `ACT-${Date.now()}`,
            codigoActa: codigo,

            expedienteId: expediente.id,
            codigoExpediente: expediente.codigo,
            nombreExpediente: expediente.nombre,

            trdId: registroTRD.id,
            codigoSerie: registroTRD.codigo,
            serie: registroTRD.serie,
            codigoSubserie: registroTRD.codigoSubserie,
            subserie: registroTRD.subserie,
            disposicion: String(registroTRD.disposicion).toUpperCase(),

            fechaValidacion,
            observaciones,
            referenciaComite,

            estado: "Pendiente de aprobación",

            fechaRegistro: new Date().toISOString(),
            usuarioRegistro: nombreUsuario(),
            usuarioId: sesion.id || sesion.usuario || null,

            fechaAprobacion: null,
            usuarioAprobacion: null,
            fechaEjecucion: null,
            usuarioEjecucion: null
        };

        actas.push(nuevaActa);
        guardarActas();

        cerrarModal();
        renderizarTabla();

        alert(
            `Acta ${codigo} registrada correctamente.\n` +
            "Quedó pendiente de aprobación."
        );
    }

    /* =====================================================
       ACCIONES DE LA TABLA
    ===================================================== */

    function manejarAcciones(evento) {
        const boton = evento.target.closest("button[data-accion]");

        if (!boton) return;

        const acta = actas.find(a => a.id === boton.dataset.id);

        if (!acta) return;

        switch (boton.dataset.accion) {
            case "detalle":
                verDetalle(acta);
                break;

            case "aprobar":
                aprobarActa(acta);
                break;

            case "rechazar":
                rechazarActa(acta);
                break;

            case "ejecutar":
                registrarEjecucion(acta);
                break;
        }
    }

    /* =====================================================
       DETALLE DEL ACTA
    ===================================================== */

    function verDetalle(acta) {
        const expediente = obtenerExpediente(acta.expedienteId);

        const modal = document.createElement("div");
        modal.id = "modalDetalleDisp";

        modal.innerHTML = `
            <div class="modal-disp-fondo">
                <div class="modal-disp-contenido">

                    <div class="modal-disp-cabecera">
                        <div>
                            <h2>Detalle del acta</h2>
                            <p>${escaparHTML(acta.codigoActa)}</p>
                        </div>

                        <button type="button" id="cerrarDetalleDisp"
                                class="modal-disp-cerrar">&times;</button>
                    </div>

                    <div class="detalle-disp">
                        <p><strong>Expediente:</strong>
                            ${escaparHTML(acta.codigoExpediente)} -
                            ${escaparHTML(acta.nombreExpediente)}
                        </p>

                        <p><strong>Serie:</strong>
                            ${escaparHTML(acta.codigoSerie)} -
                            ${escaparHTML(acta.serie)}
                        </p>

                        <p><strong>Subserie:</strong>
                            ${escaparHTML(acta.codigoSubserie || "No informada")} -
                            ${escaparHTML(acta.subserie || "No informada")}
                        </p>

                        <p><strong>Disposición:</strong>
                            ${nombreDisposicion(acta.disposicion)}
                        </p>

                        <p><strong>Fecha de validación:</strong>
                            ${formatearFecha(acta.fechaValidacion)}
                        </p>

                        <p><strong>Estado:</strong>
                            ${escaparHTML(acta.estado)}
                        </p>

                        <p><strong>Observaciones:</strong>
                            ${escaparHTML(acta.observaciones)}
                        </p>

                        <p><strong>Referencia del comité:</strong>
                            ${escaparHTML(acta.referenciaComite || "No registrada")}
                        </p>

                        <hr>

                        <p><strong>Registró:</strong>
                            ${escaparHTML(acta.usuarioRegistro)}
                        </p>

                        <p><strong>Aprobó:</strong>
                            ${escaparHTML(acta.usuarioAprobacion || "Pendiente")}
                        </p>

                        <p><strong>Fecha de aprobación:</strong>
                            ${formatearFecha(acta.fechaAprobacion)}
                        </p>

                        <p><strong>Ejecutó:</strong>
                            ${escaparHTML(acta.usuarioEjecucion || "Pendiente")}
                        </p>

                        <p><strong>Fecha de ejecución:</strong>
                            ${formatearFecha(acta.fechaEjecucion)}
                        </p>

                        <p><strong>Folios del expediente:</strong>
                            ${escaparHTML(expediente?.folios ?? "No informados")}
                        </p>
                    </div>

                    <div class="modal-disp-acciones">
                        <button type="button" id="imprimirDetalleDisp"
                                class="btn-guardar-disp">
                            Imprimir acta
                        </button>
                    </div>

                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById("cerrarDetalleDisp")
            .addEventListener("click", () => modal.remove());

        document.getElementById("imprimirDetalleDisp")
            .addEventListener("click", () => {
                const contenido = modal.querySelector(".detalle-disp").innerHTML;
                const ventana = window.open("", "_blank");

                if (!ventana) {
                    alert("Permite las ventanas emergentes para imprimir el acta.");
                    return;
                }

                ventana.document.write(`
                    <!DOCTYPE html>
                    <html lang="es">
                    <head>
                        <meta charset="UTF-8">
                        <title>${escaparHTML(acta.codigoActa)}</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 30px; color: #222; }
                            h1 { color: #2563A6; }
                            p { line-height: 1.5; }
                            hr { border: 0; border-top: 1px solid #ccc; }
                        </style>
                    </head>
                    <body>
                        <h1>ARCHIVEX - Acta de disposición final</h1>
                        <h2>${escaparHTML(acta.codigoActa)}</h2>
                        ${contenido}
                    </body>
                    </html>
                `);

                ventana.document.close();
                ventana.focus();
                ventana.print();
            });
    }

    /* =====================================================
       APROBAR ACTA
    ===================================================== */

    function aprobarActa(acta) {
        if (acta.estado !== "Pendiente de aprobación") return;

        const confirmar = confirm(
            `¿Confirmas la aprobación del acta ${acta.codigoActa}?`
        );

        if (!confirmar) return;

        acta.estado = "Aprobada";
        acta.fechaAprobacion = new Date().toISOString();
        acta.usuarioAprobacion = nombreUsuario();

        guardarActas();
        renderizarTabla();

        alert("Acta aprobada. La ejecución deberá registrarse posteriormente.");
    }

    /* =====================================================
       RECHAZAR ACTA
    ===================================================== */

    function rechazarActa(acta) {
        if (acta.estado !== "Pendiente de aprobación") return;

        const motivo = prompt("Indica el motivo por el cual no se aprueba el acta:");

        if (motivo === null) return;

        if (!motivo.trim()) {
            alert("Debes indicar el motivo de la no aprobación.");
            return;
        }

        acta.estado = "No aprobada";
        acta.motivoRechazo = motivo.trim();
        acta.fechaRechazo = new Date().toISOString();
        acta.usuarioRechazo = nombreUsuario();

        guardarActas();
        renderizarTabla();

        alert("Se registró la no aprobación del acta.");
    }

    /* =====================================================
       REGISTRAR EJECUCIÓN
    ===================================================== */

    function registrarEjecucion(acta) {
        if (acta.estado !== "Aprobada") return;

        const disposicion = String(acta.disposicion).toUpperCase();

        let instruccion = "";

        if (disposicion === "E") {
            instruccion =
                "Confirma que se realizó la eliminación documental autorizada " +
                "y que existe evidencia y acta correspondiente.";
        } else if (disposicion === "S") {
            instruccion =
                "Confirma que se realizó el proceso de selección documental " +
                "según los criterios aprobados y que se conserva la evidencia.";
        } else if (disposicion === "CT") {
            instruccion =
                "Confirma que se registró la conservación total del expediente.";
        } else {
            instruccion =
                "Confirma que se registró el medio técnico definido en la TRD.";
        }

        const referencia = prompt(
            instruccion + "\n\n" +
            "Ingresa la referencia del acta, certificado o soporte de ejecución:"
        );

        if (referencia === null) return;

        if (!referencia.trim()) {
            alert("Debes registrar la referencia del soporte de ejecución.");
            return;
        }

        const confirmar = confirm(
            "¿Confirmas que la ejecución fue realizada y cuenta con sus soportes?"
        );

        if (!confirmar) return;

        acta.estado = disposicion === "CT"
            ? "Conservación registrada"
            : "Ejecución registrada";

        acta.referenciaEjecucion = referencia.trim();
        acta.fechaEjecucion = new Date().toISOString();
        acta.usuarioEjecucion = nombreUsuario();

        guardarActas();

        /*
         * IMPORTANTE:
         * Esta operación registra la evidencia del proceso.
         * No borra expedientes, radicados ni archivos digitales.
         */

        renderizarTabla();

        alert(
            "Se registró la ejecución del proceso de disposición final. " +
            "Los documentos originales no fueron eliminados desde el sistema."
        );
    }

    /* =====================================================
       ESTILOS DEL MODAL
    ===================================================== */

    function agregarEstilos() {
        if (document.getElementById("estilosDisposicion")) return;

        const estilos = document.createElement("style");
        estilos.id = "estilosDisposicion";

        estilos.textContent = `
            .modal-disp-fondo {
                position: fixed;
                inset: 0;
                z-index: 9999;
                background: rgba(15,30,50,.60);
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
                overflow-y: auto;
            }

            .modal-disp-contenido {
                background: #fff;
                width: 100%;
                max-width: 680px;
                max-height: 90vh;
                overflow-y: auto;
                padding: 25px;
                border-radius: 14px;
                box-shadow: 0 12px 35px rgba(0,0,0,.20);
            }

            .modal-disp-cabecera {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 15px;
                margin-bottom: 22px;
            }

            .modal-disp-cabecera h2 {
                margin: 0 0 6px;
                color: #2563A6;
                font-size: 21px;
            }

            .modal-disp-cabecera p {
                margin: 0;
                color: #64748b;
                font-size: 13px;
            }

            .modal-disp-cerrar {
                background: transparent;
                border: none;
                color: #64748b;
                font-size: 28px;
                cursor: pointer;
            }

            .campo-disp {
                display: flex;
                flex-direction: column;
                gap: 7px;
                margin-bottom: 16px;
            }

            .campo-disp label {
                color: #334155;
                font-size: 13px;
                font-weight: 600;
            }

            .campo-disp input,
            .campo-disp select,
            .campo-disp textarea {
                width: 100%;
                box-sizing: border-box;
                padding: 11px 12px;
                border: 1px solid #cbd5e1;
                border-radius: 7px;
                font: inherit;
                font-size: 14px;
                background: #fff;
            }

            .campo-disp small {
                color: #64748b;
                font-size: 12px;
                line-height: 1.5;
            }

            .aviso-disp {
                background: #fff7ed;
                border-left: 4px solid #d97706;
                padding: 12px;
                color: #7c2d12;
                font-size: 13px;
                line-height: 1.5;
                border-radius: 5px;
            }

            .detalle-disp p {
                line-height: 1.5;
                color: #334155;
                overflow-wrap: anywhere;
            }

            .modal-disp-acciones {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 22px;
            }

            .btn-cancelar-disp,
            .btn-guardar-disp {
                border: none;
                padding: 11px 17px;
                border-radius: 7px;
                cursor: pointer;
                font-weight: 600;
            }

            .btn-cancelar-disp {
                background: #e2e8f0;
                color: #334155;
            }

            .btn-guardar-disp {
                background: #2563A6;
                color: #fff;
            }

            .btn-guardar-disp:hover {
                background: #1d4f85;
            }

            @media (max-width: 600px) {
                .modal-disp-contenido {
                    padding: 18px;
                }
            }
        `;

        document.head.appendChild(estilos);
    }

});
