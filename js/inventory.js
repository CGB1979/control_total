// ============================================
// MÓDULO DE INVENTARIO, IMPORTACIÓN Y REUBICACIÓN
// ============================================

window.INVENTARIO = {
    vehiculos: [],
    posiciones: {},
    playas: {},
    bloques: {},
    vehiculoSeleccionado: null,
    modoCarga: 'base',
    conflictos: [],
    historialMovimientos: []
};

function normalizarTexto(valor) {
    return String(valor ?? '').trim();
}

function normalizarChasis(valor) {
    return normalizarTexto(valor).toUpperCase().replace(/\s+/g, '');
}

function normalizarNumero(valor) {
    if (valor === null || valor === undefined || valor === '') return '';
    const n = Number(valor);
    return Number.isFinite(n) ? String(Math.trunc(n)) : normalizarTexto(valor);
}

function obtenerVehiculo(chasis) {
    const buscado = normalizarChasis(chasis);
    return INVENTARIO.vehiculos.find(v => normalizarChasis(v.chasis) === buscado);
}

function obtenerBloqueKey(playa, bloque) {
    const p = normalizarTexto(playa);
    const b = normalizarTexto(bloque);
    return esPlayaEspecial(p) ? p : `${p}_${b}`;
}

function obtenerPosicionKey(carril, posicion) {
    return `C${normalizarNumero(carril)}_P${normalizarNumero(posicion)}`;
}

function obtenerPosicion(playa, bloque, carril, posicion) {
    const bloqueKey = obtenerBloqueKey(playa, bloque);
    const posKey = obtenerPosicionKey(carril, posicion);
    return INVENTARIO.posiciones[`${bloqueKey}_${posKey}`]
        ? { bloqueKey, posKey, pos: INVENTARIO.posiciones[`${bloqueKey}_${posKey}`] }
        : null;
}

function liberarPosicionVehiculo(vehiculo) {
    if (!vehiculo || !vehiculo.posicionAsignada) return;
    const actual = obtenerPosicion(vehiculo.playa, vehiculo.bloque, vehiculo.carril, vehiculo.posicion);
    if (actual && actual.pos.chasis === vehiculo.chasis) {
        actual.pos.ocupada = false;
        actual.pos.chasis = null;
    }
}

function ocuparPosicion(vehiculo, playa, bloque, carril, posicion) {
    const target = obtenerPosicion(playa, bloque, carril, posicion);
    if (!target || target.pos.ocupada) return false;

    target.pos.ocupada = true;
    target.pos.chasis = vehiculo.chasis;
    vehiculo.playa = normalizarTexto(playa);
    vehiculo.bloque = esPlayaEspecial(vehiculo.playa) ? '' : normalizarTexto(bloque);
    vehiculo.carril = normalizarNumero(carril);
    vehiculo.posicion = normalizarNumero(posicion);
    vehiculo.posicionAsignada = true;
    return true;
}

// Inicializar estructura de playas y bloques
function inicializarEstructuraPlayas() {
    INVENTARIO.playas = {};
    INVENTARIO.bloques = {};
    INVENTARIO.posiciones = {};

    CONFIG_PLAYAS_COMUNES.forEach(config => {
        INVENTARIO.playas[config.playa] = config;
        config.bloques.forEach(bloque => {
            const key = `${config.playa}_${bloque}`;
            INVENTARIO.bloques[key] = {
                playa: config.playa,
                bloque,
                carriles: config.carriles,
                posicionesPorCarril: config.posicionesPorCarril,
                posiciones: {},
                tipo: 'comun'
            };
            inicializarPosicionesBloque(key, config);
        });
    });

    CONFIG_ESPECIALES.forEach(config => {
        INVENTARIO.playas[config.playa] = config;
        const key = config.playa;
        INVENTARIO.bloques[key] = {
            playa: config.playa,
            bloque: '',
            carriles: config.carriles,
            posicionesPorCarril: config.posicionesPorCarril,
            posiciones: {},
            tipo: 'especial'
        };
        inicializarPosicionesEspecial(key, config);
    });
}

function inicializarPosicionesBloque(key, config) {
    const bloque = INVENTARIO.bloques[key];
    // En bloques comunes se mantienen los carriles impares como en el diseño original.
    for (let carril = 1; carril <= config.carriles; carril += 2) {
        for (let pos = 1; pos <= config.posicionesPorCarril; pos++) {
            const posKey = `C${carril}_P${pos}`;
            bloque.posiciones[posKey] = { carril, posicion: pos, ocupada: false, chasis: null };
            INVENTARIO.posiciones[`${key}_${posKey}`] = bloque.posiciones[posKey];
        }
    }
}

