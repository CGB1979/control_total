// ============================================================
// APLICACION PRINCIPAL
// ============================================================

function mostrarToast(mensaje, tipo = "info") {
    const root = document.getElementById("toastRoot");
    if (!root) return;
    const el = document.createElement("div");
    el.className = `toast toast-${tipo}`;
    el.textContent = mensaje;
    root.appendChild(el);
    setTimeout(() => el.classList.add("show"), 10);
    setTimeout(() => { el.classList.remove("show"); setTimeout(() => el.remove(), 250); }, 3500);
}

function seleccionarVehiculo(v) {
    INVENTARIO.vehiculoSeleccionado = v;
    actualizarPanelVehiculo();
}

function actualizarPanelVehiculo() {
    const v = INVENTARIO.vehiculoSeleccionado;
    const ids = ["infoChasis", "infoMarca", "infoModelo", "infoPosicion", "infoDestino"];
    if (!v) {
        document.getElementById("infoChasis").textContent = "Esperando escaneo...";
        document.getElementById("infoMarca").textContent = "-";
        document.getElementById("infoModelo").textContent = "-";
        document.getElementById("infoPosicion").textContent = "-";
        document.getElementById("infoDestino").textContent = "-";
        return;
    }
    document.getElementById("infoChasis").textContent = v.chasis;
    document.getElementById("infoMarca").textContent = v.marca || "-";
    document.getElementById("infoModelo").textContent = v.modelo || "-";
    document.getElementById("infoPosicion").textContent = v.posicionAsignada ? `${v.playa} · ${v.bloque} · C${v.carril}-P${v.posicion}` : "Sin asignar";

    const s = sugerirPosicion(v);
    document.getElementById("infoDestino").textContent = s.mapeo ? `${s.mapeo.playaDestino} · ${s.mapeo.bloqueDestino}` : "Sin regla configurada";

    const box = document.getElementById("sugerenciaAsignacion");
    const button = document.getElementById("btnAsignarSugerida");
    if (!v.posicionAsignada && s.posicion) {
        box.innerHTML = `<strong>Sugerencia:</strong> ${s.posicion.playa} · ${s.posicion.bloque} · C${s.posicion.carril}-P${s.posicion.posicion}`;
        box.classList.add("visible");
        button.style.display = "inline-flex";
        button.onclick = () => {
            const r = asignarVehiculoAPosicion(v, s.posicion.playa, s.posicion.bloque, s.posicion.carril, s.posicion.posicion);
            if (r.ok) { actualizarPanelVehiculo(); renderizarTodo(); mostrarToast("Posición sugerida asignada", "success"); }
        };
    } else if (!v.posicionAsignada && s.mapeo) {
        box.innerHTML = `<strong>Sin lugar libre</strong> en ${s.mapeo.playaDestino} · ${s.mapeo.bloqueDestino}. Revisá otra ubicación manualmente.`;
        box.classList.add("visible warning-box");
        button.style.display = "none";
    } else {
        box.classList.remove("visible");
        button.style.display = "none";
    }
}

function procesarCodigoEscaneado(codigo) {
    const limpio = String(codigo || "").trim().replace(/[^A-Za-z0-9]/g, "");
    if (!limpio) return;
    const exacto = buscarVehiculo(limpio);
    const coincidencias = exacto ? [exacto] : buscarVehiculosPorChasisParcial(limpio);

    if (exacto) {
        seleccionarVehiculo(exacto);
        const s = sugerirPosicion(exacto);
        if (!exacto.posicionAsignada && s.posicion) {
            document.getElementById("playaSelect").value = s.posicion.playa;
            document.getElementById("playaSelect").dispatchEvent(new Event("change"));
            document.getElementById("bloqueSelect").value = s.posicion.bloque;
        }
        mostrarToast(`VIN detectado: ${exacto.chasis}`, "success");
        renderizarLayout();
        return;
    }
    if (coincidencias.length === 1) { seleccionarVehiculo(coincidencias[0]); return; }
    if (coincidencias.length > 1) {
        mostrarToast("Hay más de una coincidencia para el código escaneado", "warning");
        document.getElementById("chasisBuscador").value = limpio;
        document.getElementById("chasisBuscador").dispatchEvent(new Event("input"));
        return;
    }
    mostrarToast(`VIN ${limpio} no está en Vehículos Nuevos`, "error");
}

