
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // ==========================================
    // CONFIGURACIÓN
    // ==========================================

    const CLAVE_SESION = "archivex_sesion";
    const CLAVE_USUARIOS = "archivex_usuarios_acceso";
    const CLAVE_POLITICAS = "archivex_politicas_seguridad";
    const CLAVE_AUDITORIA = "archivex_auditoria";

    const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION) || "null");

    if (!sesion) {
        window.location.href = "../acceso/login.html";
        return;
    }

    const usuarios = JSON.parse(localStorage.getItem(CLAVE_USUARIOS) || "[]");

    const tabla = document.getElementById("tablaSuperadministradores");
    const buscar = document.getElementById("buscarSeguridad");
    const avatar = document.getElementById("inicialesUsuario");
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    const btnCertificado = document.getElementById("btnCertificado");
    const control2FA = document.getElementById("politica2FA");
    const controlExpiracion = document.getElementById("politicaExpiracion");

    let politicas = JSON.parse(
        localStorage.getItem(CLAVE_POLITICAS) || "null"
    );

    if (!politicas) {
        politicas = {
            dobleFactor: true,
            expiracionContrasena: true,
            diasExpiracion: 90
        };

        guardarPoliticas();
    }

    // ==========================================
    // FUNCIONES GENERALES
    // ==========================================

    function guardarPoliticas() {
        localStorage.setItem(CLAVE_POLITICAS, JSON.stringify(politicas));
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

    function obtenerNombre(usuario) {
        return `${usuario.nombres || ""} ${usuario.apellidos || ""}`.trim()
            || usuario.usuario
            || "Usuario";
    }

    function obtenerIniciales(nombre) {
        return nombre
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(p => p.charAt(0).toUpperCase())
            .join("") || "US";
    }

    function mostrarMensaje(mensaje) {
        let aviso = document.getElementById("mensajeSeguridad");

        if (!aviso) {
            aviso = document.createElement("div");
            aviso.id = "mensajeSeguridad";
            aviso.style.cssText = `
                padding:12px 16px;
                margin:15px 0;
                border-radius:8px;
                background:#e8f5e9;
                color:#246b35;
                font-size:14px;
            `;

            document.querySelector(".dashboard-content")?.prepend(aviso);
        }

        aviso.textContent = mensaje;

        setTimeout(() => aviso?.remove(), 4000);
    }

    function registrarEvento(tipo, descripcion) {
        const registros = JSON.parse(
            localStorage.getItem(CLAVE_AUDITORIA) || "[]"
        );

        registros.unshift({
            id: "SEG-" + Date.now(),
            tipo,
            descripcion,
            usuario: sesion.usuario || sesion.nombre || "Usuario",
            fecha: new Date().toISOString()
        });

        // Mantener los últimos 500 eventos.
        localStorage.setItem(
            CLAVE_AUDITORIA,
            JSON.stringify(registros.slice(0, 500))
        );
    }

    function actualizarAvatar() {
        if (!avatar) return;

        const nombre = sesion.nombre ||
            `${sesion.nombres || ""} ${sesion.apellidos || ""}`.trim() ||
            sesion.usuario ||
            "Funcionario";

        avatar.textContent = obtenerIniciales(nombre);
    }

    // ==========================================
    // POLÍTICAS DE AUTENTICACIÓN
    // ==========================================

    function cargarPoliticas() {
        if (control2FA) {
            control2FA.checked = politicas.dobleFactor;
        }

        if (controlExpiracion) {
            controlExpiracion.checked = politicas.expiracionContrasena;
        }
    }

    control2FA?.addEventListener("change", () => {
        politicas.dobleFactor = control2FA.checked;
        guardarPoliticas();

        registrarEvento(
            "POLÍTICA",
            `Autenticación de doble factor: ${control2FA.checked ? "activada" : "desactivada"}`
        );

        mostrarMensaje("Se actualizó la configuración de doble factor.");
    });

    controlExpiracion?.addEventListener("change", () => {
        politicas.expiracionContrasena = controlExpiracion.checked;
        guardarPoliticas();

        registrarEvento(
            "POLÍTICA",
            `Expiración de contraseña: ${controlExpiracion.checked ? "activada" : "desactivada"}`
        );

        mostrarMensaje("Se actualizó la política de expiración de contraseña.");
    });

    // ==========================================
    // SUPERADMINISTRADORES
    // ==========================================

    function esAdministrador(usuario) {
        const rol = String(usuario.rol || "").toLowerCase();

        return [
            "administrador",
            "superadministrador",
            "superadmin"
        ].includes(rol);
    }

    function renderizarAdministradores() {
        if (!tabla) return;

        const termino = (buscar?.value || "").toLowerCase().trim();

        const administradores = usuarios.filter(usuario => {
            const texto = [
                obtenerNombre(usuario),
                usuario.correo,
                usuario.usuario,
                usuario.rol
            ].join(" ").toLowerCase();

            return esAdministrador(usuario) &&
                texto.includes(termino);
        });

        tabla.innerHTML = "";

        if (administradores.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;padding:25px;">
                        No hay superadministradores registrados.
                        Verifica que existan usuarios con el rol Administrador.
                    </td>
                </tr>
            `;
            return;
        }

        administradores.forEach(usuario => {
            const nombre = obtenerNombre(usuario);
            const activo = usuario.estado !== "Inactivo";

            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>
                    <div class="seg-celda-info">
                        <div class="avatar-tabla">
                            ${escaparHTML(obtenerIniciales(nombre))}
                        </div>
                        <div>
                            <div class="seg-celda-titulo">
                                ${escaparHTML(nombre)}
                            </div>
                            <span class="seg-sub">
                                ${escaparHTML(usuario.rol || "Administrador")}
                            </span>
                        </div>
                    </div>
                </td>

                <td>${escaparHTML(usuario.correo || "Sin correo")}</td>

                <td>
                    <span class="badge morado">
                        ${escaparHTML(usuario.rol || "Administrador")}
                    </span>
                </td>

                <td>${escaparHTML(formatearFecha(usuario.fechaActualizacion || usuario.fechaRegistro))}</td>

                <td>
                    <span class="badge ${activo ? "verde" : "rojo"}">
                        ${activo ? "Activo" : "Inactivo"}
                    </span>
                </td>

                <td>
                    <div class="acciones-fila-grupo">
                        <button
                            type="button"
                            class="btn-accion-tabla"
                            data-accion="privilegios"
                            data-id="${escaparHTML(usuario.id)}"
                            title="Consultar privilegios">
                            <i data-lucide="shield"></i>
                        </button>
                    </div>
                </td>
            `;

            tabla.appendChild(fila);
        });

        if (window.lucide) lucide.createIcons();
    }

    function formatearFecha(fecha) {
        if (!fecha) return "Sin registro";

        const valor = new Date(fecha);

        if (Number.isNaN(valor.getTime())) return "Sin registro";

        return valor.toLocaleString("es-CO", {
            dateStyle: "short",
            timeStyle: "short"
        });
    }

    tabla?.addEventListener("click", evento => {
        const boton = evento.target.closest("button[data-accion]");
        if (!boton) return;

        const usuario = usuarios.find(u => u.id === boton.dataset.id);
        if (!usuario) return;

        mostrarPrivilegios(usuario);
    });

    // ==========================================
    // CONSULTA DE PRIVILEGIOS
    // ==========================================

    function mostrarPrivilegios(usuario) {
        const nombre = obtenerNombre(usuario);

        alert(
            "INFORMACIÓN DE AUTORIZACIÓN\n\n" +
            "Usuario: " + nombre + "\n" +
            "Correo: " + (usuario.correo || "No registrado") + "\n" +
            "Rol: " + (usuario.rol || "Sin rol") + "\n" +
            "Dependencia: " + (usuario.dependencia || "Sin asignar") + "\n" +
            "Estado: " + (usuario.estado || "Activo") + "\n\n" +
            "Los permisos efectivos deben validarse en el servidor."
        );

        registrarEvento(
            "CONSULTA DE PRIVILEGIOS",
            `Se consultaron los datos de autorización de ${nombre}.`
        );
    }

    // ==========================================
    // PANEL INFORMATIVO DE PERMISOS
    // ==========================================

    function crearPanelPermisos() {
        if (document.getElementById("panelPermisosSeguridad")) return;

        const panel = document.createElement("section");
        panel.id = "panelPermisosSeguridad";
        panel.className = "seccion-tabla";

        panel.style.marginTop = "25px";

        panel.innerHTML = `
            <div class="tabla-header">
                <h2>Referencia de Roles y Permisos</h2>
                <span class="badge azul">Configuración de referencia</span>
            </div>

            <div class="tabla-contenedor">
                <table class="tabla-datos">
                    <thead>
                        <tr>
                            <th>Rol</th>
                            <th>Consultar</th>
                            <th>Registrar</th>
                            <th>Editar</th>
                            <th>Administrar usuarios</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Administrador</td>
                            <td>Sí</td>
                            <td>Sí</td>
                            <td>Sí</td>
                            <td>Sí</td>
                        </tr>
                        <tr>
                            <td>Gestor Documental</td>
                            <td>Sí</td>
                            <td>Sí</td>
                            <td>Sí</td>
                            <td>No</td>
                        </tr>
                        <tr>
                            <td>Funcionario</td>
                            <td>Sí</td>
                            <td>Según función</td>
                            <td>Según función</td>
                            <td>No</td>
                        </tr>
                        <tr>
                            <td>Consulta</td>
                            <td>Sí</td>
                            <td>No</td>
                            <td>No</td>
                            <td>No</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <p style="padding:15px;color:#667085;font-size:13px;">
                Esta matriz es una referencia funcional del prototipo.
                No aplica restricciones reales hasta implementar la
                autorización de permisos en PHP.
            </p>
        `;

        document.querySelector(".dashboard-content")?.appendChild(panel);
    }

    // ==========================================
    // CERTIFICADOS DIGITALES
    // ==========================================

    btnCertificado?.addEventListener("click", () => {
        alert(
            "CERTIFICADOS DIGITALES\n\n" +
            "Esta sección está preparada para la futura integración " +
            "de certificados institucionales.\n\n" +
            "La carga, validación, custodia de claves privadas y firma " +
            "digital requieren un servicio seguro en el servidor.\n\n" +
            "No cargues certificados reales en este prototipo."
        );

        registrarEvento(
            "CONSULTA DE CERTIFICADOS",
            "Se consultó la sección de certificados digitales."
        );
    });

    // ==========================================
    // BUSCADOR
    // ==========================================

    buscar?.addEventListener("input", () => {
        renderizarAdministradores();
    });

    // ==========================================
    // HISTORIAL DE SEGURIDAD
    // ==========================================

    function crearPanelAuditoria() {
        if (document.getElementById("panelAuditoriaSeguridad")) return;

        const panel = document.createElement("section");
        panel.id = "panelAuditoriaSeguridad";
        panel.className = "seccion-tabla";
        panel.style.marginTop = "25px";

        panel.innerHTML = `
            <div class="tabla-header">
                <h2>Actividad de Seguridad</h2>
                <button type="button" class="btn-secundario-sm"
                    id="btnActualizarAuditoria">
                    <i data-lucide="refresh-cw"></i>
                    <span>Actualizar historial</span>
                </button>
            </div>

            <div class="tabla-contenedor">
                <table class="tabla-datos">
                    <thead>
                        <tr>
                            <th>Fecha y hora</th>
                            <th>Usuario</th>
                            <th>Tipo de evento</th>
                            <th>Descripción</th>
                        </tr>
                    </thead>
                    <tbody id="tablaAuditoriaSeguridad"></tbody>
                </table>
            </div>
        `;

        document.querySelector(".dashboard-content")?.appendChild(panel);

        document.getElementById("btnActualizarAuditoria")
            ?.addEventListener("click", renderizarAuditoria);
    }

    function renderizarAuditoria() {
        const cuerpo = document.getElementById("tablaAuditoriaSeguridad");
        if (!cuerpo) return;

        const registros = JSON.parse(
            localStorage.getItem(CLAVE_AUDITORIA) || "[]"
        );

        cuerpo.innerHTML = "";

        if (registros.length === 0) {
            cuerpo.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center;padding:20px;">
                        Todavía no hay eventos de seguridad registrados.
                    </td>
                </tr>
            `;
            return;
        }

        registros.slice(0, 50).forEach(registro => {
            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>${escaparHTML(formatearFecha(registro.fecha))}</td>
                <td>${escaparHTML(registro.usuario)}</td>
                <td>${escaparHTML(registro.tipo)}</td>
                <td>${escaparHTML(registro.descripcion)}</td>
            `;

            cuerpo.appendChild(fila);
        });
    }

    // ==========================================
    // CERRAR SESIÓN
    // ==========================================

    btnCerrarSesion?.addEventListener("click", evento => {
        evento.preventDefault();

        if (confirm("¿Deseas cerrar la sesión de ARCHIVEX?")) {
            registrarEvento("CIERRE DE SESIÓN", "El usuario cerró su sesión.");
            localStorage.removeItem(CLAVE_SESION);
            window.location.href = "../acceso/login.html";
        }
    });

    // ==========================================
    // INICIALIZAR MÓDULO
    // ==========================================

    cargarPoliticas();
    actualizarAvatar();
    renderizarAdministradores();
    crearPanelPermisos();
    crearPanelAuditoria();
    renderizarAuditoria();

    if (window.lucide) {
        lucide.createIcons();
    }

});
