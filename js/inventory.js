// ============================================================
// INVENTARIO Y MOTOR DE POSICIONES
// ============================================================
// La base de posiciones NO se carga desde Excel: se genera desde
// data/config_playas.js al iniciar la aplicacion.
// Los vehiculos y sus posiciones se persisten en localStorage.
// ============================================================

window.INVENTARIO = {
    vehiculos: [],
    posiciones: {},
    playas: {},
    bloques: {},
    vehiculoSeleccionado: null,
    modo: "nuevos"
};

const STORAGE_KEY = "controlTotalInventarioV2";

function claveBloque(playa, bloque) {
    return `${playa}__${bloque}`;
}

function clavePosicion(playa, bloque, carril, posicion) {
    return `${claveBloque(playa, bloque)}__C${carril}_P${posicion}`;
}

function inicializarEstructuraPlayas() {
    INVENTARIO.posiciones = {};
    INVENTARIO.playas = {};
    INVENTARIO.bloques = {};

    PLAYAS_CONFIG.forEach(configPlaya => {
        INVENTARIO.playas[configPlaya.playa] = configPlaya;
        configPlaya.bloques.forEach(configBloque => {
            const key = claveBloque(configPlaya.playa, configBloque.nombre);
            const cantidadCarriles = Number(configBloque.carriles || configPlaya.carrilesPorDefecto || 100);
            const especial = configPlaya.tipo === "especial";
            const posicionesPorCarril = especial ? 5 : 2;
            const bloque = {
                playa: configPlaya.playa,
                bloque: configBloque.nombre,
                tipo: configPlaya.tipo,
                carriles: cantidadCarriles,
                posicionesPorCarril,
                carrilesBloqueados: Array.isArray(configBloque.carrilesBloqueados) ? configBloque.carrilesBloqueados.map(Number) : [],
                posiciones: {}
            };

            // Comun: 100 carriles fisicos => 1,3,5,...199.
            // Especial: 100 carriles => 1..100.
            for (let i = 0; i < cantidadCarriles; i++) {
                const carril = especial ? i + 1 : (i * 2) + 1;
                if (bloque.carrilesBloqueados.includes(carril)) continue;
                for (let posicion = 1; posicion <= posicionesPorCarril; posicion++) {
                    const posKey = `C${carril}_P${posicion}`;
                    const pos = { playa: configPlaya.playa, bloque: configBloque.nombre, carril, posicion, ocupada: false, chasis: null };
                    bloque.posiciones[posKey] = pos;
                    INVENTARIO.posiciones[clavePosicion(configPlaya.playa, configBloque.nombre, carril, posicion)] = pos;
                }
            }
            INVENTARIO.bloques[key] = bloque;
        });
    });
}

function normalizarTexto(valor) {
    return String(valor ?? "").trim();
}

function obtenerFilaNormalizada(row) {
    const get = (...keys) => {
        for (const k of keys) if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") return row[k];
        return "";
    };
    return {
        chasis: normalizarTexto(get("Numero de chasis", "Chasis", "VIN", "Vin", "vin", "chasis")),
        marca: normalizarTexto(get("Marca", "marca")),
        modelo: normalizarTexto(get("Modelo", "modelo")),
        playa: normalizarTexto(get("Playa", "playa")),
        bloque: normalizarTexto(get("Bloque", "bloque")),
        carril: normalizarTexto(get("Carril", "carril")),
        posicion: normalizarTexto(get("Posicion", "Posición", "posicion", "posición"))
    };
}

function limpiarPosicionDeVehiculo(v) {
    if (!v || !v.playa || !v.bloque || !v.carril || !v.posicion) return;
    const pos = INVENTARIO.posiciones[clavePosicion(v.playa, v.bloque, v.carril, v.posicion)];
    if (pos && pos.chasis === v.chasis) {
        pos.ocupada = false;
        pos.chasis = null;
    }
}

function ocuparPosicion(v, playa, bloque, carril, posicion) {
    const pos = INVENTARIO.posiciones[clavePosicion(playa, bloque, carril, posicion)];
    if (!pos || pos.ocupada) return false;
    pos.ocupada = true;
    pos.chasis = v.chasis;
    v.playa = playa;
    v.bloque = bloque;
    v.carril = Number(carril);
    v.posicion = Number(posicion);
    v.posicionAsignada = true;
    return true;
}

function cargarInventarioPersistido() {
    try {
        const guardado = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (!guardado) return;
        INVENTARIO.vehiculos = Array.isArray(guardado.vehiculos) ? guardado.vehiculos : [];
        INVENTARIO.vehiculos.forEach(v => {
            if (v.posicionAsignada && v.playa && v.bloque && v.carril && v.posicion) {
                const pos = INVENTARIO.posiciones[clavePosicion(v.playa, v.bloque, v.carril, v.posicion)];
                if (pos && !pos.ocupada) {
                    pos.ocupada = true;
                    pos.chasis = v.chasis;
                } else {
                    v.posicionAsignada = false;
                }
            }
        });
    } catch (e) {
        console.warn("No se pudo recuperar el inventario persistido", e);
    }
}

