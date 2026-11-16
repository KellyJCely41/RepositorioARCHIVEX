
document.addEventListener("DOMContentLoaded", () => {

    // FORMULARIO DE INICIO DE SESIÓN
    const formulario = document.getElementById("formularioLogin");

    // CAMPOS
    const campoUsuario = document.getElementById("usuario");
    const campoContrasena = document.getElementById("contrasena");
    const botonMostrar = document.getElementById("mostrarContrasena");
    const recordar = document.getElementById("recordar");
    const mensaje = document.getElementById("mensajeLogin");

    if (!formulario) return;

    // MOSTRAR MENSAJES
    function mostrarMensaje(texto, tipo = "error") {
        mensaje.textContent = texto;
        mensaje.className = `mensaje-login ${tipo}`;
    }

    // MOSTRAR Y OCULTAR CONTRASEÑA
    if (botonMostrar && campoContrasena) {
        botonMostrar.addEventListener("click", () => {

            const mostrar = campoContrasena.type === "password";

            campoContrasena.type = mostrar ? "text" : "password";

            botonMostrar.innerHTML = mostrar
                ? '<i data-lucide="eye-off"></i>'
                : '<i data-lucide="eye"></i>';

            botonMostrar.setAttribute(
                "aria-label",
                mostrar ? "Ocultar contraseña" : "Mostrar contraseña"
            );

            if (window.lucide) {
                lucide.createIcons();
            }
        });
    }

    // INICIO DE SESIÓN
    formulario.addEventListener("submit", (evento) => {

        evento.preventDefault();

        const usuarioIngresado = campoUsuario.value.trim().toLowerCase();
        const contrasenaIngresada = campoContrasena.value;

        if (!usuarioIngresado || !contrasenaIngresada) {
            mostrarMensaje("Por favor, completa todos los campos.");
            return;
        }

        // CONSULTAR USUARIOS REGISTRADOS
        const usuarios = JSON.parse(
            localStorage.getItem("archivex_usuarios_acceso") || "[]"
        );

        // BUSCAR USUARIO
        const usuarioEncontrado = usuarios.find(usuario =>

            (
                usuario.usuario?.toLowerCase() === usuarioIngresado ||
                usuario.correo?.toLowerCase() === usuarioIngresado
            ) &&
            usuario.contrasena === contrasenaIngresada &&
            usuario.estado === "Activo"

        );

        if (!usuarioEncontrado) {
            mostrarMensaje("Usuario o contraseña incorrectos, o cuenta inactiva.");
            return;
        }

        // CREAR SESIÓN DE PRUEBA
        const sesion = {
            id: usuarioEncontrado.id,
            nombre: usuarioEncontrado.nombre,
            usuario: usuarioEncontrado.usuario,
            correo: usuarioEncontrado.correo,
            rol: usuarioEncontrado.rol,
            fechaIngreso: new Date().toISOString()
        };

        localStorage.setItem(
            "archivex_sesion",
            JSON.stringify(sesion)
        );

        // RECORDAR USUARIO (NO CONTRASEÑA)
        if (recordar && recordar.checked) {
            localStorage.setItem("archivex_usuario_recordado", usuarioIngresado);
        } else {
            localStorage.removeItem("archivex_usuario_recordado");
        }

        mostrarMensaje("Acceso correcto. Bienvenido a ARCHIVEX.", "exito");

        // REDIRECCIONAR AL DASHBOARD
        setTimeout(() => {
            window.location.href = "../vistas/dashboard.html";
        }, 1000);

    });

    // RECUPERAR USUARIO RECORDADO
    const usuarioRecordado = localStorage.getItem("archivex_usuario_recordado");

    if (usuarioRecordado && campoUsuario) {
        campoUsuario.value = usuarioRecordado;

        if (recordar) {
            recordar.checked = true;
        }
    }

});
