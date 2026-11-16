
document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. VERIFICAR SESIÓN
    // ==========================================

    const sesionGuardada = localStorage.getItem("archivex_sesion");

    if (!sesionGuardada) {
        window.location.href = "../acceso/login.html";
        return;
    }

    let sesion;

    try {
        sesion = JSON.parse(sesionGuardada);
    } catch (error) {
        localStorage.removeItem("archivex_sesion");
        window.location.href = "../acceso/login.html";
        return;
    }

    if (!sesion || !sesion.id) {
        localStorage.removeItem("archivex_sesion");
        window.location.href = "../acceso/login.html";
        return;
    }

    // ==========================================
    // 2. MOSTRAR INFORMACIÓN DEL FUNCIONARIO
    // ==========================================

    const nombreFuncionario = document.getElementById("nombreFuncionario");
    const inicialesUsuario = document.getElementById("inicialesUsuario");

    const nombreCompleto = sesion.nombre || "Funcionario ARCHIVEX";

    if (nombreFuncionario) {
        nombreFuncionario.textContent = nombreCompleto;
    }

    if (inicialesUsuario) {
        const iniciales = nombreCompleto
            .trim()
            .split(/\s+/)
            .filter(palabra => palabra.length > 0)
            .slice(0, 2)
            .map(palabra => palabra.charAt(0).toUpperCase())
            .join("");

        inicialesUsuario.textContent = iniciales || "FA";
    }

    // ==========================================
    // 3. LEER INFORMACIÓN DEL LOCALSTORAGE
    // ==========================================

    function obtenerRegistros(clave) {
        try {
            const datos = JSON.parse(
                localStorage.getItem(clave) || "[]"
            );

            return Array.isArray(datos) ? datos : [];

        } catch (error) {
            console.error("Error leyendo:", clave, error);
            return [];
        }
    }

    const radicados = obtenerRegistros("archivex_radicaciones");
    const expedientes = obtenerRegistros("archivex_expedientes");

    // ==========================================
    // 4. ACTUALIZAR INDICADORES
    // ==========================================

    function actualizarIndicador(id, cantidad) {
        const elemento = document.getElementById(id);

        if (elemento) {
            elemento.textContent = cantidad.toLocaleString("es-CO");
        }
    }

    const totalRadicados = radicados.length;

    const totalDigitalizados = radicados.filter(registro => {
        const estado = String(registro.estado || "").toLowerCase();

        return estado.includes("digitalizado") ||
               estado.includes("validado");
    }).length;

    const totalPendientes = radicados.filter(registro => {
        const estado = String(registro.estado || "").toLowerCase();

        return estado.includes("pendiente") ||
               estado.includes("revisión") ||
               estado.includes("clasificación");
    }).length;

    const totalExpedientesActivos = expedientes.filter(registro => {
        return String(registro.estado || "").toLowerCase() === "activo";
    }).length;

    actualizarIndicador("totalRadicados", totalRadicados);
    actualizarIndicador("totalDigitalizados", totalDigitalizados);
    actualizarIndicador("totalPendientes", totalPendientes);
    actualizarIndicador("totalExpedientes", totalExpedientesActivos);

    // ==========================================
    // 5. MOSTRAR ÚLTIMOS RADICADOS
    // ==========================================

    const tabla = document.getElementById("tablaUltimosRadicados");

    if (tabla) {

        tabla.innerHTML = "";

        if (radicados.length === 0) {

            const fila = document.createElement("tr");
            const celda = document.createElement("td");

            celda.colSpan = 5;
            celda.textContent = "Todavía no hay documentos radicados.";

            fila.appendChild(celda);
            tabla.appendChild(fila);

        } else {

            const ultimosRadicados = [...radicados].reverse().slice(0, 5);

            ultimosRadicados.forEach(registro => {

                const fila = document.createElement("tr");

                const numero = registro.numeroRadicado ||
                               registro.radicado ||
                               registro.codigo ||
                               "Sin número";

                const remitente = registro.remitente ||
                                  registro.entidad ||
                                  registro.nombreRemitente ||
                                  "No especificado";

                const asunto = registro.asunto ||
                               registro.descripcion ||
                               "Sin asunto";

                const fecha = registro.fecha ||
                              registro.fechaRadicacion ||
                              registro.fechaRegistro ||
                              "";

                const estado = registro.estado || "Pendiente";

                const celdas = [
                    numero,
                    remitente,
                    asunto,
                    fecha,
                    estado
                ];

                celdas.forEach(valor => {
                    const celda = document.createElement("td");
                    celda.textContent = valor;
                    fila.appendChild(celda);
                });

                tabla.appendChild(fila);

            });
        }
    }

    // ==========================================
    // 6. CERRAR SESIÓN
    // ==========================================

    const botonCerrarSesion = document.getElementById("btnCerrarSesion");

    if (botonCerrarSesion) {

        botonCerrarSesion.addEventListener("click", (evento) => {

            evento.preventDefault();

            const confirmar = window.confirm(
                "¿Estás seguro de que deseas cerrar tu sesión en ARCHIVEX?"
            );

            if (confirmar) {

                localStorage.removeItem("archivex_sesion");

                window.location.href = "../acceso/login.html";
            }

        });
    }

    console.log("Dashboard ARCHIVEX cargado correctamente.");

});