function guardarInventario() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ vehiculos: INVENTARIO.vehiculos }));
}

function buscarVehiculo(chasis) {
    const normal = normalizarTexto(chasis).toUpperCase();
    return INVENTARIO.vehiculos.find(v => normalizarTexto(v.chasis).toUpperCase() === normal) || null;
}

function buscarVehiculosPorChasisParcial(texto) {
    const q = normalizarTexto(texto).toUpperCase();
    return INVENTARIO.vehiculos.filter(v => normalizarTexto(v.chasis).toUpperCase().includes(q));
}

function obtenerMapeo(v) {
    if (!v) return null;
    const marca = normalizarTexto(v.marca).toLowerCase();
    const modelo = normalizarTexto(v.modelo).toLowerCase();
    return MAPEO_MODELOS_PLAYAS.find(m => m.marca.toLowerCase() === marca && m.modelo.toLowerCase() === modelo)
        || MAPEO_MODELOS_PLAYAS.find(m => m.marca.toLowerCase() === marca && m.modelo.toLowerCase() === "todos");
}

function obtenerPosicionesDisponibles(playa, bloque) {
    const b = INVENTARIO.bloques[claveBloque(playa, bloque)];
    if (!b) return [];
    return Object.values(b.posiciones).filter(p => !p.ocupada);
}

function obtenerPrimeraPosicionDisponible(playa, bloque) {
    return obtenerPosicionesDisponibles(playa, bloque)[0] || null;
}

function sugerirPosicion(v) {
    const mapeo = obtenerMapeo(v);
    if (!mapeo) return { mapeo: null, posicion: null, alternativas: [] };
    const bloque = mapeo.bloqueDestino || (esPlayaEspecial(mapeo.playaDestino) ? mapeo.playaDestino : "");
    const disponibles = obtenerPosicionesDisponibles(mapeo.playaDestino, bloque);
    return { mapeo, posicion: disponibles[0] || null, alternativas: disponibles.slice(0, 20) };
}

function asignarVehiculoAPosicion(v, playa, bloque, carril, posicion) {
    if (!v) return { ok: false, error: "Vehículo no seleccionado" };
    const pos = INVENTARIO.posiciones[clavePosicion(playa, bloque, carril, posicion)];
    if (!pos) return { ok: false, error: "La posición no existe o está bloqueada" };
    if (pos.ocupada && pos.chasis !== v.chasis) return { ok: false, error: "La posición ya está ocupada" };

    limpiarPosicionDeVehiculo(v);
    pos.ocupada = true;
    pos.chasis = v.chasis;
    v.playa = playa;
    v.bloque = bloque;
    v.carril = Number(carril);
    v.posicion = Number(posicion);
    v.posicionAsignada = true;
    guardarInventario();
    return { ok: true, posicion: pos };
}

function agregarVehiculosNuevos(datos) {
    const resultados = { agregados: 0, existentes: 0, sinChasis: 0, errores: [] };
    datos.map(obtenerFilaNormalizada).forEach(row => {
        if (!row.chasis) { resultados.sinChasis++; return; }
        const existente = buscarVehiculo(row.chasis);
        if (existente) {
            // Actualiza Marca/Modelo si Planta envio una version corregida.
            existente.marca = row.marca || existente.marca;
            existente.modelo = row.modelo || existente.modelo;
            resultados.existentes++;
            return;
        }
        INVENTARIO.vehiculos.push({
            chasis: row.chasis,
            marca: row.marca,
            modelo: row.modelo,
            playa: "",
            bloque: "",
            carril: "",
            posicion: "",
            posicionAsignada: false
        });
        resultados.agregados++;
    });
    guardarInventario();
    renderizarTodo();
    return resultados;
}

function procesarPlanillaScanner(datos) {
    const resultados = { actualizados: 0, reubicados: 0, nuevos: 0, conflictos: [], noEncontrados: [] };
    const filas = datos.map(obtenerFilaNormalizada).filter(r => r.chasis);

    filas.forEach(row => {
        let v = buscarVehiculo(row.chasis);
        if (!v) {
            // El scanner puede informar un vehiculo que todavia no estaba en la base.
            v = { chasis: row.chasis, marca: row.marca, modelo: row.modelo, playa: "", bloque: "", carril: "", posicion: "", posicionAsignada: false };
            INVENTARIO.vehiculos.push(v);
            resultados.nuevos++;
        }
        v.marca = row.marca || v.marca;
        v.modelo = row.modelo || v.modelo;
        resultados.actualizados++;

        if (!row.playa || !row.bloque || !row.carril || !row.posicion) return;
        const destino = INVENTARIO.posiciones[clavePosicion(row.playa, row.bloque, row.carril, row.posicion)];
        if (!destino) {
            resultados.conflictos.push({ chasis: v.chasis, motivo: "La ubicación no existe o el carril está bloqueado", destino: row });
            return;
        }
        if (destino.ocupada && destino.chasis !== v.chasis) {
            const alternativas = obtenerPosicionesDisponibles(row.playa, row.bloque).slice(0, 10);
            resultados.conflictos.push({ chasis: v.chasis, motivo: "La ubicación indicada está ocupada", destino: row, alternativas });
            return;
        }
        const cambio = v.posicionAsignada && (v.playa !== row.playa || String(v.bloque) !== String(row.bloque) || Number(v.carril) !== Number(row.carril) || Number(v.posicion) !== Number(row.posicion));
        limpiarPosicionDeVehiculo(v);
        ocuparPosicion(v, row.playa, row.bloque, row.carril, row.posicion);
        if (cambio) resultados.reubicados++;
    });

    guardarInventario();
    renderizarTodo();
    return resultados;
}

