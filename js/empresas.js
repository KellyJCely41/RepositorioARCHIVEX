
document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. VALIDAR SESIÓN
    // ==========================================

    let sesion;

    try {
        sesion = JSON.parse(localStorage.getItem("archivex_sesion"));
    } catch (error) {
        sesion = null;
    }

    if (!sesion) {
        window.location.href = "../acceso/login.html";
        return;
    }

    // ==========================================
    // 2. ELEMENTOS PRINCIPALES
    // ==========================================

    const botonNuevaEmpresa = document.getElementById("btnNuevaEmpresa");
    const buscador = document.getElementById("buscarEmpresa");
    const tablaEmpresas = document.getElementById("tablaEmpresas");
    const avatar = document.getElementById("inicialesUsuario");

    const CLAVE_EMPRESAS = "archivex_empresas";

    // ==========================================
    // 3. OBTENER Y GUARDAR EMPRESAS
    // ==========================================

    function obtenerEmpresas() {
        try {
            const datos = JSON.parse(
                localStorage.getItem(CLAVE_EMPRESAS)
            );

            return Array.isArray(datos) ? datos : [];

        } catch (error) {
            console.error("Error al consultar empresas:", error);
            return [];
        }
    }

    function guardarEmpresas(empresas) {
        localStorage.setItem(
            CLAVE_EMPRESAS,
            JSON.stringify(empresas)
        );
    }

    // ==========================================
    // 4. ESTILOS DEL FORMULARIO MODAL
    // ==========================================

    const estilos = document.createElement("style");

    estilos.textContent = `
        .modal-empresa {
            position: fixed;
            inset: 0;
            background: rgba(15, 35, 60, .60);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            z-index: 9999;
        }

        .modal-empresa-contenido {
            background: #fff;
            width: 100%;
            max-width: 760px;
            max-height: 90vh;
            overflow-y: auto;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 10px 35px rgba(0,0,0,.2);
        }

        .modal-empresa-encabezado {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            gap: 15px;
        }

        .modal-empresa-encabezado h2 {
            margin: 0;
            color: #2563A6;
            font-size: 21px;
        }

        .cerrar-modal-empresa {
            border: none;
            background: transparent;
            font-size: 25px;
            cursor: pointer;
        }

        .form-empresa-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
        }

        .form-empresa-campo {
            display: flex;
            flex-direction: column;
            gap: 7px;
        }

        .form-empresa-campo.completo {
            grid-column: 1 / -1;
        }

        .form-empresa-campo label {
            font-weight: 600;
            color: #344054;
        }

        .form-empresa-campo input,
        .form-empresa-campo select,
        .form-empresa-campo textarea {
            width: 100%;
            padding: 11px;
            border: 1px solid #d0d5dd;
            border-radius: 7px;
            font: inherit;
            box-sizing: border-box;
        }

        .form-empresa-campo input:focus,
        .form-empresa-campo select:focus,
        .form-empresa-campo textarea:focus {
            outline: 2px solid #95D6ED;
            border-color: #2563A6;
        }

        .acciones-modal-empresa {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 22px;
        }

        .acciones-modal-empresa button {
            padding: 11px 18px;
            border-radius: 7px;
            cursor: pointer;
            font-weight: 600;
        }

        .btn-cancelar-empresa {
            background: #eef2f6;
            border: 1px solid #d0d5dd;
            color: #344054;
        }

        .btn-guardar-empresa {
            background: #2563A6;
            border: none;
            color: white;
        }

        .mensaje-empresa {
            margin-bottom: 15px;
            padding: 11px;
            border-radius: 7px;
            display: none;
        }

        .mensaje-empresa.error {
            display: block;
            background: #fee4e2;
            color: #b42318;
        }

        .mensaje-empresa.exito {
            display: block;
            background: #dcfae6;
            color: #067647;
        }

        .estado-empresa {
            display: inline-block;
            padding: 5px 9px;
            border-radius: 15px;
            font-size: 12px;
            background: #dcfae6;
            color: #067647;
        }

        .estado-empresa.inactivo {
            background: #f2f4f7;
            color: #667085;
        }

        .acciones-fila-grupo {
            display: flex;
            gap: 6px;
        }

        .btn-accion-tabla {
            cursor: pointer;
        }

        .sin-empresas {
            text-align: center;
            padding: 25px;
            color: #667085;
        }

        @media(max-width: 600px) {
            .form-empresa-grid {
                grid-template-columns: 1fr;
            }

            .form-empresa-campo.completo {
                grid-column: auto;
            }

            .modal-empresa-contenido {
                padding: 18px;
            }
        }
    `;

    document.head.appendChild(estilos);

    // ==========================================
    // 5. CREAR VENTANA DE REGISTRO Y EDICIÓN
    // ==========================================

    const modal = document.createElement("div");

    modal.className = "modal-empresa";
    modal.style.display = "none";

    modal.innerHTML = `
        <div class="modal-empresa-contenido">

            <div class="modal-empresa-encabezado">
                <h2 id="tituloModalEmpresa">Registrar Empresa o Tercero</h2>

                <button type="button"
                    class="cerrar-modal-empresa"
                    id="cerrarModalEmpresa"
                    aria-label="Cerrar">
                    &times;
                </button>
            </div>

            <div id="mensajeEmpresa" class="mensaje-empresa"></div>

            <form id="formularioEmpresa">

                <div class="form-empresa-grid">

                    <div class="form-empresa-campo">
                        <label for="nitEmpresa">NIT o identificación *</label>
                        <input type="text" id="nitEmpresa"
                            maxlength="30" required>
                    </div>

                    <div class="form-empresa-campo">
                        <label for="tipoEmpresa">Tipo de entidad *</label>
                        <select id="tipoEmpresa" required>
                            <option value="">Seleccione</option>
                            <option value="Entidad Pública">Entidad Pública</option>
                            <option value="Empresa Privada">Empresa Privada</option>
                            <option value="Entidad Gubernamental">Entidad Gubernamental</option>
                            <option value="Persona Natural">Persona Natural</option>
                            <option value="Organización">Organización</option>
                            <option value="Otra">Otra</option>
                        </select>
                    </div>

                    <div class="form-empresa-campo completo">
                        <label for="razonSocial">Razón social o nombre completo *</label>
                        <input type="text" id="razonSocial"
                            maxlength="150" required>
                    </div>

                    <div class="form-empresa-campo">
                        <label for="representante">Representante o contacto</label>
                        <input type="text" id="representante"
                            maxlength="120">
                    </div>

                    <div class="form-empresa-campo">
                        <label for="telefonoEmpresa">Teléfono</label>
                        <input type="tel" id="telefonoEmpresa"
                            maxlength="25">
                    </div>

                    <div class="form-empresa-campo">
                        <label for="correoEmpresa">Correo electrónico</label>
                        <input type="email" id="correoEmpresa"
                            maxlength="120">
                    </div>

                    <div class="form-empresa-campo">
                        <label for="direccionEmpresa">Dirección</label>
                        <input type="text" id="direccionEmpresa"
                            maxlength="180">
                    </div>

                    <div class="form-empresa-campo">
                        <label for="ciudadEmpresa">Ciudad</label>
                        <input type="text" id="ciudadEmpresa"
                            maxlength="100">
                    </div>

                    <div class="form-empresa-campo">
                        <label for="estadoEmpresa">Estado *</label>
                        <select id="estadoEmpresa" required>
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>
                    </div>

                    <div class="form-empresa-campo completo">
                        <label for="observacionesEmpresa">Observaciones</label>
                        <textarea id="observacionesEmpresa"
                            rows="3" maxlength="500"></textarea>
                    </div>

                </div>

                <div class="acciones-modal-empresa">

                    <button type="button"
                        class="btn-cancelar-empresa"
                        id="cancelarEmpresa">
                        Cancelar
                    </button>

                    <button type="submit"
                        class="btn-guardar-empresa">
                        Guardar Empresa
                    </button>

                </div>

            </form>
        </div>
    `;

    document.body.appendChild(modal);

    // ==========================================
    // 6. REFERENCIAS DEL FORMULARIO
    // ==========================================

    const formulario = document.getElementById("formularioEmpresa");

    const tituloModal = document.getElementById("tituloModalEmpresa");

    const mensajeEmpresa = document.getElementById("mensajeEmpresa");

    let empresaEditando = null;

    // ==========================================
    // 7. ABRIR Y CERRAR MODAL
    // ==========================================

    function abrirModal(empresa = null) {

        formulario.reset();

        empresaEditando = empresa ? empresa.id : null;

        mensajeEmpresa.textContent = "";
        mensajeEmpresa.className = "mensaje-empresa";

        if (empresa) {

            tituloModal.textContent = "Editar Empresa o Tercero";

            document.getElementById("nitEmpresa").value = empresa.nit || "";
            document.getElementById("tipoEmpresa").value = empresa.tipo || "";
            document.getElementById("razonSocial").value = empresa.razonSocial || "";
            document.getElementById("representante").value = empresa.representante || "";
            document.getElementById("telefonoEmpresa").value = empresa.telefono || "";
            document.getElementById("correoEmpresa").value = empresa.correo || "";
            document.getElementById("direccionEmpresa").value = empresa.direccion || "";
            document.getElementById("ciudadEmpresa").value = empresa.ciudad || "";
            document.getElementById("estadoEmpresa").value = empresa.estado || "Activo";
            document.getElementById("observacionesEmpresa").value = empresa.observaciones || "";

        } else {

            tituloModal.textContent = "Registrar Empresa o Tercero";

            document.getElementById("estadoEmpresa").value = "Activo";
        }

        modal.style.display = "flex";
    }

    function cerrarModal() {
        modal.style.display = "none";
        formulario.reset();
        empresaEditando = null;
    }

    botonNuevaEmpresa.addEventListener("click", () => abrirModal());

    document.getElementById("cerrarModalEmpresa")
        .addEventListener("click", cerrarModal);

    document.getElementById("cancelarEmpresa")
        .addEventListener("click", cerrarModal);

    modal.addEventListener("click", (evento) => {
        if (evento.target === modal) {
            cerrarModal();
        }
    });

    // ==========================================
    // 8. REGISTRAR O ACTUALIZAR EMPRESA
    // ==========================================

    formulario.addEventListener("submit", (evento) => {

        evento.preventDefault();

        const empresas = obtenerEmpresas();

        const nit = document.getElementById("nitEmpresa").value.trim();

        const datos = {

            nit: nit,

            tipo: document.getElementById("tipoEmpresa").value,

            razonSocial: document.getElementById("razonSocial").value.trim(),

            representante: document.getElementById("representante").value.trim(),

            telefono: document.getElementById("telefonoEmpresa").value.trim(),

            correo: document.getElementById("correoEmpresa").value.trim(),

            direccion: document.getElementById("direccionEmpresa").value.trim(),

            ciudad: document.getElementById("ciudadEmpresa").value.trim(),

            estado: document.getElementById("estadoEmpresa").value,

            observaciones: document.getElementById("observacionesEmpresa").value.trim()

        };

        // Validar duplicados de identificación
        const duplicada = empresas.find(empresa =>
            empresa.nit.toLowerCase() === nit.toLowerCase() &&
            empresa.id !== empresaEditando
        );

        if (duplicada) {

            mensajeEmpresa.textContent =
                "Ya existe una empresa o tercero registrado con esa identificación.";

            mensajeEmpresa.className = "mensaje-empresa error";

            return;
        }

        try {

            if (empresaEditando !== null) {

                const indice = empresas.findIndex(
                    empresa => empresa.id === empresaEditando
                );

                if (indice === -1) {
                    throw new Error("No se encontró la empresa que desea editar.");
                }

                empresas[indice] = {
                    ...empresas[indice],
                    ...datos,
                    fechaActualizacion: new Date().toISOString(),
                    usuarioActualizacion: sesion.nombre || sesion.usuario || "Usuario ARCHIVEX"
                };

            } else {

                const nuevaEmpresa = {

                    id: Date.now(),

                    ...datos,

                    fechaRegistro: new Date().toISOString(),

                    usuarioRegistro: sesion.nombre || sesion.usuario || "Usuario ARCHIVEX"

                };

                empresas.push(nuevaEmpresa);
            }

            guardarEmpresas(empresas);

            renderizarEmpresas();

            cerrarModal();

            alert(
                empresaEditando !== null
                    ? "Empresa actualizada correctamente."
                    : "Empresa registrada correctamente."
            );

        } catch (error) {

            console.error("Error al guardar empresa:", error);

            mensajeEmpresa.textContent =
                "No fue posible guardar la información.";

            mensajeEmpresa.className = "mensaje-empresa error";
        }

    });

    // ==========================================
    // 9. PROTEGER TEXTO EN LA TABLA
    // ==========================================

    function escaparHTML(valor) {

        return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[caracter]);
    }

    // ==========================================
    // 10. MOSTRAR EMPRESAS EN LA TABLA
    // ==========================================

    function renderizarEmpresas(filtro = "") {

        const empresas = obtenerEmpresas();

        const termino = filtro.toLowerCase().trim();

        const filtradas = empresas.filter(empresa => {

            const texto = [
                empresa.nit,
                empresa.razonSocial,
                empresa.representante,
                empresa.correo,
                empresa.tipo
            ].join(" ").toLowerCase();

            return texto.includes(termino);
        });

        tablaEmpresas.innerHTML = "";

        if (filtradas.length === 0) {

            tablaEmpresas.innerHTML = `
                <tr>
                    <td colspan="6" class="sin-empresas">
                        No se encontraron empresas o terceros registrados.
                    </td>
                </tr>
            `;

            return;
        }

        filtradas.forEach(empresa => {

            const fila = document.createElement("tr");

            const estadoClase = empresa.estado === "Activo"
                ? ""
                : "inactivo";

            fila.innerHTML = `
                <td>
                    <strong>${escaparHTML(empresa.nit)}</strong>
                </td>

                <td>
                    <div class="emp-celda-titulo">
                        ${escaparHTML(empresa.razonSocial)}
                    </div>
                    <span class="emp-sub">
                        ${escaparHTML(empresa.tipo)}
                    </span>
                    <br>
                    <span class="estado-empresa ${estadoClase}">
                        ${escaparHTML(empresa.estado)}
                    </span>
                </td>

                <td>${escaparHTML(empresa.representante || "No registrado")}</td>

                <td>${escaparHTML(empresa.correo || "No registrado")}</td>

                <td>${escaparHTML(empresa.telefono || "No registrado")}</td>

                <td>
                    <div class="acciones-fila-grupo">

                        <button type="button"
                            class="btn-accion-tabla"
                            data-accion="editar"
                            data-id="${empresa.id}"
                            title="Editar Empresa"
                            aria-label="Editar empresa">
                            <i data-lucide="edit-3"></i>
                        </button>

                        <button type="button"
                            class="btn-accion-tabla"
                            data-accion="radicados"
                            data-id="${empresa.id}"
                            title="Ver Radicados Asociados"
                            aria-label="Ver radicados asociados">
                            <i data-lucide="file-text"></i>
                        </button>

                        <button type="button"
                            class="btn-accion-tabla"
                            data-accion="estado"
                            data-id="${empresa.id}"
                            title="${empresa.estado === "Activo" ? "Inactivar" : "Activar"}"
                            aria-label="Cambiar estado">
                            <i data-lucide="${empresa.estado === "Activo" ? "ban" : "check-circle"}"></i>
                        </button>

                    </div>
                </td>
            `;

            tablaEmpresas.appendChild(fila);
        });

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    // ==========================================
    // 11. BUSCAR EMPRESAS
    // ==========================================

    if (buscador) {

        buscador.addEventListener("input", () => {
            renderizarEmpresas(buscador.value);
        });
    }

    // ==========================================
    // 12. ACCIONES DE LA TABLA
    // ==========================================

    tablaEmpresas.addEventListener("click", (evento) => {

        const boton = evento.target.closest("button[data-accion]");

        if (!boton) return;

        const id = Number(boton.dataset.id);
        const accion = boton.dataset.accion;

        const empresas = obtenerEmpresas();

        const empresa = empresas.find(item => item.id === id);

        if (!empresa) return;

        // Editar empresa
        if (accion === "editar") {
            abrirModal(empresa);
        }

        // Ver radicados asociados
        if (accion === "radicados") {

            const radicaciones = JSON.parse(
                localStorage.getItem("archivex_radicaciones") || "[]"
            );

            const asociados = radicaciones.filter(registro =>
                String(registro.identificacionRemitente || "").toLowerCase() ===
                String(empresa.nit).toLowerCase()
            );

            alert(
                asociados.length > 0
                    ? `Se encontraron ${asociados.length} radicados asociados a ${empresa.razonSocial}.`
                    : `Todavía no hay radicados asociados a ${empresa.razonSocial}.`
            );
        }

        // Activar o inactivar
        if (accion === "estado") {

            const nuevoEstado = empresa.estado === "Activo"
                ? "Inactivo"
                : "Activo";

            const confirmar = confirm(
                `¿Desea cambiar el estado de ${empresa.razonSocial} a ${nuevoEstado}?`
            );

            if (confirmar) {

                empresa.estado = nuevoEstado;

                empresa.fechaActualizacion = new Date().toISOString();

                guardarEmpresas(empresas);

                renderizarEmpresas(buscador ? buscador.value : "");

            }
        }

    });

    // ==========================================
    // 13. MOSTRAR INICIALES DEL USUARIO
    // ==========================================

    if (avatar) {

        const nombre = sesion.nombre || sesion.usuario || "Usuario";

        avatar.textContent = nombre
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(palabra => palabra.charAt(0).toUpperCase())
            .join("");
    }

    // ==========================================
    // 14. CERRAR SESIÓN
    // ==========================================

    const botonCerrarSesion = document.getElementById("btnCerrarSesion");

    if (botonCerrarSesion) {

        botonCerrarSesion.addEventListener("click", (evento) => {

            evento.preventDefault();

            if (confirm("¿Está seguro de cerrar la sesión?")) {

                localStorage.removeItem("archivex_sesion");

                window.location.href = "../acceso/login.html";
            }
        });
    }

    // ==========================================
    // 15. INICIALIZAR MÓDULO
    // ==========================================

    renderizarEmpresas();

    console.log("Módulo de empresas ARCHIVEX iniciado correctamente.");

});
