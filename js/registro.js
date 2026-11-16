
document.addEventListener("DOMContentLoaded", () => {

    const formulario = document.getElementById("formularioRegistro");

    if (!formulario) return;

    // CAMPOS DEL FORMULARIO
    const nombres = document.getElementById("nombres");
    const apellidos = document.getElementById("apellidos");
    const tipoDocumento = document.getElementById("tipoDocumento");
    const numeroDocumento = document.getElementById("numeroDocumento");
    const email = document.getElementById("email");
    const usuario = document.getElementById("usuario");
    const contrasena = document.getElementById("contrasena");
    const confirmarContrasena = document.getElementById("confirmarContrasena");
    const rol = document.getElementById("rol");
    const mensaje = document.getElementById("mensajeRegistro");
    const botonMostrar = document.getElementById("mostrarContrasena");

    // MOSTRAR MENSAJES
    function mostrarMensaje(texto, tipo = "error") {
        mensaje.textContent = texto;
        mensaje.className = `mensaje-login ${tipo}`;
    }

    // MOSTRAR Y OCULTAR CONTRASEÑA
    if (botonMostrar) {
        botonMostrar.addEventListener("click", () => {

            const mostrar = contrasena.type === "password";

            contrasena.type = mostrar ? "text" : "password";

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

    // REGISTRAR USUARIO
    formulario.addEventListener("submit", (evento) => {

        evento.preventDefault();

        // OBTENER DATOS
        const datos = {
            nombres: nombres.value.trim(),
            apellidos: apellidos.value.trim(),
            tipoDocumento: tipoDocumento.value,
            documento: numeroDocumento.value.trim(),
            correo: email.value.trim().toLowerCase(),
            usuario: usuario.value.trim().toLowerCase(),
            contrasena: contrasena.value,
            rol: rol.value,
            estado: "Activo",
            fechaRegistro: new Date().toISOString()
        };

        // VALIDAR CAMPOS
        if (
            !datos.nombres ||
            !datos.apellidos ||
            !datos.tipoDocumento ||
            !datos.documento ||
            !datos.correo ||
            !datos.usuario ||
            !datos.contrasena ||
            !datos.rol
        ) {
            mostrarMensaje("Por favor, completa todos los campos.");
            return;
        }

        // VALIDAR CORREO
        const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formatoCorreo.test(datos.correo)) {
            mostrarMensaje("Ingresa un correo electrónico válido.");
            return;
        }

        // VALIDAR DOCUMENTO
        if (!/^[a-zA-Z0-9-]{5,20}$/.test(datos.documento)) {
            mostrarMensaje("Verifica el número de documento ingresado.");
            return;
        }

        // VALIDAR USUARIO
        if (!/^[a-zA-Z0-9._-]{4,20}$/.test(datos.usuario)) {
            mostrarMensaje("El usuario debe tener entre 4 y 20 caracteres. Utiliza letras, números, puntos, guiones o guion bajo.");
            return;
        }

        // VALIDAR CONTRASEÑA
        if (datos.contrasena.length < 8) {
            mostrarMensaje("La contraseña debe tener mínimo 8 caracteres.");
            return;
        }

        if (datos.contrasena !== confirmarContrasena.value) {
            mostrarMensaje("Las contraseñas no coinciden.");
            return;
        }

        // CONSULTAR USUARIOS EXISTENTES
        const usuarios = JSON.parse(
            localStorage.getItem("archivex_usuarios_acceso") || "[]"
        );

        // VALIDAR DUPLICADOS
        const existeCorreo = usuarios.some(
            item => item.correo?.toLowerCase() === datos.correo
        );

        const existeUsuario = usuarios.some(
            item => item.usuario?.toLowerCase() === datos.usuario
        );

        const existeDocumento = usuarios.some(
            item => item.documento === datos.documento
        );

        if (existeCorreo) {
            mostrarMensaje("Este correo electrónico ya está registrado.");
            return;
        }

        if (existeUsuario) {
            mostrarMensaje("Este nombre de usuario ya está en uso.");
            return;
        }

        if (existeDocumento) {
            mostrarMensaje("Este número de documento ya está registrado.");
            return;
        }

        // CREAR NUEVO REGISTRO
        const nuevoUsuario = {
            id: Date.now(),
            ...datos
        };

        usuarios.push(nuevoUsuario);

        // GUARDAR INFORMACIÓN
        localStorage.setItem(
            "archivex_usuarios_acceso",
            JSON.stringify(usuarios)
        );

        // MENSAJE DE ÉXITO
        mostrarMensaje(
            "¡Registro exitoso! Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
            "exito"
        );

        formulario.reset();

        // REDIRECCIONAR AL LOGIN
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1800);

    });

});