function renderizarTodo() {
    if (typeof actualizarSelectoresPlayas === "function") actualizarSelectoresPlayas();
    if (typeof renderizarLayout === "function") renderizarLayout();
    if (typeof actualizarPanelVehiculo === "function") actualizarPanelVehiculo();
    if (typeof actualizarResumenGeneral === "function") actualizarResumenGeneral();
}

// ------------------------------------------------------------
// Excel / CSV
// ------------------------------------------------------------
function leerArchivoTabla(file, callback) {
    const reader = new FileReader();
    reader.onload = e => {
        try {
            if (file.name.toLowerCase().endsWith(".json")) {
                callback(null, JSON.parse(e.target.result));
                return;
            }
            if (typeof XLSX === "undefined") throw new Error("No se pudo cargar el lector Excel (SheetJS).");
            const wb = XLSX.read(e.target.result, { type: "array" });
            if (!wb.SheetNames || !wb.SheetNames.length) throw new Error("El archivo Excel no contiene hojas.");
            const ws = wb.Sheets[wb.SheetNames[0]];
            if (!ws) throw new Error("No se pudo leer la primera hoja del Excel.");
            const datos = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
            if (!Array.isArray(datos)) throw new Error("El contenido de la hoja no tiene un formato de tabla válido.");
            callback(null, datos);
        } catch (err) { callback(err); }
    };
    if (file.name.toLowerCase().endsWith(".json")) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
}

function manejarCargaArchivo(tipo) {
    const input = document.getElementById(tipo === "nuevos" ? "fileNuevos" : "fileScanner");
    const file = input?.files?.[0];
    if (!file) return mostrarToast("Seleccioná un archivo primero", "error");
    leerArchivoTabla(file, (err, datos) => {
        if (err) return mostrarToast(`Error al leer el archivo: ${err.message}`, "error");
        const resultado = tipo === "nuevos" ? agregarVehiculosNuevos(datos) : procesarPlanillaScanner(datos);
        if (tipo === "nuevos") {
            mostrarToast(`Vehículos nuevos: ${resultado.agregados}. Ya existentes: ${resultado.existentes}.`, "success");
        } else {
            mostrarToast(`Planilla del escáner procesada. Reubicados: ${resultado.reubicados}. Conflictos: ${resultado.conflictos.length}.`, resultado.conflictos.length ? "warning" : "success");
            mostrarConflictosScanner(resultado.conflictos);
        }
        input.value = "";
    });
}

function mostrarConflictosScanner(conflictos) {
    const box = document.getElementById("conflictosScanner");
    if (!box) return;
    if (!conflictos.length) { box.innerHTML = ""; box.classList.remove("visible"); return; }
    box.classList.add("visible");
    box.innerHTML = `<h4>Conflictos de reubicación</h4>${conflictos.map(c => {
        const alts = (c.alternativas || []).map(p => `<button class="btn-alternativa" data-chasis="${c.chasis}" data-playa="${p.playa}" data-bloque="${p.bloque}" data-carril="${p.carril}" data-posicion="${p.posicion}">${p.playa}-${p.bloque} · C${p.carril}-P${p.posicion}</button>`).join("");
        return `<div class="conflicto"><strong>${c.chasis}</strong><span>${c.motivo}</span><small>Destino: ${c.destino.playa}-${c.destino.bloque} · C${c.destino.carril}-P${c.destino.posicion}</small><div>${alts || "Sin alternativas libres en ese bloque."}</div></div>`;
    }).join("")}`;
    box.querySelectorAll(".btn-alternativa").forEach(btn => btn.addEventListener("click", () => {
        const v = buscarVehiculo(btn.dataset.chasis);
        const r = asignarVehiculoAPosicion(v, btn.dataset.playa, btn.dataset.bloque, btn.dataset.carril, btn.dataset.posicion);
        if (r.ok) { mostrarToast("Alternativa asignada", "success"); btn.closest(".conflicto")?.remove(); renderizarTodo(); }
    }));
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btnCargarNuevos")?.addEventListener("click", () => manejarCargaArchivo("nuevos"));
    document.getElementById("btnCargarScanner")?.addEventListener("click", () => manejarCargaArchivo("scanner"));
    document.getElementById("btnResetInventario")?.addEventListener("click", () => {
        if (!confirm("¿Borrar todos los vehículos y dejar todas las posiciones libres?")) return;
        localStorage.removeItem(STORAGE_KEY);
        INVENTARIO.vehiculos = [];
        inicializarEstructuraPlayas();
        renderizarTodo();
        mostrarToast("Patio reiniciado", "success");
    });
});