function inicializarPosicionesEspecial(key, config) {
    const bloque = INVENTARIO.bloques[key];
    for (let carril = 1; carril <= config.carriles; carril++) {
        for (let pos = 1; pos <= config.posicionesPorCarril; pos++) {
            const posKey = `C${carril}_P${pos}`;
            bloque.posiciones[posKey] = { carril, posicion: pos, ocupada: false, chasis: null };
            INVENTARIO.posiciones[`${key}_${posKey}`] = bloque.posiciones[posKey];
        }
    }
}

function filaAVehiculo(row) {
    const get = (...keys) => {
        for (const key of keys) {
            if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') return row[key];
        }
        return '';
    };
    return {
        chasis: normalizarChasis(get('Chasis', 'chasis', 'VIN', 'Vin', 'vin')),
        marca: normalizarTexto(get('Marca', 'marca')),
        modelo: normalizarTexto(get('Modelo', 'modelo')),
        playa: normalizarTexto(get('Playa', 'playa', 'NuevaPlaya', 'nuevaPlaya', 'PlayaDestino', 'playaDestino')),
        bloque: normalizarTexto(get('Bloque', 'bloque', 'NuevoBloque', 'nuevoBloque', 'BloqueDestino', 'bloqueDestino')),
        carril: normalizarNumero(get('Carril', 'carril', 'NuevoCarril', 'nuevoCarril', 'CarrilDestino', 'carrilDestino')),
        posicion: normalizarNumero(get('Posicion', 'Posición', 'posicion', 'posición', 'NuevaPosicion', 'nuevaPosicion', 'PosicionDestino', 'posicionDestino'))
    };
}

// Carga inicial: reemplaza el inventario y reconstruye ocupación desde cero.
function cargarInventarioBase(datos) {
    INVENTARIO.vehiculos = [];
    INVENTARIO.vehiculoSeleccionado = null;
    INVENTARIO.conflictos = [];

    Object.values(INVENTARIO.posiciones).forEach(pos => {
        pos.ocupada = false;
        pos.chasis = null;
    });

    datos.forEach(row => {
        const dato = filaAVehiculo(row);
        if (!dato.chasis) return;

        let v = {
            ...dato,
            posicionAsignada: false
        };

        // Evitar duplicados de chasis en la base.
        const existente = obtenerVehiculo(v.chasis);
        if (existente) {
            Object.assign(existente, v);
            return;
        }

        INVENTARIO.vehiculos.push(v);

        if (v.playa && v.carril && v.posicion) {
            const target = obtenerPosicion(v.playa, v.bloque, v.carril, v.posicion);
            if (target && !target.pos.ocupada) {
                ocuparPosicion(v, v.playa, v.bloque, v.carril, v.posicion);
            } else if (target?.pos.ocupada) {
                v.posicionAsignada = false;
            }
        }
    });

    actualizarSelectoresPlayas();
    renderizarLayout();
}

