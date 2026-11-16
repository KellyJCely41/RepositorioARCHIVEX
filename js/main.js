
/* =====================================================
   ARCHIVEX - JAVASCRIPT PRINCIPAL
   Funciones generales del sistema
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    console.log("ARCHIVEX: Sistema inicializado correctamente.");

    // ================================================
    // 1. IDENTIFICAR LA PANTALLA ACTUAL
    // ================================================

    const rutaActual = window.location.pathname;

    document.querySelectorAll("[data-nav-link]").forEach(enlace => {

        const destino = new URL(enlace.getAttribute("href"), window.location.href);

        if (destino.pathname === rutaActual) {
            enlace.classList.add("is-active");
            enlace.setAttribute("aria-current", "page");
        }

    });


    // ================================================
    // 2. CONTROLAR SUBMENÚS DEL PANEL LATERAL
    // ================================================

    document.querySelectorAll("[data-menu-toggle]").forEach(boton => {

        boton.addEventListener("click", () => {

            const selector = boton.dataset.menuToggle;
            const submenu = document.querySelector(selector);

            if (!submenu) return;

            const estaAbierto = boton.getAttribute("aria-expanded") === "true";

            boton.setAttribute("aria-expanded", String(!estaAbierto));

            submenu.classList.toggle("is-open", !estaAbierto);

        });

    });


    // ================================================
    // 3. ABRIR Y CERRAR EL MENÚ LATERAL
    // ================================================

    const botonSidebar = document.querySelector("[data-sidebar-toggle]");
    const sidebar = document.querySelector("[data-sidebar]");
    const overlay = document.querySelector("[data-sidebar-overlay]");

    function cerrarSidebar() {
        if (!sidebar) return;

        sidebar.classList.remove("is-open");
        document.body.classList.remove("sidebar-abierta");

        if (overlay) overlay.classList.remove("is-visible");

        if (botonSidebar) {
            botonSidebar.setAttribute("aria-expanded", "false");
        }
    }

    function abrirSidebar() {
        if (!sidebar) return;

        sidebar.classList.add("is-open");
        document.body.classList.add("sidebar-abierta");

        if (overlay) overlay.classList.add("is-visible");

        if (botonSidebar) {
            botonSidebar.setAttribute("aria-expanded", "true");
        }
    }

    if (botonSidebar) {
        botonSidebar.addEventListener("click", () => {

            if (sidebar.classList.contains("is-open")) {
                cerrarSidebar();
            } else {
                abrirSidebar();
            }

        });
    }

    if (overlay) {
        overlay.addEventListener("click", cerrarSidebar);
    }

    // Cerrar menú al seleccionar una opción en móvil
    document.querySelectorAll("[data-nav-link]").forEach(enlace => {
        enlace.addEventListener("click", () => {

            if (window.innerWidth <= 768) {
                cerrarSidebar();
            }

        });
    });


    // ================================================
    // 4. NOTIFICACIONES
    // ================================================

    const botonNotificaciones = document.querySelector(
        "[data-notifications-toggle]"
    );

    const panelNotificaciones = document.querySelector(
        "[data-notifications-panel]"
    );

    if (botonNotificaciones && panelNotificaciones) {

        botonNotificaciones.addEventListener("click", () => {

            const abierto =
                botonNotificaciones.getAttribute("aria-expanded") === "true";

            botonNotificaciones.setAttribute(
                "aria-expanded",
                String(!abierto)
            );

            panelNotificaciones.hidden = abierto;

        });

    }


    // ================================================
    // 5. CERRAR SESIÓN
    // ================================================

    document.querySelectorAll("[data-logout]").forEach(boton => {

        boton.addEventListener("click", evento => {

            evento.preventDefault();

            const confirmar = window.confirm(
                "¿Está seguro de que desea cerrar sesión en ARCHIVEX?"
            );

            if (confirmar) {

                const destino = boton.dataset.logoutUrl ||
                    "../acceso/login.html";

                window.location.href = destino;

            }

        });

    });


    // ================================================
    // 6. BÚSQUEDA GENERAL
    // ================================================

    const formularioBusqueda = document.querySelector(
        "[data-global-search]"
    );

    if (formularioBusqueda) {

        formularioBusqueda.addEventListener("submit", evento => {

            evento.preventDefault();

            const campo = formularioBusqueda.querySelector(
                "input[type='search'], input[name='busqueda']"
            );

            if (!campo) return;

            const termino = campo.value.trim();

            if (!termino) {
                alert("Ingrese un término para realizar la búsqueda.");
                campo.focus();
                return;
            }

            // Evento para que cada módulo pueda procesar la búsqueda.
            document.dispatchEvent(
                new CustomEvent("archivex:search", {
                    detail: { termino: termino }
                })
            );

        });

    }


    // ================================================
    // 7. CERRAR NOTIFICACIONES AL HACER CLIC AFUERA
    // ================================================

    document.addEventListener("click", evento => {

        if (
            panelNotificaciones &&
            botonNotificaciones &&
            !panelNotificaciones.contains(evento.target) &&
            !botonNotificaciones.contains(evento.target)
        ) {

            panelNotificaciones.hidden = true;

            botonNotificaciones.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    });


    // ================================================
    // 8. CONTROL DE TECLADO
    // ================================================

    document.addEventListener("keydown", evento => {

        if (evento.key === "Escape") {
            cerrarSidebar();

            if (panelNotificaciones && botonNotificaciones) {
                panelNotificaciones.hidden = true;
                botonNotificaciones.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
        }

    });

});
