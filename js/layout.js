// ============================================================
// VISOR FISICO DE PLAYAS / BLOQUES / CARRILES
// ============================================================
// Playa comun: carriles fisicos continuos identificados 1,3,5...
// y cada carril tiene dos posiciones de chasis consecutivas:
// Carril 1 -> posiciones 1 y 2; Carril 3 -> 3 y 4; etc.
// Playa especial: carriles 1,2,3... y 5 posiciones por carril.
//
// El visor es ADAPTATIVO: calcula cuantas columnas entran en el ancho
// real disponible (TV, PC, tablet o celular). Las flechas avanzan ese
// mismo numero de columnas, no una cantidad fija.
// ============================================================

const ANCHO_MIN_CARRIL = 42;
const CARRILES_MAX_VISIBLES = 25;
let paginaCarriles = 0;
let carrilesPorVistaActual = CARRILES_MAX_VISIBLES;

function actualizarSelectoresPlayas() {
    const playaSelect = document.getElementById("playaSelect");
    const bloqueSelect = document.getElementById("bloqueSelect");
    if (!playaSelect || !bloqueSelect) return;

    const playaAnterior = playaSelect.value;
    const bloqueAnterior = bloqueSelect.value;
    playaSelect.innerHTML = '<option value="">Seleccionar playa...</option>' + PLAYAS_CONFIG.map(p => `<option value="${p.playa}">${p.playa}${p.tipo === "especial" ? " · Especial" : ""}</option>`).join("");
    if (PLAYAS_CONFIG.some(p => p.playa === playaAnterior)) playaSelect.value = playaAnterior;

    const actualizarBloques = () => {
        const p = obtenerConfigPlaya(playaSelect.value);
        bloqueSelect.innerHTML = '<option value="">Seleccionar bloque...</option>' + (p ? p.bloques.map(b => `<option value="${b.nombre}">${b.nombre}</option>`).join("") : "");
        if (p && p.bloques.some(b => b.nombre === bloqueAnterior)) bloqueSelect.value = bloqueAnterior;
        else if (p && p.bloques.some(b => b.nombre === "A")) bloqueSelect.value = "A";
        paginaCarriles = 0;
        renderizarLayout();
    };

    playaSelect.onchange = actualizarBloques;
    bloqueSelect.onchange = () => { paginaCarriles = 0; renderizarLayout(); };
    actualizarBloques();
}

function obtenerNumeroCarrilVisible(bloqueObj, indiceFisico) {
    return bloqueObj.tipo === "especial" ? indiceFisico + 1 : (indiceFisico * 2) + 1;
}

function obtenerPosicionPorCarril(bloqueObj, carril, posicion) {
    return bloqueObj.posiciones[`C${carril}_P${posicion}`] || null;
}

function calcularCarrilesPorVista() {
    const tabla = document.querySelector(".carriles-tabla");
    if (!tabla) return CARRILES_MAX_VISIBLES;
    const ancho = tabla.clientWidth;
    // Reservamos espacio para las dos flechas laterales y usamos una
    // celda minima compacta. En pantallas grandes nunca mostramos mas de 25.
    const anchoDisponible = Math.max(180, ancho - 76);
    return Math.max(1, Math.min(CARRILES_MAX_VISIBLES, Math.floor(anchoDisponible / ANCHO_MIN_CARRIL)));
}

