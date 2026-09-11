// ============================================================
// VISOR DE PLAYAS / BLOQUES / POSICIONES
// ============================================================

function actualizarSelectoresPlayas() {
    const playaSelect = document.getElementById("playaSelect");
    const bloqueSelect = document.getElementById("bloqueSelect");
    if (!playaSelect || !bloqueSelect) return;

    const playaAnterior = playaSelect.value;
    playaSelect.innerHTML = '<option value="">Seleccionar playa...</option>' + PLAYAS_CONFIG.map(p => `<option value="${p.playa}">${p.playa}${p.tipo === "especial" ? " · Especial" : ""}</option>`).join("");
    if (PLAYAS_CONFIG.some(p => p.playa === playaAnterior)) playaSelect.value = playaAnterior;

    const actualizarBloques = () => {
        const p = obtenerConfigPlaya(playaSelect.value);
        bloqueSelect.innerHTML = '<option value="">Seleccionar bloque...</option>' + (p ? p.bloques.map(b => `<option value="${b.nombre}">${b.nombre}</option>`).join("") : "");
        if (p && INVENTARIO.bloques[claveBloque(p.playa, "A")]) bloqueSelect.value = "A";
        renderizarLayout();
    };

    playaSelect.onchange = actualizarBloques;
    bloqueSelect.onchange = renderizarLayout;
    actualizarBloques();
}

function renderizarLayout() {
    const playa = document.getElementById("playaSelect")?.value;
    const bloque = document.getElementById("bloqueSelect")?.value;
    const grid = document.getElementById("gridActivo");
    if (!grid) return;

    if (!playa || !bloque) {
        grid.innerHTML = '<div class="empty-state">Seleccioná una playa y un bloque para visualizar las posiciones.</div>';
        document.getElementById("gridReferencia")?.replaceChildren();
        actualizarEstadisticas(playa, bloque);
        return;
    }

    const bloqueObj = INVENTARIO.bloques[claveBloque(playa, bloque)];
    if (!bloqueObj) return;

    document.getElementById("bloqueActivoTitle").textContent = `${playa} · Bloque ${bloque} · ${bloqueObj.tipo === "especial" ? "5 posiciones/carril" : "2 posiciones/carril"}`;
    const referencia = document.getElementById("bloqueReferencia");
    referencia.style.display = "none";
    document.getElementById("gridReferencia").replaceChildren();

    grid.innerHTML = "";
    Object.values(bloqueObj.posiciones).forEach(pos => grid.appendChild(crearCeldaPosicion(bloqueObj, pos)));
    actualizarEstadisticas(playa, bloque);
}

function crearCeldaPosicion(bloque, pos) {
    const celda = document.createElement("button");
    celda.type = "button";
    celda.className = `celda-posicion ${pos.ocupada ? "celda-ocupada" : "celda-libre"}`;
    const v = pos.ocupada ? buscarVehiculo(pos.chasis) : null;
    celda.innerHTML = `<strong>C${pos.carril}-P${pos.posicion}</strong>${v ? `<small>${v.chasis.slice(-6)}</small>` : "<small>LIBRE</small>"}`;
    celda.title = pos.ocupada ? `${pos.chasis} · ${v?.marca || ""} ${v?.modelo || ""}` : "Disponible · click para asignar el vehículo seleccionado";

    if (pos.ocupada) {
        celda.onclick = () => mostrarDetallesVehiculo(pos.chasis);
    } else {
        celda.onclick = () => {
            const vSel = INVENTARIO.vehiculoSeleccionado;
            if (!vSel) return mostrarToast("Primero escaneá o seleccioná un vehículo", "warning");
            const r = asignarVehiculoAPosicion(vSel, bloque.playa, bloque.bloque, pos.carril, pos.posicion);
            if (r.ok) {
                actualizarPanelVehiculo();
                renderizarLayout();
                mostrarToast(`Asignado a ${bloque.playa}-${bloque.bloque} · C${pos.carril}-P${pos.posicion}`, "success");
            } else mostrarToast(r.error, "error");
        };
    }
    return celda;
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
        <div><span>Ubicación</span><strong>${v.posicionAsignada ? `${v.playa} · ${v.bloque} · C${v.carril}-P${v.posicion}` : "Sin asignar"}</strong></div>
      </div>`;
    modal.style.display = "flex";
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".close")?.addEventListener("click", () => document.getElementById("modalDetalles").style.display = "none");
    window.addEventListener("click", e => { if (e.target === document.getElementById("modalDetalles")) document.getElementById("modalDetalles").style.display = "none"; });
});
