
document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // ==========================================
    // CONFIGURACIÓN Y ALMACENAMIENTO
    // ==========================================

    const CLAVE_USUARIOS = "archivex_usuarios_acceso";
    const CLAVE_SESION = "archivex_sesion";

    const sesion = JSON.parse(localStorage.getItem(CLAVE_SESION) || "null");

    if (!sesion) {
        window.location.href = "../acceso/login.html";
        return;
    }

    let usuarios = JSON.parse(localStorage.getItem(CLAVE_USUARIOS) || "[]");
    let usuarioEditando = null;

    const tabla = document.getElementById("tablaUsuarios");
    const contador = document.getElementById("totalUsuarios");
    const buscarUsuario = document.getElementById("buscarUsuario");
    const buscarGlobal = document.getElementById("buscarUsuarioGlobal");
    const btnNuevo = document.getElementById("btnNuevoUsuario");
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    const inicialesUsuario = document.getElementById("inicialesUsuario");

    // ==========================================
    // FUNCIONES GENERALES
    // ==========================================

    function guardarUsuarios() {
        localStorage.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
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
            || "Usuario sin nombre";
    }

    function obtenerRol(usuario) {
        const roles = {
            administrador: "Administrador",
            funcionario: "Funcionario",
            gestor: "Gestor Documental",
            gestor_documental: "Gestor Documental",
            consulta: "Consulta",
            ventanilla: "Ventanilla Única",
            juridico: "Administrador Jurídico"
        };

        const rol = String(usuario.rol || "Funcionario").toLowerCase();
        return roles[rol] || usuario.rol || "Funcionario";
    }

    function obtenerIniciales(nombre) {
        return nombre
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(palabra => palabra.charAt(0).toUpperCase())
            .join("") || "US";
    }

    function mostrarMensaje(mensaje) {
        let aviso = document.getElementById("mensajeUsuarios");

        if (!aviso) {
            aviso = document.createElement("div");
            aviso.id = "mensajeUsuarios";
            aviso.style.cssText = `
                padding: 12px 16px;
                margin: 15px 0;
                border-radius: 8px;
                background: #e8f5e9;
                color: #246b35;
                font-size: 14px;
            `;

            document.querySelector(".dashboard-content")
                ?.prepend(aviso);
        }

        aviso.textContent = mensaje;

        setTimeout(() => {
            aviso?.remove();
        }, 4000);
    }

    function actualizarAvatar() {
        if (!inicialesUsuario) return;

        const nombre = sesion.nombre ||
            `${sesion.nombres || ""} ${sesion.apellidos || ""}`.trim() ||
            sesion.usuario ||
            "Funcionario";

        inicialesUsuario.textContent = obtenerIniciales(nombre);
    }

    // ==========================================
    // TABLA DE USUARIOS
    // ==========================================

    function renderizarUsuarios() {
        if (!tabla) return;

        const termino = (
            buscarUsuario?.value ||
            buscarGlobal?.value ||
            ""
        ).toLowerCase().trim();

        const filtrados = usuarios.filter(usuario => {
            const texto = [
                obtenerNombre(usuario),
                usuario.documento,
                usuario.correo,
                usuario.usuario,
                obtenerRol(usuario),
                usuario.dependencia
            ].join(" ").toLowerCase();

            return texto.includes(termino);
        });

        tabla.innerHTML = "";

        if (filtrados.length === 0) {
            tabla.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center;padding:25px;">
                        No se encontraron usuarios registrados.
                    </td>
                </tr>
            `;
        } else {
            filtrados.forEach(usuario => {
                const nombre = obtenerNombre(usuario);
                const activo = usuario.estado !== "Inactivo";
                const iniciales = obtenerIniciales(nombre);

                const fila = document.createElement("tr");

                fila.innerHTML = `
                    <td>
                        <div class="usu-celda-info">
                            <div class="avatar-tabla">
                                ${escaparHTML(iniciales)}
                            </div>
                            <div>
                                <div class="usu-celda-titulo">
                                    ${escaparHTML(nombre)}
                                </div>
                                <span class="usu-sub">
                                    ${escaparHTML(usuario.tipoDocumento || "Documento")}
                                    ${escaparHTML(usuario.documento || "No registrado")}
                                </span>
                            </div>
                        </div>
                    </td>

                    <td>${escaparHTML(usuario.correo || "Sin correo")}</td>

                    <td>
                        <span class="badge azul">
                            ${escaparHTML(obtenerRol(usuario))}
                        </span>
                    </td>

                    <td>${escaparHTML(usuario.dependencia || "Sin asignar")}</td>

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
                                data-accion="editar"
                                data-id="${escaparHTML(usuario.id)}"
                                title="Editar usuario">
                                <i data-lucide="edit-3"></i>
                            </button>

                            <button
                                type="button"
                                class="btn-accion-tabla"
                                data-accion="estado"
                                data-id="${escaparHTML(usuario.id)}"
                                title="${activo ? "Bloquear acceso" : "Activar acceso"}">
                                <i data-lucide="${activo ? "user-x" : "user-check"}"></i>
                            </button>
                        </div>
                    </td>
                `;

                tabla.appendChild(fila);
            });
        }

        const activos = usuarios.filter(u => u.estado !== "Inactivo").length;

        if (contador) {
            contador.textContent = `${activos} Usuarios Activos`;
        }

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    // ==========================================
    // MODAL DE REGISTRO Y EDICIÓN
    // ==========================================

    function crearModal() {
        if (document.getElementById("modalUsuario")) return;

        const modal = document.createElement("div");
        modal.id = "modalUsuario";

        modal.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(15, 35, 55, 0.60);
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            z-index: 9999;
            overflow-y: auto;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                width: 100%;
                max-width: 680px;
                border-radius: 12px;
                padding: 25px;
                margin: auto;
                box-shadow: 0 10px 35px rgba(0,0,0,.20);
            ">
                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    margin-bottom:20px;
                ">
                    <h2 id="tituloModalUsuario" style="margin:0;">
                        Registrar usuario
                    </h2>

                    <button type="button" id="cerrarModalUsuario"
                        style="border:0;background:none;font-size:25px;cursor:pointer;">
                        &times;
                    </button>
                </div>

                <form id="formUsuario">
                    <div style="
                        display:grid;
                        grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
                        gap:15px;
                    ">
                        <label>
                            Nombres *
                            <input type="text" id="nuevoNombres" required
                                maxlength="80" style="width:100%;padding:10px;margin-top:5px;">
                        </label>

                        <label>
                            Apellidos *
                            <input type="text" id="nuevoApellidos" required
                                maxlength="80" style="width:100%;padding:10px;margin-top:5px;">
                        </label>

                        <label>
                            Tipo de documento
                            <select id="nuevoTipoDocumento"
                                style="width:100%;padding:10px;margin-top:5px;">
                                <option value="C.C.">Cédula de ciudadanía</option>
                                <option value="C.E.">Cédula de extranjería</option>
                                <option value="Pasaporte">Pasaporte</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </label>

                        <label>
                            Número de documento *
                            <input type="text" id="nuevoDocumento" required
                                maxlength="30" style="width:100%;padding:10px;margin-top:5px;">
                        </label>

                        <label>
                            Correo electrónico *
                            <input type="email" id="nuevoCorreo" required
                                maxlength="120" style="width:100%;padding:10px;margin-top:5px;">
                        </label>

                        <label>
                            Nombre de usuario *
                            <input type="text" id="nuevoUsuario" required
                                maxlength="40" style="width:100%;padding:10px;margin-top:5px;">
                        </label>

                        <label>
                            Rol de acceso *
                            <select id="nuevoRol" required
                                style="width:100%;padding:10px;margin-top:5px;">
                                <option value="administrador">Administrador</option>
                                <option value="funcionario" selected>Funcionario</option>
                                <option value="gestor_documental">Gestor Documental</option>
                                <option value="ventanilla">Ventanilla Única</option>
                                <option value="consulta">Consulta</option>
                            </select>
                        </label>

                        <label>
                            Dependencia
                            <input type="text" id="nuevoDependencia"
                                maxlength="100" placeholder="Ej. Archivo General"
                                style="width:100%;padding:10px;margin-top:5px;">
                        </label>

                        <label id="contenedorContrasena">
                            Contraseña *
                            <input type="password" id="nuevoContrasena"
                                minlength="6" style="width:100%;padding:10px;margin-top:5px;">
                        </label>

                        <label id="contenedorConfirmar">
                            Confirmar contraseña *
                            <input type="password" id="confirmarContrasena"
                                minlength="6" style="width:100%;padding:10px;margin-top:5px;">
                        </label>
                    </div>

                    <p style="font-size:12px;color:#666;margin-top:15px;">
                        Los campos marcados con * son obligatorios.
                        Al editar, deja las contraseñas vacías si no deseas cambiarlas.
                    </p>

                    <div style="
                        display:flex;
                        justify-content:flex-end;
                        gap:10px;
                        margin-top:20px;
                    ">
                        <button type="button" id="cancelarUsuario"
                            class="btn-secundario">
                            Cancelar
                        </button>

                        <button type="submit" class="btn-primario">
                            Guardar usuario
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById("cerrarModalUsuario")
            .addEventListener("click", cerrarModal);

        document.getElementById("cancelarUsuario")
            .addEventListener("click", cerrarModal);

        modal.addEventListener("click", evento => {
            if (evento.target === modal) cerrarModal();
        });

        document.getElementById("formUsuario")
            .addEventListener("submit", guardarUsuario);
    }

    function abrirModal(usuario = null) {
        crearModal();

        usuarioEditando = usuario ? usuario.id : null;

        const modal = document.getElementById("modalUsuario");
        const formulario = document.getElementById("formUsuario");

        formulario.reset();

        document.getElementById("tituloModalUsuario").textContent =
            usuario ? "Editar usuario" : "Registrar nuevo usuario";

        const contrasena = document.getElementById("nuevoContrasena");
        const confirmar = document.getElementById("confirmarContrasena");

        contrasena.required = !usuario;
        confirmar.required = !usuario;

        document.getElementById("contenedorContrasena").innerHTML =
            `Contraseña ${usuario ? "(opcional)" : "*"}
            <input type="password" id="nuevoContrasena"
                minlength="6" ${usuario ? "" : "required"}
                style="width:100%;padding:10px;margin-top:5px;">`;

        document.getElementById("contenedorConfirmar").innerHTML =
            `Confirmar contraseña ${usuario ? "(opcional)" : "*"}
            <input type="password" id="confirmarContrasena"
                minlength="6" ${usuario ? "" : "required"}
                style="width:100%;padding:10px;margin-top:5px;">`;

        if (usuario) {
            document.getElementById("nuevoNombres").value = usuario.nombres || "";
            document.getElementById("nuevoApellidos").value = usuario.apellidos || "";
            document.getElementById("nuevoTipoDocumento").value =
                usuario.tipoDocumento || "C.C.";
            document.getElementById("nuevoDocumento").value = usuario.documento || "";
            document.getElementById("nuevoCorreo").value = usuario.correo || "";
            document.getElementById("nuevoUsuario").value = usuario.usuario || "";
            document.getElementById("nuevoRol").value =
                usuario.rol || "funcionario";
            document.getElementById("nuevoDependencia").value =
                usuario.dependencia || "";
        }

        modal.style.display = "flex";
    }

    function cerrarModal() {
        const modal = document.getElementById("modalUsuario");
        if (modal) modal.style.display = "none";
        usuarioEditando = null;
    }

    // ==========================================
    // GUARDAR USUARIO
    // ==========================================

    function guardarUsuario(evento) {
        evento.preventDefault();

        const datos = {
            nombres: document.getElementById("nuevoNombres").value.trim(),
            apellidos: document.getElementById("nuevoApellidos").value.trim(),
            tipoDocumento: document.getElementById("nuevoTipoDocumento").value,
            documento: document.getElementById("nuevoDocumento").value.trim(),
            correo: document.getElementById("nuevoCorreo").value.trim().toLowerCase(),
            usuario: document.getElementById("nuevoUsuario").value.trim(),
            rol: document.getElementById("nuevoRol").value,
            dependencia: document.getElementById("nuevoDependencia").value.trim()
        };

        const contrasena = document.getElementById("nuevoContrasena").value;
        const confirmar = document.getElementById("confirmarContrasena").value;

        if (!datos.nombres || !datos.apellidos || !datos.documento ||
            !datos.correo || !datos.usuario) {
            alert("Completa todos los campos obligatorios.");
            return;
        }

        const duplicado = usuarios.find(usuario =>
            usuario.id !== usuarioEditando &&
            (
                String(usuario.documento || "").toLowerCase() === datos.documento.toLowerCase() ||
                String(usuario.correo || "").toLowerCase() === datos.correo ||
                String(usuario.usuario || "").toLowerCase() === datos.usuario.toLowerCase()
            )
        );

        if (duplicado) {
            alert("Ya existe un usuario con ese documento, correo o nombre de usuario.");
            return;
        }

        if (!usuarioEditando && contrasena.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        if (contrasena || confirmar) {
            if (contrasena.length < 6) {
                alert("La contraseña debe tener al menos 6 caracteres.");
                return;
            }

            if (contrasena !== confirmar) {
                alert("Las contraseñas no coinciden.");
                return;
            }
        }

        const fechaActual = new Date().toISOString();

        if (usuarioEditando) {
            const indice = usuarios.findIndex(u => u.id === usuarioEditando);

            if (indice === -1) {
                alert("No se encontró el usuario que deseas editar.");
                return;
            }

            const anterior = usuarios[indice];

            usuarios[indice] = {
                ...anterior,
                ...datos,
                fechaActualizacion: fechaActual
            };

            if (contrasena) {
                usuarios[indice].contrasena = contrasena;
            }

            guardarUsuarios();
            cerrarModal();
            renderizarUsuarios();
            mostrarMensaje("Usuario actualizado correctamente.");

        } else {
            const nuevo = {
                id: "USR-" + Date.now(),
                ...datos,
                contrasena: contrasena,
                estado: "Activo",
                fechaRegistro: fechaActual,
                usuarioRegistro: sesion.usuario || sesion.nombre || "Administrador"
            };

            usuarios.push(nuevo);

            guardarUsuarios();
            cerrarModal();
            renderizarUsuarios();
            mostrarMensaje("Usuario registrado correctamente.");
        }
    }

    // ==========================================
    // EDITAR Y ACTIVAR / BLOQUEAR
    // ==========================================

    function cambiarEstado(id) {
        const usuario = usuarios.find(u => u.id === id);

        if (!usuario) return;

        // Evitar bloquear la cuenta que está usando el sistema.
        const esSesionActual =
            (sesion.usuario && usuario.usuario === sesion.usuario) ||
            (sesion.usuarioId && usuario.id === sesion.usuarioId);

        if (esSesionActual) {
            alert("No puedes bloquear tu propio usuario mientras tienes la sesión iniciada.");
            return;
        }

        const estaActivo = usuario.estado !== "Inactivo";

        const confirmar = window.confirm(
            estaActivo
                ? `¿Deseas bloquear el acceso de ${obtenerNombre(usuario)}?`
                : `¿Deseas activar el acceso de ${obtenerNombre(usuario)}?`
        );

        if (!confirmar) return;

        usuario.estado = estaActivo ? "Inactivo" : "Activo";
        usuario.fechaActualizacion = new Date().toISOString();

        guardarUsuarios();
        renderizarUsuarios();

        mostrarMensaje(
            estaActivo
                ? "El acceso del usuario fue bloqueado."
                : "El acceso del usuario fue activado."
        );
    }

    if (tabla) {
        tabla.addEventListener("click", evento => {
            const boton = evento.target.closest("button[data-accion]");
            if (!boton) return;

            const id = boton.dataset.id;
            const accion = boton.dataset.accion;

            const usuario = usuarios.find(u => u.id === id);
            if (!usuario) return;

            if (accion === "editar") {
                abrirModal(usuario);
            }

            if (accion === "estado") {
                cambiarEstado(id);
            }
        });
    }

    // ==========================================
    // EVENTOS
    // ==========================================

    btnNuevo?.addEventListener("click", () => abrirModal());

    buscarUsuario?.addEventListener("input", () => {
        if (buscarGlobal) buscarGlobal.value = "";
        renderizarUsuarios();
    });

    buscarGlobal?.addEventListener("input", () => {
        if (buscarUsuario) buscarUsuario.value = "";
        renderizarUsuarios();
    });

    btnCerrarSesion?.addEventListener("click", evento => {
        evento.preventDefault();

        if (confirm("¿Deseas cerrar la sesión de ARCHIVEX?")) {
            localStorage.removeItem(CLAVE_SESION);
            window.location.href = "../acceso/login.html";
        }
    });

    // ==========================================
    // INICIALIZACIÓN
    // ==========================================

    actualizarAvatar();
    renderizarUsuarios();

});
