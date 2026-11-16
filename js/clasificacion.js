
/* =====================================================
   ARCHIVEX - CLASIFICACIÓN Y TABLAS DE RETENCIÓN
   Archivo: clasificacion.js
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    // -------------------------------------------------
    // 1. VALIDAR SESIÓN
    // -------------------------------------------------

    const sesion = JSON.parse(
        localStorage.getItem("archivex_sesion") || "null"
    );

    if (!sesion) {
        window.location.href = "../acceso/login.html";
        return;
    }

    // -------------------------------------------------
    // 2. ELEMENTOS DEL HTML
    // -------------------------------------------------

    const tablaTRD = document.getElementById("tablaTRD");
    const buscarTRD = document.getElementById("buscarTRD");
    const filtroDep = document.getElementById("filtroDep");
    const btnNuevaSerie = document.getElementById("btnNuevaSerie");
    const btnCerrarSesion = document.getElementById("btnCerrarSesion");
    const inicialesUsuario = document.getElementById("inicialesUsuario");

    const CLAVE_TRD = "archivex_trd";
    const CLAVE_RADICACIONES = "archivex_radicaciones";

    let trdEditando = null;

    // -------------------------------------------------
    // 3. DATOS INICIALES DE LA TRD
    // -------------------------------------------------

    const datosIniciales = [
        {
            id: "TRD-100",
            codigo: "100",
            serie: "Actas y Resoluciones",
            codigoSubserie: "100.1",
            subserie: "Actas de Junta Directiva",
            dependencia: "gerencia",
            retencionGestion: 1,
            retencionCentral: "Indefinido",
            disposicion: "CT",
            observaciones: "Documentos de carácter administrativo y directivo."
        },
        {
            id: "TRD-200",
            codigo: "200",
            serie: "Contratos y Convenios",
            codigoSubserie: "200.5",
            subserie: "Contratos de Prestación de Servicios",
            dependencia: "juridica",
            retencionGestion: 3,
            retencionCentral: 20,
            disposicion: "S",
            observaciones: "Documentación contractual."
        },
        {
            id: "TRD-300",
            codigo: "300",
            serie: "Historias Laborales",
            codigoSubserie: "300.1",
            subserie: "Expedientes de Personal Activo y Retirado",
            dependencia: "financiera",
            retencionGestion: 1,
            retencionCentral: 80,
            disposicion: "CT",
            observaciones: "Documentación relacionada con el personal."
        },
        {
            id: "TRD-400",
            codigo: "400",
            serie: "Correspondencia General",
            codigoSubserie: "400.2",
            subserie: "Peticiones, Quejas y Reclamos (PQR)",
            dependencia: "archivo",
            retencionGestion: 2,
            retencionCentral: 3,
            disposicion: "E",
            observaciones: "Correspondencia institucional."
        }
    ];

    // -------------------------------------------------
    // 4. ALMACENAMIENTO
    // -------------------------------------------------

    function obtenerTRD() {
        const datos = localStorage.getItem(CLAVE_TRD);

        if (datos === null) {
            localStorage.setItem(
                CLAVE_TRD,
                JSON.stringify(datosIniciales)
            );

            return [...datosIniciales];
        }

        try {
            return JSON.parse(datos) || [];
        } catch (error) {
            console.error("Error leyendo las TRD:", error);
            return [];
        }
    }

    function guardarTRD(datos) {
        localStorage.setItem(CLAVE_TRD, JSON.stringify(datos));
    }

    function obtenerRadicaciones() {
        try {
            return JSON.parse(
                localStorage.getItem(CLAVE_RADICACIONES) || "[]"
            );
        } catch (error) {
            console.error("Error leyendo radicaciones:", error);
            return [];
        }
    }

    // -------------------------------------------------
    // 5. INFORMACIÓN DEL USUARIO
    // -------------------------------------------------

    if (inicialesUsuario) {
        const nombre = sesion.nombre || sesion.usuario || "Usuario";

        inicialesUsuario.textContent = nombre
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(palabra => palabra.charAt(0).toUpperCase())
            .join("");
    }

    // -------------------------------------------------
    // 6. FUNCIONES AUXILIARES
    // -------------------------------------------------

    function escaparHTML(valor) {
        return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[caracter]);
    }

    function nombreDependencia(valor) {
        const dependencias = {
            gerencia: "Gerencia / Dirección General",
            juridica: "Oficina Jurídica",
            financiera: "Gestión Financiera",
            archivo: "Archivo Central"
        };

        return dependencias[valor] || valor;
    }

    function textoRetencion(valor) {
        return String(valor).toLowerCase() === "indefinido"
            ? "Indefinido"
            : `${valor} ${Number(valor) === 1 ? "Año" : "Años"}`;
    }

    function textoDisposicion(valor) {
        const opciones = {
            CT: "Conservación Total (CT)",
            S: "Selección (S)",
            E: "Eliminación (E)",
            M: "Medio tecnológico (MT)"
        };

        return opciones[valor] || valor;
    }

    function claseDisposicion(valor) {
        const clases = {
            CT: "azul",
            S: "morado",
            E: "amarillo",
            M: "verde"
        };

        return clases[valor] || "azul";
    }

    // -------------------------------------------------
    // 7. MOSTRAR MENSAJES
    // -------------------------------------------------

    function mostrarMensaje(mensaje, tipo = "info") {

        let contenedor = document.getElementById("mensajeTRD");

        if (!contenedor) {
            contenedor = document.createElement("div");
            contenedor.id = "mensajeTRD";

            document.querySelector(".dashboard-content")
                .prepend(contenedor);
        }

        contenedor.textContent = mensaje;

        contenedor.style.padding = "12px 16px";
        contenedor.style.marginBottom = "15px";
        contenedor.style.borderRadius = "8px";

        if (tipo === "exito") {
            contenedor.style.background = "#E8F7EE";
            contenedor.style.color = "#18794E";
        } else if (tipo === "error") {
            contenedor.style.background = "#FDECEC";
            contenedor.style.color = "#B42318";
        } else {
            contenedor.style.background = "#EAF4FF";
            contenedor.style.color = "#2563A6";
        }
    }

    // -------------------------------------------------
    // 8. MOSTRAR TABLA TRD
    // -------------------------------------------------

    function mostrarTRD() {

        const datos = obtenerTRD();

        const texto = buscarTRD
            ? buscarTRD.value.trim().toLowerCase()
            : "";

        const dependencia = filtroDep ? filtroDep.value : "todos";

        const filtrados = datos.filter(item => {

            const coincideTexto = [
                item.codigo,
                item.serie,
                item.codigoSubserie,
                item.subserie,
                item.dependencia
            ].join(" ").toLowerCase().includes(texto);

            const coincideDependencia =
                dependencia === "todos" ||
                item.dependencia === dependencia;

            return coincideTexto && coincideDependencia;
        });

        tablaTRD.innerHTML = "";

        if (filtrados.length === 0) {
            tablaTRD.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:25px;">
                        No se encontraron series o subseries documentales.
                    </td>
                </tr>
            `;
            return;
        }

        filtrados.forEach(item => {

            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td>
                    <strong>${escaparHTML(item.codigo)}</strong>
                </td>

                <td>
                    <div class="trd-celda-titulo">
                        ${escaparHTML(item.serie)}
                    </div>

                    <span class="trd-sub">
                        ${escaparHTML(item.codigoSubserie)} 
                        ${escaparHTML(item.subserie)}
                    </span>

                    <br>

                    <small>
                        ${escaparHTML(nombreDependencia(item.dependencia))}
                    </small>
                </td>

                <td>
                    ${escaparHTML(textoRetencion(item.retencionGestion))}
                </td>

                <td>
                    ${escaparHTML(textoRetencion(item.retencionCentral))}
                </td>

                <td>
                    <span class="badge ${claseDisposicion(item.disposicion)}">
                        ${escaparHTML(textoDisposicion(item.disposicion))}
                    </span>
                </td>

                <td>
                    <button
                        type="button"
                        class="btn-accion-tabla"
                        data-accion="ver"
                        data-id="${escaparHTML(item.id)}"
                        title="Ver detalle">
                        <i data-lucide="eye"></i>
                    </button>

                    <button
                        type="button"
                        class="btn-accion-tabla"
                        data-accion="editar"
                        data-id="${escaparHTML(item.id)}"
                        title="Editar serie">
                        <i data-lucide="pencil"></i>
                    </button>

                    <button
                        type="button"
                        class="btn-accion-tabla"
                        data-accion="eliminar"
                        data-id="${escaparHTML(item.id)}"
                        title="Eliminar serie">
                        <i data-lucide="trash-2"></i>
                    </button>
                </td>
            `;

            tablaTRD.appendChild(fila);
        });

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    // -------------------------------------------------
    // 9. CREAR MODAL
    // -------------------------------------------------

    function crearModal() {

        if (document.getElementById("modalTRD")) return;

        const modal = document.createElement("div");

        modal.id = "modalTRD";

        modal.innerHTML = `
            <div class="modal-trd-contenido">

                <div class="modal-trd-header">
                    <h2 id="tituloModalTRD">Nueva Serie TRD</h2>

                    <button type="button" id="cerrarModalTRD">
                        &times;
                    </button>
                </div>

                <form id="formularioTRD">

                    <div class="campo-trd">
                        <label for="codigoTRD">Código de Serie *</label>
                        <input type="text" id="codigoTRD"
                            placeholder="Ej: 500" required>
                    </div>

                    <div class="campo-trd">
                        <label for="nombreSerieTRD">Nombre de la Serie *</label>
                        <input type="text" id="nombreSerieTRD"
                            placeholder="Nombre de la serie" required>
                    </div>

                    <div class="campo-trd">
                        <label for="codigoSubserieTRD">Código de Subserie *</label>
                        <input type="text" id="codigoSubserieTRD"
                            placeholder="Ej: 500.1" required>
                    </div>

                    <div class="campo-trd">
                        <label for="nombreSubserieTRD">Nombre de la Subserie *</label>
                        <input type="text" id="nombreSubserieTRD"
                            placeholder="Nombre de la subserie" required>
                    </div>

                    <div class="campo-trd">
                        <label for="dependenciaTRD">Dependencia *</label>
                        <select id="dependenciaTRD" required>
                            <option value="">Seleccione una dependencia</option>
                            <option value="gerencia">Gerencia / Dirección General</option>
                            <option value="juridica">Oficina Jurídica</option>
                            <option value="financiera">Gestión Financiera</option>
                            <option value="archivo">Archivo Central</option>
                        </select>
                    </div>

                    <div class="campo-trd">
                        <label for="retencionGestionTRD">
                            Retención en Archivo de Gestión (años) *
                        </label>
                        <input type="number" id="retencionGestionTRD"
                            min="0" required>
                    </div>

                    <div class="campo-trd">
                        <label for="retencionCentralTRD">
                            Retención en Archivo Central *
                        </label>
                        <input type="text" id="retencionCentralTRD"
                            placeholder="Ej: 20 o Indefinido" required>
                    </div>

                    <div class="campo-trd">
                        <label for="disposicionTRD">Disposición Final *</label>
                        <select id="disposicionTRD" required>
                            <option value="">Seleccione disposición</option>
                            <option value="CT">Conservación Total (CT)</option>
                            <option value="S">Selección (S)</option>
                            <option value="E">Eliminación (E)</option>
                            <option value="M">Medio tecnológico (MT)</option>
                        </select>
                    </div>

                    <div class="campo-trd campo-trd-completo">
                        <label for="observacionesTRD">Observaciones</label>
                        <textarea id="observacionesTRD" rows="3"
                            placeholder="Información adicional de la serie documental"></textarea>
                    </div>

                    <div class="acciones-modal-trd">
                        <button type="button" class="btn-secundario"
                            id="cancelarModalTRD">
                            Cancelar
                        </button>

                        <button type="submit" class="btn-primario">
                            Guardar TRD
                        </button>
                    </div>

                </form>
            </div>
        `;

        document.body.appendChild(modal);

        const estilos = document.createElement("style");

        estilos.textContent = `
            #modalTRD {
                position: fixed;
                inset: 0;
                background: rgba(15, 35, 60, .55);
                display: none;
                align-items: center;
                justify-content: center;
                padding: 20px;
                z-index: 9999;
                overflow-y: auto;
            }

            .modal-trd-contenido {
                background: #fff;
                width: 100%;
                max-width: 720px;
                padding: 25px;
                border-radius: 12px;
                box-shadow: 0 10px 35px rgba(0,0,0,.2);
                max-height: 90vh;
                overflow-y: auto;
            }

            .modal-trd-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .modal-trd-header h2 {
                font-size: 20px;
                color: #2563A6;
                margin: 0;
            }

            #cerrarModalTRD {
                border: 0;
                background: transparent;
                font-size: 28px;
                cursor: pointer;
            }

            #formularioTRD {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 15px;
            }

            .campo-trd {
                display: flex;
                flex-direction: column;
                gap: 7px;
            }

            .campo-trd label {
                font-size: 13px;
                font-weight: 600;
            }

            .campo-trd input,
            .campo-trd select,
            .campo-trd textarea {
                width: 100%;
                padding: 11px;
                border: 1px solid #D5DDE8;
                border-radius: 7px;
                font: inherit;
                box-sizing: border-box;
            }

            .campo-trd-completo,
            .acciones-modal-trd {
                grid-column: 1 / -1;
            }

            .acciones-modal-trd {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 10px;
            }

            @media(max-width: 600px) {
                #formularioTRD {
                    grid-template-columns: 1fr;
                }

                .campo-trd-completo,
                .acciones-modal-trd {
                    grid-column: auto;
                }
            }
        `;

        document.head.appendChild(estilos);

        document.getElementById("cerrarModalTRD")
            .addEventListener("click", cerrarModal);

        document.getElementById("cancelarModalTRD")
            .addEventListener("click", cerrarModal);

        document.getElementById("formularioTRD")
            .addEventListener("submit", guardarRegistroTRD);
    }

    // -------------------------------------------------
    // 10. ABRIR Y CERRAR MODAL
    // -------------------------------------------------

    function abrirModal() {
        crearModal();

        document.getElementById("tituloModalTRD").textContent =
            trdEditando ? "Editar Serie TRD" : "Nueva Serie TRD";

        document.getElementById("modalTRD").style.display = "flex";
    }

    function cerrarModal() {
        const modal = document.getElementById("modalTRD");

        if (modal) {
            modal.style.display = "none";
        }

        trdEditando = null;
    }

    // -------------------------------------------------
    // 11. REGISTRAR NUEVA SERIE
    // -------------------------------------------------

    if (btnNuevaSerie) {
        btnNuevaSerie.addEventListener("click", () => {

            trdEditando = null;
            abrirModal();

            document.getElementById("formularioTRD").reset();
        });
    }

    // -------------------------------------------------
    // 12. GUARDAR Y EDITAR TRD
    // -------------------------------------------------

    function guardarRegistroTRD(evento) {

        evento.preventDefault();

        const codigo = document.getElementById("codigoTRD")
            .value.trim();

        const serie = document.getElementById("nombreSerieTRD")
            .value.trim();

        const codigoSubserie = document.getElementById("codigoSubserieTRD")
            .value.trim();

        const subserie = document.getElementById("nombreSubserieTRD")
            .value.trim();

        const dependencia = document.getElementById("dependenciaTRD").value;

        const retencionGestion = Number(
            document.getElementById("retencionGestionTRD").value
        );

        const retencionCentralTexto = document
            .getElementById("retencionCentralTRD")
            .value.trim();

        const retencionCentral = /^indefinido$/i.test(retencionCentralTexto)
            ? "Indefinido"
            : Number(retencionCentralTexto);

        const disposicion = document.getElementById("disposicionTRD").value;

        const observaciones = document.getElementById("observacionesTRD")
            .value.trim();

        if (
            !codigo || !serie || !codigoSubserie || !subserie ||
            !dependencia || !Number.isFinite(retencionGestion) ||
            retencionGestion < 0 || !retencionCentralTexto ||
            (retencionCentral !== "Indefinido" &&
                (!Number.isFinite(retencionCentral) || retencionCentral < 0)) ||
            !disposicion
        ) {
            mostrarMensaje("Verifique los campos obligatorios.", "error");
            return;
        }

        // Validar estructura de los códigos
        if (!/^\d+$/.test(codigo) ||
            !new RegExp("^" + codigo + "\\.\\d+$").test(codigoSubserie)) {

            mostrarMensaje(
                "El código de subserie debe comenzar con el código de su serie. Ejemplo: 500 y 500.1.",
                "error"
            );
            return;
        }

        const datos = obtenerTRD();

        const codigoDuplicado = datos.some(item =>
            item.codigoSubserie.toLowerCase() === codigoSubserie.toLowerCase() &&
            item.id !== trdEditando
        );

        if (codigoDuplicado) {
            mostrarMensaje(
                "Ya existe una subserie con ese código.",
                "error"
            );
            return;
        }

        const registro = {
            id: trdEditando || "TRD-" + Date.now(),
            codigo,
            serie,
            codigoSubserie,
            subserie,
            dependencia,
            retencionGestion,
            retencionCentral,
            disposicion,
            observaciones,
            fechaActualizacion: new Date().toISOString(),
            usuarioResponsable: sesion.nombre || sesion.usuario
        };

        if (trdEditando) {

            const indice = datos.findIndex(item =>
                item.id === trdEditando
            );

            if (indice >= 0) {
                datos[indice] = registro;
            }

        } else {
            registro.fechaRegistro = new Date().toISOString();
            datos.push(registro);
        }

        guardarTRD(datos);

        cerrarModal();
        mostrarTRD();

        mostrarMensaje(
            trdEditando
                ? "Registro TRD actualizado correctamente."
                : "Nueva serie y subserie TRD registrada correctamente.",
            "exito"
        );
    }

    // -------------------------------------------------
    // 13. VER DETALLE DE TRD
    // -------------------------------------------------

    function verDetalle(id) {

        const item = obtenerTRD().find(registro =>
            registro.id === id
        );

        if (!item) return;

        const radicadosRelacionados = obtenerRadicaciones().filter(radicado =>
            String(radicado.serieTrd) === String(item.codigo) &&
            String(radicado.subserieTrd) === String(item.codigoSubserie)
        );

        alert(
            "DETALLE DE TABLA DE RETENCIÓN DOCUMENTAL\n\n" +
            "Código: " + item.codigo + "\n" +
            "Serie: " + item.serie + "\n" +
            "Código de subserie: " + item.codigoSubserie + "\n" +
            "Subserie: " + item.subserie + "\n" +
            "Dependencia: " + nombreDependencia(item.dependencia) + "\n" +
            "Archivo de Gestión: " + textoRetencion(item.retencionGestion) + "\n" +
            "Archivo Central: " + textoRetencion(item.retencionCentral) + "\n" +
            "Disposición: " + textoDisposicion(item.disposicion) + "\n" +
            "Radicados asociados: " + radicadosRelacionados.length + "\n" +
            "Observaciones: " + (item.observaciones || "Sin observaciones")
        );
    }

    // -------------------------------------------------
    // 14. EDITAR TRD
    // -------------------------------------------------

    function editarTRD(id) {

        const item = obtenerTRD().find(registro =>
            registro.id === id
        );

        if (!item) return;

        trdEditando = id;

        abrirModal();

        document.getElementById("codigoTRD").value = item.codigo;
        document.getElementById("nombreSerieTRD").value = item.serie;
        document.getElementById("codigoSubserieTRD").value = item.codigoSubserie;
        document.getElementById("nombreSubserieTRD").value = item.subserie;
        document.getElementById("dependenciaTRD").value = item.dependencia;
        document.getElementById("retencionGestionTRD").value = item.retencionGestion;
        document.getElementById("retencionCentralTRD").value = item.retencionCentral;
        document.getElementById("disposicionTRD").value = item.disposicion;
        document.getElementById("observacionesTRD").value = item.observaciones || "";
    }

    // -------------------------------------------------
    // 15. ELIMINAR TRD
    // -------------------------------------------------

    function eliminarTRD(id) {

        const datos = obtenerTRD();

        const item = datos.find(registro =>
            registro.id === id
        );

        if (!item) return;

        const radicadosRelacionados = obtenerRadicaciones().filter(radicado =>
            String(radicado.serieTrd) === String(item.codigo) &&
            String(radicado.subserieTrd) === String(item.codigoSubserie)
        );

        if (radicadosRelacionados.length > 0) {
            mostrarMensaje(
                "No se puede eliminar esta subserie porque tiene radicados asociados.",
                "error"
            );
            return;
        }

        const confirmar = confirm(
            `¿Está seguro de eliminar la subserie ${item.codigoSubserie} - ${item.subserie}?`
        );

        if (!confirmar) return;

        const nuevosDatos = datos.filter(registro =>
            registro.id !== id
        );

        guardarTRD(nuevosDatos);
        mostrarTRD();

        mostrarMensaje(
            "Registro TRD eliminado correctamente.",
            "exito"
        );
    }

    // -------------------------------------------------
    // 16. ACCIONES DE LA TABLA
    // -------------------------------------------------

    tablaTRD.addEventListener("click", evento => {

        const boton = evento.target.closest("button[data-accion]");

        if (!boton) return;

        const accion = boton.dataset.accion;
        const id = boton.dataset.id;

        if (accion === "ver") {
            verDetalle(id);
        }

        if (accion === "editar") {
            editarTRD(id);
        }

        if (accion === "eliminar") {
            eliminarTRD(id);
        }
    });

    // -------------------------------------------------
    // 17. BUSCADOR Y FILTRO
    // -------------------------------------------------

    if (buscarTRD) {
        buscarTRD.addEventListener("input", mostrarTRD);
    }

    if (filtroDep) {
        filtroDep.addEventListener("change", mostrarTRD);
    }

    // -------------------------------------------------
    // 18. CERRAR SESIÓN
    // -------------------------------------------------

    if (btnCerrarSesion) {

        btnCerrarSesion.addEventListener("click", evento => {

            evento.preventDefault();

            if (confirm("¿Desea cerrar la sesión de ARCHIVEX?")) {
                localStorage.removeItem("archivex_sesion");
                window.location.href = "../acceso/login.html";
            }
        });
    }

    // -------------------------------------------------
    // 19. INICIAR MÓDULO
    // -------------------------------------------------

    mostrarTRD();

});
