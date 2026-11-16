
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // ==========================================
    // 1. CLAVES DE ALMACENAMIENTO
    // ==========================================

    const CLAVES = {
        sesion: "archivex_sesion",
        radicaciones: "archivex_radicaciones",
        digitalizaciones: "archivex_digitalizaciones",
        expedientes: "archivex_expedientes",
        prestamos: "archivex_prestamos",
        transferencias: "archivex_transferencias",
        disposiciones: "archivex_disposiciones",
        auditoria: "archivex_auditoria"
    };

    const obtenerDatos = (clave) => {
        try {
            const datos = JSON.parse(localStorage.getItem(clave));
            return Array.isArray(datos) ? datos : [];
        } catch (error) {
            console.error(`No se pudieron leer los datos: ${clave}`, error);
            return [];
        }
    };

    const obtenerSesion = () => {
        try {
            return JSON.parse(localStorage.getItem(CLAVES.sesion)) || null;
        } catch {
            return null;
        }
    };

    const sesion = obtenerSesion();

    // ==========================================
    // 2. ELEMENTOS HTML
    // ==========================================

    const elementos = {
        buscar: document.getElementById("buscarBitacora"),
        tipoReporte: document.getElementById("tipoReporte"),
        rangoFecha: document.getElementById("rangoFecha"),
        tabla: document.getElementById("tablaAuditoria"),

        totalRadicados: document.getElementById("totalRadicadosReporte"),
        totalDigitalizados: document.getElementById("totalDigitalizadosReporte"),
        totalExpedientes: document.getElementById("totalExpedientesReporte"),
        totalEventos: document.getElementById("totalEventosReporte"),

        iniciales: document.getElementById("inicialesUsuario"),
        btnPDF: document.getElementById("btnExportarPDF"),
        btnExcel: document.getElementById("btnExportarExcel"),
        btnCerrarSesion: document.getElementById("btnCerrarSesion")
    };

    // ==========================================
    // 3. FUNCIONES GENERALES
    // ==========================================

    const escaparHTML = (valor) => {
        return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[caracter]);
    };

    const obtenerFecha = (registro) => {
        const valor =
            registro.fechaHora ||
            registro.fecha ||
            registro.fechaRegistro ||
            registro.fechaRadicacion ||
            registro.fechaDigitalizacion ||
            registro.fechaSalida ||
            registro.fechaSolicitud ||
            registro.createdAt;

        if (!valor) return null;

        const fecha = new Date(valor);
        return Number.isNaN(fecha.getTime()) ? null : fecha;
    };

    const formatoFecha = (valor) => {
        if (!valor) return "Sin fecha";

        const fecha = valor instanceof Date ? valor : new Date(valor);

        if (Number.isNaN(fecha.getTime())) return "Sin fecha";

        return fecha.toLocaleString("es-CO", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const obtenerUsuario = (registro) => {
        return (
            registro.usuario ||
            registro.usuarioRegistro ||
            registro.usuarioResponsable ||
            registro.nombreUsuario ||
            registro.nombre ||
            "Usuario del sistema"
        );
    };

    const obtenerCorreo = (registro) => {
        return registro.correo || registro.email || "";
    };

    const obtenerIniciales = (nombre) => {
        if (!nombre) return "US";

        const partes = nombre.trim().split(/\s+/);

        return partes.length >= 2
            ? (partes[0][0] + partes[1][0]).toUpperCase()
            : partes[0].substring(0, 2).toUpperCase();
    };

    const obtenerPeriodo = () => {
        const opcion = elementos.rangoFecha?.value || "mes";
        const hoy = new Date();
        const inicio = new Date(hoy);

        if (opcion === "mes") {
            inicio.setMonth(inicio.getMonth() - 1);
        } else if (opcion === "trimestre") {
            inicio.setMonth(inicio.getMonth() - 3);
        } else if (opcion === "anio") {
            inicio.setMonth(0, 1);
            inicio.setHours(0, 0, 0, 0);
        }

        return { inicio, fin: hoy };
    };

    const estaEnPeriodo = (registro) => {
        const fecha = obtenerFecha(registro);

        // Los registros sin fecha no se incluyen en reportes por periodo.
        if (!fecha) return false;

        const periodo = obtenerPeriodo();

        return fecha >= periodo.inicio && fecha <= periodo.fin;
    };

    // ==========================================
    // 4. CARGAR MÉTRICAS
    // ==========================================

    const cargarMetricas = () => {
        const radicaciones = obtenerDatos(CLAVES.radicaciones);
        const digitalizaciones = obtenerDatos(CLAVES.digitalizaciones);
        const expedientes = obtenerDatos(CLAVES.expedientes);
        const auditoria = obtenerDatos(CLAVES.auditoria);

        if (elementos.totalRadicados) {
            elementos.totalRadicados.textContent =
                radicaciones.length.toLocaleString("es-CO");
        }

        if (elementos.totalDigitalizados) {
            elementos.totalDigitalizados.textContent =
                digitalizaciones.length.toLocaleString("es-CO");
        }

        if (elementos.totalExpedientes) {
            elementos.totalExpedientes.textContent =
                expedientes.length.toLocaleString("es-CO");
        }

        if (elementos.totalEventos) {
            elementos.totalEventos.textContent =
                auditoria.length.toLocaleString("es-CO");
        }
    };

    // ==========================================
    // 5. PREPARAR INFORMACIÓN DE LOS REPORTES
    // ==========================================

    const prepararAuditoria = () => {
        return obtenerDatos(CLAVES.auditoria).map(registro => ({
            fecha: obtenerFecha(registro),
            usuario: obtenerUsuario(registro),
            correo: obtenerCorreo(registro),
            accion: registro.modulo || registro.accion || "AUDITORÍA",
            ip: registro.ip || registro.direccionIP || "No registrada",
            detalle:
                registro.detalle ||
                registro.descripcion ||
                registro.accion ||
                "Evento registrado en el sistema."
        }));
    };

    const prepararRadicaciones = () => {
        return obtenerDatos(CLAVES.radicaciones).map(registro => ({
            fecha: obtenerFecha(registro),
            usuario: obtenerUsuario(registro),
            correo: registro.correoUsuario || "",
            accion: "RADICACIÓN",
            ip: "No registrada",
            detalle:
                `Radicado ${registro.numeroRadicado || "sin número"} - ` +
                `${registro.asunto || registro.descripcion || "Sin asunto"}`
        }));
    };

    const prepararPrestamos = () => {
        return obtenerDatos(CLAVES.prestamos).map(registro => ({
            fecha: obtenerFecha(registro),
            usuario: obtenerUsuario(registro),
            correo: "",
            accion: "PRÉSTAMOS",
            ip: "No registrada",
            detalle:
                `Préstamo ${registro.codigoPrestamo || ""} - ` +
                `Expediente ${registro.codigoExpediente || "sin código"} - ` +
                `Estado: ${registro.estado || "Sin estado"}`
        }));
    };

    const obtenerRegistros = () => {
        const tipo = elementos.tipoReporte?.value || "auditoria";

        if (tipo === "radicacion") return prepararRadicaciones();
        if (tipo === "prestamos") return prepararPrestamos();

        return prepararAuditoria();
    };

    // ==========================================
    // 6. MOSTRAR REGISTROS EN LA TABLA
    // ==========================================

    const renderizarTabla = () => {
        if (!elementos.tabla) return;

        const busqueda = (elementos.buscar?.value || "").trim().toLowerCase();

        let registros = obtenerRegistros();

        registros = registros.filter(registro => {
            const fecha = registro.fecha;

            return fecha && estaEnPeriodo({ fecha });
        });

        registros = registros.filter(registro => {
            const contenido = [
                registro.usuario,
                registro.correo,
                registro.accion,
                registro.ip,
                registro.detalle,
                formatoFecha(registro.fecha)
            ].join(" ").toLowerCase();

            return contenido.includes(busqueda);
        });

        registros.sort((a, b) => {
            return (b.fecha?.getTime() || 0) - (a.fecha?.getTime() || 0);
        });

        if (registros.length === 0) {
            elementos.tabla.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding:25px;">
                        No se encontraron registros para los filtros seleccionados.
                    </td>
                </tr>
            `;
            return;
        }

        elementos.tabla.innerHTML = registros.map(registro => `
            <tr>
                <td>${escaparHTML(formatoFecha(registro.fecha))}</td>

                <td>
                    <div class="rep-celda-titulo">
                        ${escaparHTML(registro.usuario)}
                    </div>
                    <span class="rep-sub">
                        ${escaparHTML(registro.correo)}
                    </span>
                </td>

                <td>
                    <span class="badge azul">
                        ${escaparHTML(registro.accion)}
                    </span>
                </td>

                <td>${escaparHTML(registro.ip)}</td>

                <td>${escaparHTML(registro.detalle)}</td>
            </tr>
        `).join("");

        if (window.lucide) {
            window.lucide.createIcons();
        }
    };

    // ==========================================
    // 7. EXPORTAR REPORTE CSV PARA EXCEL
    // ==========================================

    const exportarExcel = () => {
        const filas = obtenerRegistros()
            .filter(registro => {
                return registro.fecha && estaEnPeriodo({ fecha: registro.fecha });
            })
            .filter(registro => {
                const busqueda = (elementos.buscar?.value || "").trim().toLowerCase();

                const contenido = [
                    registro.usuario,
                    registro.correo,
                    registro.accion,
                    registro.ip,
                    registro.detalle,
                    formatoFecha(registro.fecha)
                ].join(" ").toLowerCase();

                return contenido.includes(busqueda);
            });

        if (filas.length === 0) {
            alert("No hay registros para exportar.");
            return;
        }

        const encabezados = [
            "Fecha y hora",
            "Usuario",
            "Correo",
            "Acción / Módulo",
            "Dirección IP",
            "Detalle del evento"
        ];

        const datos = filas.map(registro => [
            formatoFecha(registro.fecha),
            registro.usuario,
            registro.correo,
            registro.accion,
            registro.ip,
            registro.detalle
        ]);

        const protegerCSV = valor => {
            let texto = String(valor ?? "").replace(/"/g, '""');

            // Evita que Excel interprete contenido como fórmulas.
            if (/^[=+\-@\t\r]/.test(texto)) {
                texto = "'" + texto;
            }

            return `"${texto}"`;
        };

        const contenido = [encabezados, ...datos]
            .map(fila => fila.map(protegerCSV).join(";"))
            .join("\r\n");

        const archivo = new Blob(
            ["\uFEFF" + contenido],
            { type: "text/csv;charset=utf-8;" }
        );

        const url = URL.createObjectURL(archivo);
        const enlace = document.createElement("a");

        enlace.href = url;
        enlace.download = `ARCHIVEX_Reporte_${new Date().toISOString().slice(0, 10)}.csv`;

        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();

        URL.revokeObjectURL(url);
    };

    // ==========================================
    // 8. IMPRIMIR O GUARDAR COMO PDF
    // ==========================================

    const exportarPDF = () => {
        const registros = obtenerRegistros().filter(registro => {
            return registro.fecha && estaEnPeriodo({ fecha: registro.fecha });
        });

        if (registros.length === 0) {
            alert("No hay registros para imprimir en el periodo seleccionado.");
            return;
        }

        window.print();
    };

    // ==========================================
    // 9. SESIÓN Y PERFIL
    // ==========================================

    const cargarPerfil = () => {
        if (!sesion) {
            window.location.href = "../acceso/login.html";
            return;
        }

        const nombre = sesion.nombre ||
            [sesion.nombres, sesion.apellidos].filter(Boolean).join(" ") ||
            sesion.usuario ||
            "Usuario";

        if (elementos.iniciales) {
            elementos.iniciales.textContent = obtenerIniciales(nombre);
            elementos.iniciales.title = nombre;
        }
    };

    const cerrarSesion = () => {
        const confirmar = confirm("¿Deseas cerrar tu sesión de ARCHIVEX?");

        if (!confirmar) return;

        localStorage.removeItem(CLAVES.sesion);
        window.location.href = "../acceso/login.html";
    };

    // ==========================================
    // 10. EVENTOS
    // ==========================================

    elementos.buscar?.addEventListener("input", renderizarTabla);

    elementos.tipoReporte?.addEventListener("change", renderizarTabla);

    elementos.rangoFecha?.addEventListener("change", renderizarTabla);

    elementos.btnExcel?.addEventListener("click", exportarExcel);

    elementos.btnPDF?.addEventListener("click", exportarPDF);

    elementos.btnCerrarSesion?.addEventListener("click", event => {
        event.preventDefault();
        cerrarSesion();
    });

    // ==========================================
    // 11. INICIALIZAR MÓDULO
    // ==========================================

    cargarPerfil();
    cargarMetricas();
    renderizarTabla();

    if (window.lucide) {
        window.lucide.createIcons();
    }

});