function renderizarLayout() {
    const playa = document.getElementById("playaSelect")?.value;
    const bloque = document.getElementById("bloqueSelect")?.value;
    const grid = document.getElementById("gridActivo");
    if (!grid) return;

    if (!playa || !bloque) {
        grid.innerHTML = '<div class="empty-state">Seleccioná una playa y un bloque para visualizar las posiciones.</div>';
        actualizarEstadisticas(playa, bloque);
        return;
    }

    const bloqueObj = INVENTARIO.bloques[claveBloque(playa, bloque)];
    const configBloque = obtenerConfigBloque(playa, bloque);
    if (!bloqueObj || !configBloque) return;

    const totalCarriles = Number(configBloque.carriles || 100);
    grid.innerHTML = "";
    grid.className = "grid-posiciones visor-carriles";

    const tabla = document.createElement("div");
    tabla.className = "carriles-tabla";
    grid.appendChild(tabla);

    // Medimos el ancho disponible y calculamos cuantos carriles caben.
    const anchoTotal = grid.clientWidth || grid.parentElement?.clientWidth || 800;
    const anchoDisponible = Math.max(180, anchoTotal - 70);
    carrilesPorVistaActual = Math.max(1, Math.min(CARRILES_MAX_VISIBLES, Math.floor(anchoDisponible / ANCHO_MIN_CARRIL)));

    const viewport = document.createElement("div");
    viewport.className = "carriles-viewport";
    const carriles = document.createElement("div");
    carriles.className = "carriles-pagina carriles-todos";

    // Todos los carriles se mantienen en un unico tablero horizontal. De esta
    // forma el scroll inferior permite recorrerlos libremente y las flechas
    // avanzan exactamente la cantidad que entra en la pantalla.
    const anchoColumna = Math.max(ANCHO_MIN_CARRIL, Math.floor(anchoDisponible / carrilesPorVistaActual));
    carriles.style.gridTemplateColumns = `repeat(${totalCarriles}, ${anchoColumna}px)`;
    carriles.style.width = `${totalCarriles * anchoColumna}px`;

    for (let i = 0; i < totalCarriles; i++) {
        const carril = obtenerNumeroCarrilVisible(bloqueObj, i);
        const bloqueado = bloqueObj.carrilesBloqueados.includes(Number(carril));
        const columna = document.createElement("div");
        columna.className = `carril-columna ${bloqueado ? "carril-bloqueado" : ""}`;

        const titulo = document.createElement("div");
        titulo.className = "carril-label";
        titulo.textContent = `CARRIL ${carril}`;
        columna.appendChild(titulo);

        const posiciones = document.createElement("div");
        posiciones.className = "carril-posiciones";
        const cantidad = bloqueObj.posicionesPorCarril;
        for (let posNumero = 1; posNumero <= cantidad; posNumero++) {
            const pos = obtenerPosicionPorCarril(bloqueObj, carril, posNumero);
            const numeroVisible = bloqueObj.tipo === "especial" ? posNumero : (i * 2) + posNumero;
            posiciones.appendChild(crearCeldaPosicion(bloqueObj, pos, numeroVisible, bloqueado));
        }
        columna.appendChild(posiciones);
        carriles.appendChild(columna);
    }

    viewport.appendChild(carriles);
    tabla.appendChild(crearFlechaCarriles("◀", true, -1, viewport, carrilesPorVistaActual, totalCarriles));
    tabla.appendChild(viewport);
    tabla.appendChild(crearFlechaCarriles("▶", true, 1, viewport, carrilesPorVistaActual, totalCarriles));
    grid.appendChild(tabla);

    const paginador = document.createElement("div");
    paginador.className = "paginador-carriles";
    const actualizarTexto = () => {
        const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
        const indice = maxScroll ? Math.round((viewport.scrollLeft / maxScroll) * (totalCarriles - carrilesPorVistaActual)) : 0;
        const inicio = Math.min(Math.max(0, indice), Math.max(0, totalCarriles - carrilesPorVistaActual));
        const fin = Math.min(totalCarriles, inicio + carrilesPorVistaActual);
        paginador.innerHTML = `<span>Carriles ${inicio + 1}–${fin} de ${totalCarriles}</span><span>${carrilesPorVistaActual} visibles · scroll horizontal</span>`;
    };
    viewport.addEventListener("scroll", actualizarTexto, { passive: true });
    grid.appendChild(paginador);
    actualizarTexto();

    actualizarEstadisticas(playa, bloque);
}

function crearFlechaCarriles(simbolo, habilitada, delta, viewport, paso, totalCarriles) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "flecha-carriles";
    boton.textContent = simbolo;
    boton.disabled = !habilitada;
    boton.title = delta < 0 ? "Carriles anteriores" : "Siguientes carriles";
    boton.onclick = () => {
        if (!viewport) return;
        const distancia = viewport.clientWidth * delta;
        const destino = viewport.scrollLeft + distancia;
        viewport.scrollTo({ left: Math.max(0, destino), behavior: "smooth" });
    };
    return boton;
}