// Procesa un archivo posterior de movimientos sin borrar la base.
// Cada fila puede traer una posición destino. Si no la trae, se intenta
// asignación automática según el mapeo Marca/Modelo.
function procesarReubicaciones(datos) {
    const conflictos = [];
    const aplicados = [];
    const noEncontrados = [];

    datos.forEach((row, indice) => {
        const cambio = filaAVehiculo(row);
        if (!cambio.chasis) return;

        let v = obtenerVehiculo(cambio.chasis);

        // Si el archivo trae marca/modelo y el vehículo no existe, se puede dar de alta.
        if (!v && (cambio.marca || cambio.modelo)) {
            v = {
                chasis: cambio.chasis,
                marca: cambio.marca,
                modelo: cambio.modelo,
                playa: '',
                bloque: '',
                carril: '',
                posicion: '',
                posicionAsignada: false
            };
            INVENTARIO.vehiculos.push(v);
        }

        if (!v) {
            noEncontrados.push({ indice: indice + 2, chasis: cambio.chasis });
            return;
        }

        if (cambio.marca) v.marca = cambio.marca;
        if (cambio.modelo) v.modelo = cambio.modelo;

        const tieneDestino = cambio.playa && cambio.carril && cambio.posicion;
        if (tieneDestino) {
            const target = obtenerPosicion(cambio.playa, cambio.bloque, cambio.carril, cambio.posicion);
            if (!target) {
                conflictos.push(crearConflicto(v, cambio, 'La posición indicada no existe en el mapa.'));
                return;
            }

            if (target.pos.ocupada && target.pos.chasis !== v.chasis) {
                conflictos.push(crearConflicto(v, cambio,
                    `La posición ${cambio.playa} ${cambio.bloque ? 'Bloque ' + cambio.bloque : ''} C${cambio.carril}-P${cambio.posicion} está ocupada por ${target.pos.chasis}.`));
                return;
            }

            moverVehiculo(v, cambio.playa, cambio.bloque, cambio.carril, cambio.posicion);
            aplicados.push(v.chasis);
        } else {
            const mapeo = MAPEO_MODELOS_PLAYAS.find(m =>
                normalizarTexto(m.marca).toUpperCase() === normalizarTexto(v.marca).toUpperCase() &&
                normalizarTexto(m.modelo).toUpperCase() === normalizarTexto(v.modelo).toUpperCase()
            );

            if (!mapeo) {
                conflictos.push(crearConflicto(v, cambio, 'No hay posición destino ni mapeo Marca/Modelo para asignación automática.'));
                return;
            }

            const libre = encontrarPosicionDisponible(mapeo.playaDestino, mapeo.bloqueDestino);
            if (!libre) {
                conflictos.push(crearConflicto(v, cambio, `No quedan posiciones libres en ${mapeo.playaDestino} ${mapeo.bloqueDestino || ''}.`));
                return;
            }
            moverVehiculo(v, mapeo.playaDestino, mapeo.bloqueDestino, libre.carril, libre.posicion);
            aplicados.push(v.chasis);
        }
    });

    INVENTARIO.conflictos = conflictos;
    INVENTARIO.historialMovimientos.push({
        fecha: new Date().toISOString(),
        aplicados,
        conflictos: conflictos.length,
        noEncontrados
    });

    actualizarSelectoresPlayas();
    renderizarLayout();
    mostrarConflictos(conflictos, noEncontrados);

    const total = aplicados.length;
    const msg = `Movimientos procesados. Aplicados: ${total}. Conflictos: ${conflictos.length}. No encontrados: ${noEncontrados.length}.`;
    if (conflictos.length || noEncontrados.length) {
        console.warn(msg, { conflictos, noEncontrados });
    }
    alert(msg);
}

function crearConflicto(vehiculo, cambio, motivo) {
    return {
        vehiculoChasis: vehiculo.chasis,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        motivo,
        destino: cambio.playa ? `${cambio.playa} ${cambio.bloque ? '- Bloque ' + cambio.bloque : ''} C${cambio.carril}-P${cambio.posicion}` : 'Asignación automática',
        opciones: []
    };
}

function encontrarPosicionDisponible(playa, bloque) {
    const bloqueKey = obtenerBloqueKey(playa, bloque);
    const bloqueObj = INVENTARIO.bloques[bloqueKey];
    if (!bloqueObj) return null;

    for (const posKey of Object.keys(bloqueObj.posiciones)) {
        const pos = bloqueObj.posiciones[posKey];
        if (!pos.ocupada) return { bloqueKey, posKey, ...pos };
    }
    return null;
}

function encontrarOpcionesReubicacion(conflicto, cantidad = 6) {
    const v = obtenerVehiculo(conflicto.vehiculoChasis);
    if (!v) return [];

    const candidatos = [];
    const vistos = new Set();

    function agregarBloque(playa, bloque) {
        const bloqueKey = obtenerBloqueKey(playa, bloque);
        const b = INVENTARIO.bloques[bloqueKey];
        if (!b) return;
        Object.values(b.posiciones).forEach(pos => {
            if (!pos.ocupada) {
                const key = `${bloqueKey}_${pos.carril}_${pos.posicion}`;
                if (vistos.has(key)) return;
                vistos.add(key);
                candidatos.push({
                    playa: b.playa,
                    bloque: b.bloque || '',
                    carril: pos.carril,
                    posicion: pos.posicion,
                    label: `${b.playa}${b.bloque ? ' - Bloque ' + b.bloque : ''} - C${pos.carril}-P${pos.posicion}`
                });
            }
        });
    }

    // Primero intentamos el destino pedido.
    const destinoPartes = conflicto.destino.match(/^(.+?)(?:\s+-\s+Bloque\s+(.+?))?\s+C(\d+)-P(\d+)$/);
    if (destinoPartes) agregarBloque(destinoPartes[1].trim(), destinoPartes[2]?.trim() || '');

    // Después, el destino definido por Marca/Modelo.
    const mapeo = MAPEO_MODELOS_PLAYAS.find(m =>
        m.marca.toUpperCase() === v.marca.toUpperCase() &&
        m.modelo.toUpperCase() === v.modelo.toUpperCase()
    );
    if (mapeo) agregarBloque(mapeo.playaDestino, mapeo.bloqueDestino);

    // Finalmente, cualquier bloque de la misma playa del destino solicitado.
    const playaDestino = destinoPartes ? destinoPartes[1].trim() : '';
    if (playaDestino && INVENTARIO.playas[playaDestino]) {
        const cfg = CONFIG_PLAYAS_COMUNES.find(p => p.playa === playaDestino);
        if (cfg) cfg.bloques.forEach(b => agregarBloque(playaDestino, b));
    }

    return candidatos.slice(0, cantidad);
}

