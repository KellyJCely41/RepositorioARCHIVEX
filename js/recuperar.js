
document.addEventListener("DOMContentLoaded", () => {

    // FORMULARIO
    const formulario = document.getElementById("formularioRecuperar");

    // CAMPOS
    const identificador = document.getElementById("emailRecuperar");
    const mensaje = document.getElementById("mensajeRecuperar");

    if (!formulario) return;

    // MOSTRAR MENSAJES
    function mostrarMensaje(texto, tipo = "error") {
        mensaje.textContent = texto;
        mensaje.className = `mensaje-login ${tipo}`;
    }

    // RECUPERAR ACCESO
    formulario.addEventListener("submit", (evento) => {

        evento.preventDefault();

        const datoIngresado = identificador.value.trim().toLowerCase();

        // VALIDAR CAMPO
        if (!datoIngresado) {
            mostrarMensaje("Ingresa tu correo electrónico o nombre de usuario.");
            return;
        }

        // CONSULTAR USUARIOS REGISTRADOS
        const usuarios = JSON.parse(
            localStorage.getItem("archivex_usuarios_acceso") || "[]"
        );

        // BUSCAR POR CORREO O USUARIO
        const usuarioEncontrado = usuarios.find(usuario =>
            usuario.correo?.toLowerCase() === datoIngresado ||
            usuario.usuario?.toLowerCase() === datoIngresado
        );

        // VALIDAR EXISTENCIA
        if (!usuarioEncontrado) {
            mostrarMensaje("No encontramos una cuenta asociada a los datos ingresados.");
            return;
        }

        // INFORMACIÓN DE LA CUENTA
        const nombreCompleto =
            `${usuarioEncontrado.nombres} ${usuarioEncontrado.apellidos}`;

        // MENSAJE DE CONFIRMACIÓN
        mostrarMensaje(
            `Cuenta encontrada para ${nombreCompleto}. En la versión de pruebas, puedes restablecer la contraseña desde el módulo de recuperación.`,
            "exito"
        );

        // GUARDAR IDENTIFICADOR TEMPORAL PARA LA PRUEBA
        sessionStorage.setItem(
            "archivex_recuperacion_usuario",
            usuarioEncontrado.usuario
        );

        formulario.reset();

    });

});
