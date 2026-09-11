// ============================================================
// VISOR FISICO DE PLAYAS / BLOQUES / CARRILES
// ============================================================
// La vista representa el patio como columnas contiguas.
// Playa comun: cada carril fisico tiene 2 posiciones y el carril
// visible es impar (1,3,5...). Las posiciones se numeran de forma
// continua: Carril 1 -> posiciones 1 y 2; Carril 3 -> 3 y 4.
// Playa especial: carriles 1,2,3... y 5 posiciones por carril.
//
// Se muestran 25 carriles por pagina. Las flechas laterales cambian
// de pagina. Los encabezados NO son clickeables; solo las posiciones.
// ============================================================

const CARRILES_POR_PAGINA = 25;
let paginaCarriles = 0;

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
        if (p && p.bloques.some(b => b.nombre === bloqueAnterior)) {
            bloqueSelect.value = bloqueAnterior;
        } else if (p && p.bloques.some(b => b.nombre === "A")) {
            bloqueSelect.value = "A";
        }
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
    const inicio = paginaCarriles * CARRILES_POR_PAGINA;
    const fin = Math.min(inicio + CARRILES_POR_PAGINA, totalCarriles);
    const paginas = Math.max(1, Math.ceil(totalCarriles / CARRILES_POR_PAGINA));
    if (paginaCarriles >= paginas) paginaCarriles = paginas - 1;

    document.getElementById("bloqueActivoTitle").textContent = `${playa} · Bloque ${bloque} · ${bloqueObj.tipo === "especial" ? "5 posiciones/carril" : "2 posiciones/carril"}`;

    grid.innerHTML = "";
    grid.className = "grid-posiciones visor-carriles";

    const tabla = document.createElement("div");
    tabla.className = "carriles-tabla";

    const izquierda = crearFlechaCarriles("◀", paginaCarriles > 0, -1);
    const derecha = crearFlechaCarriles("▶", paginaCarriles < paginas - 1, 1);
    tabla.appendChild(izquierda);

    const carriles = document.createElement("div");
    carriles.className = "carriles-pagina";

    for (let i = inicio; i < fin; i++) {
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

    tabla.appendChild(carriles);
    tabla.appendChild(crearFlechaCarriles("▶", paginaCarriles < paginas - 1, 1));
    grid.appendChild(tabla);

    const paginador = document.createElement("div");
    paginador.className = "paginador-carriles";
    paginador.innerHTML = `<span>Carriles ${inicio + 1}–${fin} de ${totalCarriles}</span><span>Página ${paginaCarriles + 1} de ${paginas}</span>`;
    grid.appendChild(paginador);

    actualizarEstadisticas(playa, bloque);
}

function crearFlechaCarriles(simbolo, habilitada, delta) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "flecha-carriles";
    boton.textContent = simbolo;
    boton.disabled = !habilitada;
    boton.title = delta < 0 ? "Carriles anteriores" : "Siguientes carriles";
    boton.onclick = () => { paginaCarriles += delta; renderizarLayout(); };
    return boton;
}

function crearCeldaPosicion(bloque, pos, numeroVisible, bloqueado = false) {
    const celda = document.createElement("button");
    celda.type = "button";
    celda.className = `celda-posicion compacta ${bloqueado ? "celda-bloqueada" : pos?.ocupada ? "celda-ocupada" : "celda-libre"}`;
    celda.disabled = bloqueado;

    if (bloqueado) {
        celda.innerHTML = `<strong>—</strong><small>BLOQ.</small>`;
        celda.title = "Carril bloqueado";
        return celda;
    }

    const v = pos?.ocupada ? buscarVehiculo(pos.chasis) : null;
    celda.innerHTML = `<strong>${numeroVisible}</strong><small>${v ? v.chasis.slice(-6) : "LIBRE"}</small>`;
    celda.title = v ? `${v.chasis} · ${v.marca || ""} ${v.modelo || ""}` : "Disponible · click para seleccionar esta ubicación";

    if (pos?.ocupada) {
        celda.onclick = () => mostrarDetallesVehiculo(pos.chasis);
    } else if (pos) {
        celda.onclick = () => seleccionarPosicionDesdeVisor(pos);
    }
    return celda;
}

function seleccionarPosicionDesdeVisor(pos) {
    const vSel = INVENTARIO.vehiculoSeleccionado;
    if (!vSel) return mostrarToast("Primero escaneá o seleccioná un vehículo", "warning");

    // La selección manual NO asigna todavía. Cambia la sugerencia de la pantalla
    // principal y deja que el operador confirme con el botón de asignación.
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

document.addEventListener("DOMContentLoaded", () => {
    document.querySelector(".close")?.addEventListener("click", () => document.getElementById("modalDetalles").style.display = "none");
    window.addEventListener("click", e => { if (e.target === document.getElementById("modalDetalles")) document.getElementById("modalDetalles").style.display = "none"; });
});
