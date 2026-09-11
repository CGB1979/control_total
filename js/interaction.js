// ============================================
// MÓDULO DE INTERACCIONES: ESCÁNER Y EXPORTACIÓN
// ============================================

function crearDatosEjemplo() {
    return [
        { Chasis: "ABC123456789", Marca: "Toyota", Modelo: "Hilux", Playa: "Playa A", Bloque: "A", Carril: 1, Posicion: 1 },
        { Chasis: "DEF987654321", Marca: "Toyota", Modelo: "Corolla", Playa: "Playa A", Bloque: "B", Carril: 3, Posicion: 1 },
        { Chasis: "GHI112233445", Marca: "Honda", Modelo: "Civic", Playa: "Playa B", Bloque: "A", Carril: 5, Posicion: 2 }
    ];
}

// Exportar estado actual
function exportarInventario() {
    const datos = INVENTARIO.vehiculos.map(v => ({
        Chasis: v.chasis, Marca: v.marca, Modelo: v.modelo,
        Playa: v.playa, Bloque: v.bloque, Carril: v.carril, Posicion: v.posicion
    }));

    const json = JSON.stringify(datos, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventario_yms.json';
    a.click();
    URL.revokeObjectURL(url);
}

// ------------------------------------------------------------------
// ESCÁNER: lectores físicos suelen comportarse como teclado.
// Se detectan globalmente, sin necesidad de foco en el input.
// ------------------------------------------------------------------
let bufferScanner = '';
let ultimoKeyScanner = 0;
let timerScanner = null;
let streamScanner = null;
let detectorScanner = null;
let scanningCamera = false;

function procesarCodigoEscaneado(codigo) {
    const limpio = normalizarChasis(codigo);
    if (!limpio || limpio.length < 3) return;

    document.getElementById('chasisBuscador').value = limpio;
    const encontrado = seleccionarVehiculoPorChasis(limpio);

    if (encontrado) {
        mostrarSugerenciasChasis(limpio);
        document.getElementById('sugerenciasChasis').classList.remove('active');
        // Deja la selección lista para trabajar, sin obligar al operador a usar el mouse.
    } else {
        document.getElementById('sugerenciasChasis').classList.add('active');
    }
}

document.addEventListener('keydown', function(e) {
    // No interferir con teclas de edición cuando el usuario escribe manualmente.
    const target = e.target;
    const esInput = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

    const ahora = performance.now();
    if (ahora - ultimoKeyScanner > 120) bufferScanner = '';
    ultimoKeyScanner = ahora;

    if (e.key === 'Enter') {
        if (bufferScanner.length >= 3) {
            e.preventDefault();
            procesarCodigoEscaneado(bufferScanner);
            bufferScanner = '';
        }
        return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // Si el buscador tiene foco, su propio input ya recibe las teclas; aun así
        // acumulamos el flujo rápido para detectar lectores que terminan en Enter.
        bufferScanner += e.key;
        clearTimeout(timerScanner);
        timerScanner = setTimeout(() => { bufferScanner = ''; }, 180);
    }
});

// ------------------------------------------------------------------
// Cámara: usa BarcodeDetector cuando el navegador lo soporta.
// Un lector físico no necesita esta función.
// ------------------------------------------------------------------
document.getElementById('btnEscanear').addEventListener('click', iniciarScannerCamara);
document.getElementById('btnDetenerScanner').addEventListener('click', detenerScannerCamara);
document.getElementById('closeScanner').addEventListener('click', detenerScannerCamara);

async function iniciarScannerCamara() {
    const modal = document.getElementById('modalScanner');
    const video = document.getElementById('scannerVideo');
    const status = document.getElementById('scannerStatus');

    if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) {
        status.textContent = 'Este navegador no dispone de escaneo de códigos por cámara. Use un lector físico (USB/Bluetooth), que el sistema detecta automáticamente.';
        modal.style.display = 'flex';
        return;
    }

    try {
        detectorScanner = new BarcodeDetector({
            formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code', 'data_matrix', 'upc_a', 'upc_e']
        });
        streamScanner = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false
        });
        video.srcObject = streamScanner;
        modal.style.display = 'flex';
        scanningCamera = true;
        status.textContent = 'Apunte la cámara al código…';
        cicloScannerCamara();
    } catch (error) {
        console.error(error);
        status.textContent = 'No se pudo acceder a la cámara. Revise los permisos del navegador o use un lector físico.';
        modal.style.display = 'flex';
        detenerStreamScanner();
    }
}