function aplicarOpcionConflicto(index, opcion) {
    const conflicto = INVENTARIO.conflictos[index];
    if (!conflicto) return;
    const v = obtenerVehiculo(conflicto.vehiculoChasis);
    if (!v) return;

    if (moverVehiculo(v, opcion.playa, opcion.bloque, opcion.carril, opcion.posicion)) {
        INVENTARIO.conflictos.splice(index, 1);
        actualizarSelectoresPlayas();
        renderizarLayout();
        mostrarConflictos(INVENTARIO.conflictos, []);
    } else {
        alert('La posición elegida dejó de estar disponible.');
    }
}

function moverVehiculo(v, playa, bloque, carril, posicion) {
    const target = obtenerPosicion(playa, bloque, carril, posicion);
    if (!target || (target.pos.ocupada && target.pos.chasis !== v.chasis)) return false;

    liberarPosicionVehiculo(v);
    return ocuparPosicion(v, playa, bloque, carril, posicion);
}

// Cargar vehículos desde archivo
document.getElementById('btnCargar').addEventListener('click', function() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('Por favor seleccione un archivo.');
        return;
    }

    const tipo = document.getElementById('tipoCarga').value;
    INVENTARIO.modoCarga = tipo;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            let datos;
            const nombre = file.name.toLowerCase();

            if (nombre.endsWith('.json')) {
                datos = JSON.parse(e.target.result);
            } else if (nombre.endsWith('.xlsx') || nombre.endsWith('.xls')) {
                if (typeof XLSX === 'undefined') {
                    throw new Error('No se pudo cargar la librería XLSX. Verifique su conexión a Internet.');
                }
                const workbook = XLSX.read(e.target.result, { type: 'array', cellDates: false });
                const hoja = workbook.Sheets[workbook.SheetNames[0]];
                datos = XLSX.utils.sheet_to_json(hoja, { defval: '' });
            } else if (nombre.endsWith('.csv')) {
                const workbook = XLSX.read(e.target.result, { type: 'string' });
                const hoja = workbook.Sheets[workbook.SheetNames[0]];
                datos = XLSX.utils.sheet_to_json(hoja, { defval: '' });
            } else {
                throw new Error('Formato no soportado. Use XLSX, XLS, CSV o JSON.');
            }

            if (!Array.isArray(datos) || !datos.length) {
                throw new Error('El archivo no contiene filas de datos.');
            }

            if (tipo === 'base') cargarInventarioBase(datos);
            else procesarReubicaciones(datos);

            fileInput.value = '';
        } catch (error) {
            console.error(error);
            alert('Error al cargar archivo: ' + error.message);
        }
    };

    if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file, 'UTF-8');
    }
});

// Actualizar selectores de playas y bloques (evita listeners duplicados)
function actualizarSelectoresPlayas() {
    const playaSelect = document.getElementById('playaSelect');
    const bloqueSelect = document.getElementById('bloqueSelect');

    playaSelect.innerHTML = '<option value="">Seleccionar Playa...</option>';
    Object.keys(INVENTARIO.playas).forEach(playa => {
        playaSelect.innerHTML += `<option value="${playa}">${playa}</option>`;
    });

    if (playaSelect.dataset.listener !== '1') {
        playaSelect.dataset.listener = '1';
        playaSelect.addEventListener('change', function() {
            bloqueSelect.innerHTML = '<option value="">Seleccionar Bloque...</option>';
            const playa = this.value;

            if (playa) {
                if (esPlayaEspecial(playa)) {
                    bloqueSelect.innerHTML += `<option value="${playa}">Especial</option>`;
                } else {
                    const config = CONFIG_PLAYAS_COMUNES.find(p => p.playa === playa);
                    (config?.bloques || []).forEach(bloque => {
                        bloqueSelect.innerHTML += `<option value="${bloque}">${bloque}</option>`;
                    });
                }
            }
            renderizarLayout();
        });
    }

    if (playaSelect.value) {
        playaSelect.dispatchEvent(new Event('change'));
    }
}