function crearCeldaPosicion(bloque, pos, numeroVisible, bloqueado = false) {
    const celda = document.createElement("button");
    celda.type = "button";
    celda.className = `celda-posicion compacta ${bloqueado ? "celda-bloqueada" : pos?.ocupada ? "celda-ocupada" : "celda-libre"}`;
    celda.disabled = bloqueado;

    if (bloqueado) {
        celda.innerHTML = `<strong>—</strong>`;
        celda.title = `Carril ${pos?.carril ?? ""} · bloqueado`;
        celda.setAttribute("aria-label", celda.title);
        return celda;
    }

    const v = pos?.ocupada ? buscarVehiculo(pos.chasis) : null;
    const estado = v ? "Ocupado" : "Libre";
    celda.innerHTML = `<strong>${numeroVisible}</strong>`;
    // Tooltip: al pasar el mouse/tocar prolongadamente se ve Carril, Posición y estado.
    celda.title = `Carril ${pos.carril} · Posición ${pos.posicion} · ${estado}${v ? ` · ${v.chasis}` : ""}`;
    celda.setAttribute("aria-label", celda.title);

    if (pos?.ocupada) celda.onclick = () => mostrarDetallesVehiculo(pos.chasis);
    else if (pos) celda.onclick = () => seleccionarPosicionDesdeVisor(pos);
    return celda;
}

function seleccionarPosicionDesdeVisor(pos) {
    const vSel = INVENTARIO.vehiculoSeleccionado;
    if (!vSel) return mostrarToast("Primero escaneá o seleccioná un vehículo", "warning");

    INVENTARIO.posicionPendiente = pos;
    actualizarPanelVehiculo();
    const box = document.getElementById("sugerenciaAsignacion");
    if (box) {
        box.innerHTML = `<strong>Ubicación seleccionada:</strong> ${pos.playa} · ${pos.bloque} · Carril ${pos.carril} · Posición ${pos.posicion}`;
        box.classList.add("visible");
        box.classList.remove("warning-box");
    }
    const button = document.getElementById("btnAsignarSugerida");
    if (button) {
        button.style.display = "inline-flex";
        button.textContent = "Confirmar ubicación seleccionada";
        button.onclick = () => {
            const r = asignarVehiculoAPosicion(vSel, pos.playa, pos.bloque, pos.carril, pos.posicion);
            if (r.ok) {
                INVENTARIO.posicionPendiente = null;
                actualizarPanelVehiculo();
                renderizarTodo();
                mostrarToast("Ubicación asignada correctamente", "success");
            } else mostrarToast(r.error, "error");
        };
    }
}

function actualizarEstadisticas(playa, bloque) {
    const obj = playa && bloque ? INVENTARIO.bloques[claveBloque(playa, bloque)] : null;
    const capacidad = obj ? Object.keys(obj.posiciones).length : 0;
    const ocupados = obj ? Object.values(obj.posiciones).filter(p => p.ocupada).length : 0;
    document.getElementById("statCapacidad").textContent = capacidad;
    document.getElementById("statLibres").textContent = capacidad - ocupados;
    document.getElementById("statOcupados").textContent = ocupados;
}

function actualizarResumenGeneral() {
    const total = Object.keys(INVENTARIO.posiciones).length;
    const ocupadas = Object.values(INVENTARIO.posiciones).filter(p => p.ocupada).length;
    const rv = document.getElementById("resumenVehiculos");
    const rl = document.getElementById("resumenLibres");
    const ro = document.getElementById("resumenOcupadas");
    if (rv) rv.textContent = INVENTARIO.vehiculos.length;
    if (rl) rl.textContent = total - ocupadas;
    if (ro) ro.textContent = ocupadas;
}

function mostrarDetallesVehiculo(chasis) {
    const v = buscarVehiculo(chasis);
    if (!v) return;
    INVENTARIO.vehiculoSeleccionado = v;
    actualizarPanelVehiculo();
    const modal = document.getElementById("modalDetalles");
    document.getElementById("detallesVehiculo").innerHTML = `
      <div class="detail-grid">
        <div><span>VIN / Chasis</span><strong>${v.chasis}</strong></div>
        <div><span>Marca</span><strong>${v.marca || "-"}</strong></div>
        <div><span>Modelo</span><strong>${v.modelo || "-"}</strong></div>
        <div><span>Ubicación</span><strong>${v.posicionAsignada ? `${v.playa} · ${v.bloque} · Carril ${v.carril} · Posición ${v.posicion}` : "Sin asignar"}</strong></div>
      </div>`;
    modal.style.display = "flex";
}

function cerrarModalDetalles() {
    const modal = document.getElementById("modalDetalles");
    if (modal) modal.style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector("#modalDetalles .close")?.addEventListener("click", cerrarModalDetalles);
    window.addEventListener("resize", () => {
        if (document.getElementById("playaSelect")?.value && document.getElementById("bloqueSelect")?.value) {
            renderizarLayout();
        }
    });
});