async function cicloScannerCamara() {
    if (!scanningCamera || !detectorScanner) return;
    const video = document.getElementById('scannerVideo');

    if (video.readyState >= 2) {
        try {
            const codes = await detectorScanner.detect(video);
            if (codes.length) {
                procesarCodigoEscaneado(codes[0].rawValue);
                detenerScannerCamara();
                return;
            }
        } catch (error) {
            console.warn('Error leyendo código:', error);
        }
    }
    requestAnimationFrame(cicloScannerCamara);
}

function detenerStreamScanner() {
    if (streamScanner) {
        streamScanner.getTracks().forEach(track => track.stop());
        streamScanner = null;
    }
}

function detenerScannerCamara() {
    scanningCamera = false;
    detectorScanner = null;
    detenerStreamScanner();
    const video = document.getElementById('scannerVideo');
    if (video) video.srcObject = null;
    const modal = document.getElementById('modalScanner');
    if (modal) modal.style.display = 'none';
}

// ------------------------------------------------------------------
// Conflictos de reubicación
// ------------------------------------------------------------------
function mostrarConflictos(conflictos, noEncontrados = []) {
    if ((!conflictos || !conflictos.length) && (!noEncontrados || !noEncontrados.length)) return;

    const modal = document.getElementById('modalConflictos');
    const lista = document.getElementById('listaConflictos');
    const resumen = document.getElementById('conflictosResumen');

    resumen.textContent = `${conflictos.length} conflicto(s) de posición y ${noEncontrados.length} chasis no encontrado(s).`;

    let html = '';

    conflictos.forEach((c, index) => {
        const opciones = encontrarOpcionesReubicacion(c, 6);
        c.opciones = opciones;

        html += `
            <div class="conflicto-card">
                <strong>${c.vehiculoChasis}</strong>
                <span>${c.marca} ${c.modelo}</span>
                <p>${c.motivo}</p>
                <small>Destino solicitado: ${c.destino}</small>
                ${opciones.length ? `
                    <label>Elegir alternativa:</label>
                    <div class="opciones-reubicacion">
                        ${opciones.map((op, opIndex) =>
                            `<button type="button" class="btn-option" data-conflicto="${index}" data-opcion="${opIndex}">
                                ${op.label}
                            </button>`
                        ).join('')}
                    </div>` :
                    '<p class="sin-opciones">No hay posiciones alternativas libres en el destino configurado.</p>'}
            </div>`;
    });

    if (noEncontrados.length) {
        html += `<div class="conflicto-card no-encontrado">
            <strong>Chasis no encontrados</strong>
            <ul>${noEncontrados.map(x => `<li>Fila ${x.indice}: ${x.chasis}</li>`).join('')}</ul>
            <small>Si el archivo incluye Marca y Modelo, esos chasis pueden darse de alta; de lo contrario hay que agregarlos primero a la base.</small>
        </div>`;
    }

    lista.innerHTML = html;
    lista.querySelectorAll('.btn-option').forEach(btn => {
        btn.addEventListener('click', () => {
            const cIndex = Number(btn.dataset.conflicto);
            const opIndex = Number(btn.dataset.opcion);
            aplicarOpcionConflicto(cIndex, conflictos[cIndex].opciones[opIndex]);
        });
    });

    modal.style.display = 'flex';
}

document.getElementById('closeConflictos').addEventListener('click', () => {
    document.getElementById('modalConflictos').style.display = 'none';
});

window.addEventListener('beforeunload', detenerScannerCamara);