// Buscar vehículos por últimos dígitos
document.getElementById('chasisBuscador').addEventListener('input', function() {
    mostrarSugerenciasChasis(this.value);
});

function mostrarSugerenciasChasis(valor) {
    const input = normalizarChasis(valor);
    const dropdown = document.getElementById('sugerenciasChasis');

    if (input.length < 3) {
        dropdown.innerHTML = '';
        dropdown.classList.remove('active');
        return;
    }

    const coincidencias = INVENTARIO.vehiculos.filter(v => normalizarChasis(v.chasis).endsWith(input));
    if (coincidencias.length) {
        dropdown.innerHTML = coincidencias.map(v => {
            const idx = INVENTARIO.vehiculos.indexOf(v);
            return `<div class="sugerencia-item" data-idx="${idx}">${v.chasis} - ${v.marca} ${v.modelo}</div>`;
        }).join('');
        dropdown.classList.add('active');

        dropdown.querySelectorAll('.sugerencia-item').forEach(item => {
            item.addEventListener('click', () => {
                seleccionarVehiculo(Number(item.dataset.idx));
                dropdown.classList.remove('active');
                document.getElementById('chasisBuscador').value = '';
            });
        });
    } else {
        dropdown.innerHTML = '<div class="sugerencia-item" style="color:#999;">Sin coincidencias</div>';
        dropdown.classList.add('active');
    }
}

function seleccionarVehiculo(indice) {
    INVENTARIO.vehiculoSeleccionado = INVENTARIO.vehiculos[indice] || null;
    actualizarPanelVehiculo();
}

function seleccionarVehiculoPorChasis(chasis) {
    const v = obtenerVehiculo(chasis);
    if (!v) {
        document.getElementById('chasisBuscador').value = chasis;
        mostrarSugerenciasChasis(chasis);
        return false;
    }
    const idx = INVENTARIO.vehiculos.indexOf(v);
    seleccionarVehiculo(idx);
    document.getElementById('chasisBuscador').value = v.chasis;
    document.getElementById('sugerenciasChasis').classList.remove('active');
    return true;
}

function actualizarPanelVehiculo() {
    const v = INVENTARIO.vehiculoSeleccionado;
    if (!v) return;

    document.getElementById('infoChasis').textContent = v.chasis || '-';
    document.getElementById('infoMarca').textContent = v.marca || '-';
    document.getElementById('infoModelo').textContent = v.modelo || '-';

    if (v.posicionAsignada && v.playa) {
        document.getElementById('infoPosicion').textContent =
            `${v.playa}${v.bloque ? ' - Bloque ' + v.bloque : ''} - C${v.carril}_P${v.posicion}`;
        document.getElementById('btnAsignarPosicion').style.display = 'none';
    } else {
        document.getElementById('infoPosicion').textContent = 'No asignada';
        document.getElementById('btnAsignarPosicion').style.display = 'block';
    }
}

// Asignación automática manual
document.getElementById('btnAsignarPosicion').addEventListener('click', function() {
    const v = INVENTARIO.vehiculoSeleccionado;
    if (!v) return;

    const mapeo = MAPEO_MODELOS_PLAYAS.find(m =>
        m.marca.toUpperCase() === v.marca.toUpperCase() &&
        m.modelo.toUpperCase() === v.modelo.toUpperCase()
    );

    if (!mapeo) {
        alert('No existe mapeo configurado para ' + v.marca + ' ' + v.modelo);
        return;
    }

    const libre = encontrarPosicionDisponible(mapeo.playaDestino, mapeo.bloqueDestino);
    if (!libre) {
        alert('No hay posiciones disponibles en el bloque designado.');
        return;
    }

    moverVehiculo(v, mapeo.playaDestino, mapeo.bloqueDestino, libre.carril, libre.posicion);
    actualizarPanelVehiculo();
    renderizarLayout();
    alert(`Vehículo asignado a: ${v.playa} - ${v.bloque ? 'Bloque ' + v.bloque + ' - ' : ''}C${v.carril}-P${v.posicion}`);
});