function configurarBuscador() {
    const input = document.getElementById("chasisBuscador");
    const dropdown = document.getElementById("sugerenciasChasis");
    input?.addEventListener("input", () => {
        const q = input.value.trim();
        if (q.length < 3) { dropdown.classList.remove("active"); dropdown.innerHTML = ""; return; }
        const matches = buscarVehiculosPorChasisParcial(q).slice(0, 12);
        dropdown.innerHTML = matches.length ? matches.map(v => `<button class="sugerencia-item" data-chasis="${v.chasis}"><strong>${v.chasis}</strong><span>${v.marca} ${v.modelo}</span></button>`).join("") : '<div class="sugerencia-item muted">Sin coincidencias</div>';
        dropdown.classList.add("active");
        dropdown.querySelectorAll("button").forEach(b => b.onclick = () => { const v = buscarVehiculo(b.dataset.chasis); seleccionarVehiculo(v); dropdown.classList.remove("active"); input.value = ""; });
    });
}

function configurarEscanerGlobal() {
    // Muchos lectores USB/Bluetooth se comportan como un teclado.
    // Por eso NO exigimos que el input de chasis tenga foco.
    let buffer = "";
    let ultimoTiempo = 0;
    document.addEventListener("keydown", e => {
        const ahora = Date.now();
        if (ahora - ultimoTiempo > 120) buffer = "";
        ultimoTiempo = ahora;
        if (e.key === "Enter") {
            if (buffer.length >= 6) { e.preventDefault(); procesarCodigoEscaneado(buffer); }
            buffer = "";
            return;
        }
        if (e.key.length === 1 && /[A-Za-z0-9]/.test(e.key)) {
            buffer += e.key;
            if (buffer.length > 80) buffer = buffer.slice(-80);
        }
    });

    document.getElementById("btnEscanear")?.addEventListener("click", iniciarEscaneoCamara);
}

async function iniciarEscaneoCamara() {
    if (!("BarcodeDetector" in window)) {
        mostrarToast("Este navegador no dispone de lector de códigos por cámara. Usá el lector USB/Bluetooth o un navegador compatible.", "warning");
        return;
    }
    const modal = document.getElementById("scannerModal");
    const video = document.getElementById("scannerVideo");
    modal.style.display = "flex";
    try {
        const detector = new BarcodeDetector({ formats: ["code_128", "code_39", "qr_code", "data_matrix"] });
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
        video.srcObject = stream;
        await video.play();
        const loop = async () => {
            if (modal.style.display === "none") return;
            try {
                const codes = await detector.detect(video);
                if (codes.length) { cerrarScanner(); procesarCodigoEscaneado(codes[0].rawValue); return; }
            } catch (_) {}
            requestAnimationFrame(loop);
        };
        loop();
    } catch (e) {
        cerrarScanner();
        mostrarToast("No se pudo acceder a la cámara. Revisá los permisos del navegador.", "error");
    }
}

function cerrarScanner() {
    const modal = document.getElementById("scannerModal");
    const video = document.getElementById("scannerVideo");
    if (video?.srcObject) video.srcObject.getTracks().forEach(t => t.stop());
    if (modal) modal.style.display = "none";
}

function initializeApp() {
    inicializarEstructuraPlayas();
    cargarInventarioPersistido();
    actualizarSelectoresPlayas();
    configurarBuscador();
    configurarEscanerGlobal();
    actualizarPanelVehiculo();
    actualizarResumenGeneral();
}

document.addEventListener("DOMContentLoaded", initializeApp);
