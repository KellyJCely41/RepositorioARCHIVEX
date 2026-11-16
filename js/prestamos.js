
/* =========================================================
   ARCHIVEX - MÓDULO DE PRÉSTAMOS Y CONSULTAS
   Archivo: prestamos.js
   Almacenamiento temporal: localStorage
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const CLAVE_PRESTAMOS = "archivex_prestamos";
    const CLAVE_EXPEDIENTES = "archivex_expedientes";
    const CLAVE_SESION = "archivex_sesion";

    const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION));

    // Validar sesión
    if (!sesion) {
        window.location.href = "../acceso/login.html";
        return;
    }

    // Elementos HTML
    const tablaPrestamos = document.getElementById("tablaPrestamos");
    const totalPrestamos = document.getElementById("totalPrestamos");
    const btnNuevoPrestamo = document.getElementById("btnNuevoPrestamo");
    const buscarPrestamo = document.getElementById("buscarPrestamo");
    const buscarPrestamoGlobal = document.getElementById("buscarPrestamoGlobal");
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    const inicialesUsuario = document.getElementById("inicialesUsuario");

    // Obtener información
    let prestamos = obtenerDatos(CLAVE_PRESTAMOS);
    let expedientes = obtenerDatos(CLAVE_EXPEDIENTES);

    // Mostrar iniciales
    mostrarUsuario();

    // Actualizar estado de préstamos vencidos
    actualizarVencimientos();

    // Mostrar tabla
    renderizarPrestamos();

    // Eventos
    if (btnNuevoPrestamo) {
        btnNuevoPrestamo.addEventListener("click", abrirFormularioPrestamo);
    }

    if (buscarPrestamo) {
        buscarPrestamo.addEventListener("input", renderizarPrestamos);
    }

    if (buscarPrestamoGlobal) {
        buscarPrestamoGlobal.addEventListener("input", () => {
            if (buscarPrestamo) {
                buscarPrestamo.value = buscarPrestamoGlobal.value;
            }
            renderizarPrestamos();
        });
    }

    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener("click", cerrarSesion);
    }

    // Delegación de eventos para las acciones de la tabla
    if (tablaPrestamos) {
        tablaPrestamos.addEventListener("click", manejarAccionesTabla);
    }

    /* =====================================================
       FUNCIONES GENERALES
    ===================================================== */

    function obtenerDatos(clave) {
        try {
            const datos = JSON.parse(localStorage.getItem(clave));
            return Array.isArray(datos) ? datos : [];
        } catch (error) {
            return [];
        }
    }

    function guardarPrestamos() {
        localStorage.setItem(CLAVE_PRESTAMOS, JSON.stringify(prestamos));
    }

    function fechaLocal(fecha = new Date()) {
        const anio = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, "0");
        const dia = String(fecha.getDate()).padStart(2, "0");

        return `${anio}-${mes}-${dia}`;
    }

    function formatearFecha(fecha) {
        if (!fecha) return "No registrada";

        const partes = fecha.substring(0, 10).split("-");

        if (partes.length !== 3) return fecha;

        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function generarCodigoPrestamo() {
        const anio = new Date().getFullYear();
        const prefijo = `PRST-${anio}-`;

        const consecutivos = prestamos
            .filter(p => p.codigoPrestamo?.startsWith(prefijo))
            .map(p => parseInt(p.codigoPrestamo.replace(prefijo, ""), 10))
            .filter(numero => Number.isFinite(numero));

        const siguiente = consecutivos.length
            ? Math.max(...consecutivos) + 1
            : 1;

        return prefijo + String(siguiente).padStart(3, "0");
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

    function obtenerNombreUsuario() {
        return sesion.nombre ||
            sesion.usuario ||
            sesion.correo ||
            "Funcionario";
    }

    function mostrarUsuario() {
        if (!inicialesUsuario) return;

        const nombre = obtenerNombreUsuario();

        const iniciales = nombre
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(palabra => palabra.charAt(0).toUpperCase())
            .join("");

        inicialesUsuario.textContent = iniciales || "US";
    }

    function cerrarSesion() {
        if (!confirm("¿Deseas cerrar la sesión de ARCHIVEX?")) return;

        localStorage.removeItem(CLAVE_SESION);
        window.location.href = "../acceso/login.html";
    }

    /* =====================================================
       CONTROL DE VENCIMIENTOS
    ===================================================== */

    function actualizarVencimientos() {
        const hoy = fechaLocal();
        let huboCambios = false;

        prestamos.forEach(prestamo => {
            if (
                prestamo.estado === "Prestado" &&
                prestamo.fechaMaximaRetorno < hoy
            ) {
                prestamo.estado = "Vencido";
                huboCambios = true;
            }
        });

        if (huboCambios) {
            guardarPrestamos();
        }
    }

    function obtenerEstado(prestamo) {
        if (prestamo.estado === "Devuelto") {
            return "Devuelto";
        }

        if (prestamo.fechaMaximaRetorno < fechaLocal()) {
            return "Vencido";
        }

        return prestamo.estado || "Prestado";
    }

    function obtenerClaseEstado(estado) {
        switch (estado) {
            case "Devuelto":
                return "gris";

            case "Vencido":
                return "rojo";

            default:
                return "verde";
        }
    }

    /* =====================================================
       RENDERIZAR TABLA
    ===================================================== */

    function renderizarPrestamos() {
        if (!tablaPrestamos) return;

        actualizarVencimientos();

        const filtro = (buscarPrestamo?.value || "").toLowerCase().trim();

        const filtrados = prestamos.filter(prestamo => {
            const expediente = expedientes.find(
                e => e.id === prestamo.expedienteId
            );

            const texto = [
                prestamo.codigoPrestamo,
                prestamo.solicitante,
                prestamo.dependencia,
                prestamo.codigoExpediente,
                expediente?.nombre,
                prestamo.estado
            ].join(" ").toLowerCase();

            return texto.includes(filtro);
        });

        const activos = prestamos.filter(prestamo => {
            return obtenerEstado(prestamo) !== "Devuelto";
        }).length;

        if (totalPrestamos) {
            totalPrestamos.textContent = `${activos} Préstamos Activos`;
        }

        if (filtrados.length === 0) {
            tablaPrestamos.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:25px;">
                        No se encontraron préstamos registrados.
                    </td>
                </tr>
            `;
            return;
        }

        tablaPrestamos.innerHTML = filtrados.map(prestamo => {
            const estado = obtenerEstado(prestamo);
            const clase = obtenerClaseEstado(estado);

            return `
                <tr>
                    <td>
                        <strong>${escaparHTML(prestamo.codigoPrestamo)}</strong>
                        <br>
                        <span class="prest-sub">
                            ${escaparHTML(prestamo.codigoExpediente)}
                        </span>
                    </td>

                    <td>
                        <div class="prest-celda-titulo">
                            ${escaparHTML(prestamo.solicitante)}
                        </div>
                        <span class="prest-sub">
                            ${escaparHTML(prestamo.dependencia)}
                        </span>
                    </td>

                    <td>${formatearFecha(prestamo.fechaSalida)}</td>

                    <td>${formatearFecha(prestamo.fechaMaximaRetorno)}</td>

                    <td>
                        <span class="badge ${clase}">
                            ${escaparHTML(estado)}
                        </span>
                    </td>

                    <td>
                        <div class="acciones-fila-grupo">
                            ${
                                estado !== "Devuelto"
                                ? `
                                    <button
                                        type="button"
                                        class="btn-accion-tabla"
                                        data-accion="devolver"
                                        data-id="${escaparHTML(prestamo.id)}"
                                        title="Registrar devolución">
                                        <i data-lucide="rotate-ccw"></i>
                                    </button>

                                    <button
                                        type="button"
                                        class="btn-accion-tabla"
                                        data-accion="ampliar"
                                        data-id="${escaparHTML(prestamo.id)}"
                                        title="Ampliar plazo">
                                        <i data-lucide="calendar-plus"></i>
                                    </button>

                                    <button
                                        type="button"
                                        class="btn-accion-tabla"
                                        data-accion="recordatorio"
                                        data-id="${escaparHTML(prestamo.id)}"
                                        title="Consultar recordatorio">
                                        <i data-lucide="bell-ring"></i>
                                    </button>
                                `
                                : `
                                    <span class="prest-sub">
                                        Préstamo finalizado
                                    </span>
                                `
                            }
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    /* =====================================================
       FORMULARIO NUEVO PRÉSTAMO
    ===================================================== */

    function abrirFormularioPrestamo() {

        expedientes = obtenerDatos(CLAVE_EXPEDIENTES);

        const disponibles = expedientes.filter(expediente => {
            const estado = String(expediente.estado || "").toLowerCase();

            return estado !== "eliminado" &&
                   estado !== "transferido" &&
                   estado !== "cerrado";
        });

        if (disponibles.length === 0) {
            alert(
                "No hay expedientes disponibles para préstamo. " +
                "Primero debes registrar un expediente en ARCHIVEX."
            );
            return;
        }

        const opcionesExpedientes = disponibles.map(expediente => `
            <option value="${escaparHTML(expediente.id)}">
                ${escaparHTML(expediente.codigo)} -
                ${escaparHTML(expediente.nombre)}
            </option>
        `).join("");

        const modal = document.createElement("div");
        modal.id = "modalPrestamoArchivex";

        modal.innerHTML = `
            <div class="modal-prestamo-fondo">
                <div class="modal-prestamo-contenido">

                    <div class="modal-prestamo-cabecera">
                        <div>
                            <h2>Registrar nuevo préstamo</h2>
                            <p>Completa los datos de la solicitud documental.</p>
                        </div>

                        <button type="button" id="cerrarModalPrestamo"
                                class="modal-prestamo-cerrar">
                            &times;
                        </button>
                    </div>

                    <form id="formNuevoPrestamo">

                        <div class="campo-prestamo">
                            <label>Código del préstamo</label>
                            <input type="text"
                                   value="${generarCodigoPrestamo()}"
                                   readonly>
                        </div>

                        <div class="campo-prestamo">
                            <label for="expedientePrestamo">
                                Expediente solicitado *
                            </label>

                            <select id="expedientePrestamo" required>
                                <option value="">Seleccionar expediente</option>
                                ${opcionesExpedientes}
                            </select>
                        </div>

                        <div class="campo-prestamo">
                            <label for="solicitantePrestamo">
                                Nombre del solicitante *
                            </label>

                            <input type="text"
                                   id="solicitantePrestamo"
                                   maxlength="120"
                                   placeholder="Nombre completo"
                                   required>
                        </div>

                        <div class="campo-prestamo">
                            <label for="dependenciaPrestamo">
                                Dependencia solicitante *
                            </label>

                            <input type="text"
                                   id="dependenciaPrestamo"
                                   maxlength="120"
                                   placeholder="Ej. Oficina Jurídica"
                                   required>
                        </div>

                        <div class="campos-prestamo-dos">
                            <div class="campo-prestamo">
                                <label for="fechaSalidaPrestamo">
                                    Fecha de salida *
                                </label>

                                <input type="date"
                                       id="fechaSalidaPrestamo"
                                       value="${fechaLocal()}"
                                       required>
                            </div>

                            <div class="campo-prestamo">
                                <label for="fechaRetornoPrestamo">
                                    Fecha máxima de retorno *
                                </label>

                                <input type="date"
                                       id="fechaRetornoPrestamo"
                                       value="${fechaLocal(new Date(Date.now() + 14 * 86400000))}"
                                       required>
                            </div>
                        </div>

                        <div class="campo-prestamo">
                            <label for="observacionesPrestamo">
                                Observaciones
                            </label>

                            <textarea id="observacionesPrestamo"
                                      rows="3"
                                      placeholder="Motivo o detalles del préstamo"></textarea>
                        </div>

                        <div class="modal-prestamo-acciones">
                            <button type="button"
                                    id="cancelarPrestamo"
                                    class="btn-cancelar-prestamo">
                                Cancelar
                            </button>

                            <button type="submit"
                                    class="btn-guardar-prestamo">
                                Registrar préstamo
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        `;

        agregarEstilosModal();

        document.body.appendChild(modal);

        document.getElementById("cerrarModalPrestamo")
            .addEventListener("click", cerrarModal);

        document.getElementById("cancelarPrestamo")
            .addEventListener("click", cerrarModal);

        document.getElementById("formNuevoPrestamo")
            .addEventListener("submit", registrarPrestamo);

        const fechaSalida = document.getElementById("fechaSalidaPrestamo");
        const fechaRetorno = document.getElementById("fechaRetornoPrestamo");

        fechaSalida.addEventListener("change", () => {
            fechaRetorno.min = fechaSalida.value;

            if (fechaRetorno.value < fechaSalida.value) {
                fechaRetorno.value = fechaSalida.value;
            }
        });

        fechaRetorno.min = fechaSalida.value;
    }

    function cerrarModal() {
        const modal = document.getElementById("modalPrestamoArchivex");

        if (modal) {
            modal.remove();
        }
    }

    /* =====================================================
       REGISTRAR PRÉSTAMO
    ===================================================== */

    function registrarPrestamo(evento) {
        evento.preventDefault();

        const expedienteId = document.getElementById("expedientePrestamo").value;
        const solicitante = document.getElementById("solicitantePrestamo").value.trim();
        const dependencia = document.getElementById("dependenciaPrestamo").value.trim();
        const fechaSalida = document.getElementById("fechaSalidaPrestamo").value;
        const fechaRetorno = document.getElementById("fechaRetornoPrestamo").value;
        const observaciones = document.getElementById("observacionesPrestamo").value.trim();

        const expediente = expedientes.find(e => e.id === expedienteId);

        if (!expediente) {
            alert("Selecciona un expediente válido.");
            return;
        }

        if (!solicitante || !dependencia) {
            alert("Completa el nombre del solicitante y la dependencia.");
            return;
        }

        if (fechaRetorno < fechaSalida) {
            alert("La fecha máxima de retorno no puede ser anterior a la fecha de salida.");
            return;
        }

        const nuevoPrestamo = {
            id: `PREST-${Date.now()}`,
            codigoPrestamo: generarCodigoPrestamo(),

            expedienteId: expediente.id,
            codigoExpediente: expediente.codigo,
            nombreExpediente: expediente.nombre,

            solicitante,
            dependencia,

            fechaSalida,
            fechaMaximaRetorno: fechaRetorno,
            fechaDevolucion: null,

            observaciones,
            estado: fechaRetorno < fechaLocal() ? "Vencido" : "Prestado",

            fechaRegistro: new Date().toISOString(),
            usuarioRegistro: obtenerNombreUsuario(),
            usuarioId: sesion.id || sesion.usuario || null
        };

        prestamos.push(nuevoPrestamo);

        guardarPrestamos();

        cerrarModal();
        renderizarPrestamos();

        alert(
            `Préstamo ${nuevoPrestamo.codigoPrestamo} registrado correctamente.`
        );
    }

    /* =====================================================
       ACCIONES DE LA TABLA
    ===================================================== */

    function manejarAccionesTabla(evento) {
        const boton = evento.target.closest("button[data-accion]");

        if (!boton) return;

        const id = boton.dataset.id;
        const accion = boton.dataset.accion;

        const prestamo = prestamos.find(p => p.id === id);

        if (!prestamo) return;

        if (accion === "devolver") {
            registrarDevolucion(prestamo);
        }

        if (accion === "ampliar") {
            ampliarPlazo(prestamo);
        }

        if (accion === "recordatorio") {
            mostrarRecordatorio(prestamo);
        }
    }

    /* =====================================================
       REGISTRAR DEVOLUCIÓN
    ===================================================== */

    function registrarDevolucion(prestamo) {

        if (obtenerEstado(prestamo) === "Devuelto") {
            alert("Este préstamo ya fue devuelto.");
            return;
        }

        const confirmar = confirm(
            `¿Confirmas la devolución del expediente ${prestamo.codigoExpediente}?`
        );

        if (!confirmar) return;

        prestamo.estado = "Devuelto";
        prestamo.fechaDevolucion = fechaLocal();
        prestamo.usuarioDevolucion = obtenerNombreUsuario();

        guardarPrestamos();
        renderizarPrestamos();

        alert(
            `Devolución registrada correctamente.\n` +
            `Fecha: ${formatearFecha(prestamo.fechaDevolucion)}`
        );
    }

    /* =====================================================
       AMPLIAR PLAZO
    ===================================================== */

    function ampliarPlazo(prestamo) {

        if (obtenerEstado(prestamo) === "Devuelto") {
            alert("No puedes ampliar un préstamo que ya fue devuelto.");
            return;
        }

        const nuevaFecha = prompt(
            "Ingresa la nueva fecha máxima de retorno (AAAA-MM-DD):",
            prestamo.fechaMaximaRetorno
        );

        if (nuevaFecha === null) return;

        const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(nuevaFecha);

        if (!fechaValida) {
            alert("La fecha debe tener el formato AAAA-MM-DD.");
            return;
        }

        const fecha = new Date(`${nuevaFecha}T00:00:00`);

        if (
            Number.isNaN(fecha.getTime()) ||
            fechaLocal(fecha) !== nuevaFecha
        ) {
            alert("La fecha ingresada no es válida.");
            return;
        }

        if (nuevaFecha <= prestamo.fechaMaximaRetorno) {
            alert("La nueva fecha debe ser posterior a la fecha actual de retorno.");
            return;
        }

        prestamo.fechaMaximaRetorno = nuevaFecha;
        prestamo.estado = nuevaFecha < fechaLocal() ? "Vencido" : "Prestado";
        prestamo.fechaUltimaAmpliacion = new Date().toISOString();
        prestamo.usuarioUltimaAmpliacion = obtenerNombreUsuario();

        guardarPrestamos();
        renderizarPrestamos();

        alert("El plazo del préstamo fue ampliado correctamente.");
    }

    /* =====================================================
       RECORDATORIO
    ===================================================== */

    function mostrarRecordatorio(prestamo) {
        const estado = obtenerEstado(prestamo);

        let mensaje = "";

        if (estado === "Vencido") {
            mensaje = "Este préstamo se encuentra vencido. Debes gestionar la devolución.";
        } else {
            mensaje = `La fecha máxima de retorno es ${formatearFecha(prestamo.fechaMaximaRetorno)}.`;
        }

        alert(
            `Recordatorio del préstamo ${prestamo.codigoPrestamo}\n\n` +
            `Solicitante: ${prestamo.solicitante}\n` +
            `Expediente: ${prestamo.codigoExpediente}\n` +
            `${mensaje}\n\n` +
            `Este recordatorio es informativo; no se ha enviado ningún correo.`
        );
    }

    /* =====================================================
       ESTILOS DEL FORMULARIO
    ===================================================== */

    function agregarEstilosModal() {
        if (document.getElementById("estilosModalPrestamo")) return;

        const estilos = document.createElement("style");
        estilos.id = "estilosModalPrestamo";

        estilos.textContent = `
            .modal-prestamo-fondo {
                position: fixed;
                inset: 0;
                background: rgba(15, 30, 50, 0.60);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                z-index: 9999;
                overflow-y: auto;
            }

            .modal-prestamo-contenido {
                background: #ffffff;
                width: 100%;
                max-width: 650px;
                max-height: 90vh;
                overflow-y: auto;
                border-radius: 14px;
                padding: 25px;
                box-shadow: 0 12px 35px rgba(0,0,0,0.20);
            }

            .modal-prestamo-cabecera {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 15px;
                margin-bottom: 22px;
            }

            .modal-prestamo-cabecera h2 {
                margin: 0 0 6px;
                color: #2563A6;
                font-size: 21px;
            }

            .modal-prestamo-cabecera p {
                margin: 0;
                color: #64748b;
                font-size: 13px;
            }

            .modal-prestamo-cerrar {
                border: none;
                background: transparent;
                font-size: 28px;
                cursor: pointer;
                color: #64748b;
            }

            .campo-prestamo {
                display: flex;
                flex-direction: column;
                gap: 7px;
                margin-bottom: 16px;
            }

            .campo-prestamo label {
                font-size: 13px;
                font-weight: 600;
                color: #334155;
            }

            .campo-prestamo input,
            .campo-prestamo select,
            .campo-prestamo textarea {
                width: 100%;
                box-sizing: border-box;
                padding: 11px 12px;
                border: 1px solid #cbd5e1;
                border-radius: 7px;
                font: inherit;
                font-size: 14px;
                color: #334155;
                background: #ffffff;
            }

            .campo-prestamo input:focus,
            .campo-prestamo select:focus,
            .campo-prestamo textarea:focus {
                outline: none;
                border-color: #2563A6;
                box-shadow: 0 0 0 3px rgba(37,99,166,0.10);
            }

            .campos-prestamo-dos {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }

            .modal-prestamo-acciones {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 22px;
            }

            .btn-cancelar-prestamo,
            .btn-guardar-prestamo {
                border: none;
                padding: 11px 17px;
                border-radius: 7px;
                cursor: pointer;
                font-weight: 600;
            }

            .btn-cancelar-prestamo {
                background: #e2e8f0;
                color: #334155;
            }

            .btn-guardar-prestamo {
                background: #2563A6;
                color: #ffffff;
            }

            .btn-guardar-prestamo:hover {
                background: #1d4f85;
            }

            @media (max-width: 600px) {
                .campos-prestamo-dos {
                    grid-template-columns: 1fr;
                    gap: 0;
                }

                .modal-prestamo-contenido {
                    padding: 18px;
                }
            }
        `;

        document.head.appendChild(estilos);
    }

});
