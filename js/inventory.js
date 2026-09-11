// ============================================
// MÓDULO DE INVENTARIO
// ============================================

// Estructura global de inventario
window.INVENTARIO = {
    vehiculos: [],          // Lista de todos los vehículos cargados
    posiciones: {},         // Mapeo de posiciones ocupadas
    playas: {},             // Datos de playas
    bloques: {},            // Datos de bloques
    vehiculoSeleccionado: null
};

// Inicializar estructura de playas y bloques
function inicializarEstructuraPlayas() {
    // Playas comunes
    CONFIG_PLAYAS_COMUNES.forEach(config => {
        INVENTARIO.playas[config.playa] = config;
        config.bloques.forEach(bloque => {
            const key = `${config.playa}_${bloque}`;
            INVENTARIO.bloques[key] = {
                playa: config.playa,
                bloque: bloque,
                carriles: config.carriles,
                posicionesPorCarril: config.posicionesPorCarril,
                posiciones: {},
                tipo: 'comun'
            };
            inicializarPosicionesBloque(key, config);
        });
    });

    // Playas especiales
    CONFIG_ESPECIALES.forEach(config => {
        INVENTARIO.playas[config.playa] = config;
        const key = config.playa;
        INVENTARIO.bloques[key] = {
            playa: config.playa,
            carriles: config.carriles,
            posicionesPorCarril: config.posicionesPorCarril,
            posiciones: {},
            tipo: 'especial'
        };
        inicializarPosicionesEspecial(key, config);
    });
}

// Inicializar posiciones para bloque común
function inicializarPosicionesBloque(key, config) {
    const bloque = INVENTARIO.bloques[key];
    for (let carril = 1; carril <= config.carriles; carril += 2) {
        for (let pos = 1; pos <= config.posicionesPorCarril; pos++) {
            const posKey = `C${carril}_P${pos}`;
            bloque.posiciones[posKey] = {
                carril: carril,
                posicion: pos,
                ocupada: false,
                chasis: null
            };
            INVENTARIO.posiciones[`${key}_${posKey}`] = bloque.posiciones[posKey];
        }
    }
}

// Inicializar posiciones para bloque especial
function inicializarPosicionesEspecial(key, config) {
    const bloque = INVENTARIO.bloques[key];
    for (let carril = 1; carril <= config.carriles; carril++) {
        for (let pos = 1; pos <= config.posicionesPorCarril; pos++) {
            const posKey = `C${carril}_P${pos}`;
            bloque.posiciones[posKey] = {
                carril: carril,
                posicion: pos,
                ocupada: false,
                chasis: null
            };
            INVENTARIO.posiciones[`${key}_${posKey}`] = bloque.posiciones[posKey];
        }
    }
}

// Cargar vehículos desde archivo
document.getElementById('btnCargar').addEventListener('click', function() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Por favor seleccione un archivo');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            let datos = [];
            
            if (file.name.endsWith('.json')) {
                datos = JSON.parse(e.target.result);
            } else if (file.name.endsWith('.xlsx')) {
                alert('Para archivos XLSX, necesita instalar XLSX.js. Por ahora use JSON.');
                return;
            }

            cargarInventario(datos);
            alert('Inventario cargado exitosamente: ' + datos.length + ' vehículos');
        } catch (error) {
            alert('Error al cargar archivo: ' + error.message);
        }
    };
    reader.readAsText(file);
});

// Procesar y cargar datos de inventario
function cargarInventario(datos) {
    INVENTARIO.vehiculos = [];
    
    datos.forEach(row => {
        const vehiculo = {
            chasis: row.Chasis || row.chasis || '',
            marca: row.Marca || row.marca || '',
            modelo: row.Modelo || row.modelo || '',
            playa: row.Playa || row.playa || '',
            bloque: row.Bloque || row.bloque || '',
            carril: row.Carril || row.carril || '',
            posicion: row.Posicion || row.posicion || '',
            posicionAsignada: false
        };

        if (vehiculo.chasis) {
            INVENTARIO.vehiculos.push(vehiculo);

            // Si tiene coordenadas, marcar como ocupada
            if (vehiculo.playa && vehiculo.bloque && vehiculo.carril && vehiculo.posicion) {
                const bloqueKey = `${vehiculo.playa}_${vehiculo.bloque}`;
                const posKey = `C${vehiculo.carril}_P${vehiculo.posicion}`;
                const fullKey = `${bloqueKey}_${posKey}`;
                
                if (INVENTARIO.posiciones[fullKey]) {
                    INVENTARIO.posiciones[fullKey].ocupada = true;
                    INVENTARIO.posiciones[fullKey].chasis = vehiculo.chasis;
                    vehiculo.posicionAsignada = true;
                }
            }
        }
    });

    actualizarSelectoresPlayas();
    renderizarLayout();
}

// Actualizar selectores de playas y bloques
function actualizarSelectoresPlayas() {
    const playaSelect = document.getElementById('playaSelect');
    const bloqueSelect = document.getElementById('bloqueSelect');
    
    playaSelect.innerHTML = '<option value="">Seleccionar Playa...</option>';
    Object.keys(INVENTARIO.playas).forEach(playa => {
        playaSelect.innerHTML += `<option value="${playa}">${playa}</option>`;
    });

    playaSelect.addEventListener('change', function() {
        bloqueSelect.innerHTML = '<option value="">Seleccionar Bloque...</option>';
        const playa = this.value;
        
        if (playa) {
            if (esPlayaEspecial(playa)) {
                bloqueSelect.innerHTML += `<option value="${playa}">Especial</option>`;
            } else {
                CONFIG_PLAYAS_COMUNES.find(p => p.playa === playa).bloques.forEach(bloque => {
                    bloqueSelect.innerHTML += `<option value="${bloque}">${bloque}</option>`;
                });
            }
        }

        bloqueSelect.addEventListener('change', renderizarLayout);
    });
}

// Buscar vehículos por últimos dígitos del chasis
document.getElementById('chasisBuscador').addEventListener('input', function() {
    const input = this.value.trim();
    const dropdown = document.getElementById('sugerenciasChasis');
    
    if (input.length < 3) {
        dropdown.innerHTML = '';
        dropdown.classList.remove('active');
        return;
    }

    const coincidencias = INVENTARIO.vehiculos.filter(v => v.chasis.endsWith(input));
    
    if (coincidencias.length > 0) {
        dropdown.innerHTML = coincidencias.map(v => 
            `<div class="sugerencia-item" data-chasis="${v.chasis}" data-idx="${INVENTARIO.vehiculos.indexOf(v)}">
                ${v.chasis} - ${v.marca} ${v.modelo}
            </div>`
        ).join('');
        dropdown.classList.add('active');

        dropdown.querySelectorAll('.sugerencia-item').forEach(item => {
            item.addEventListener('click', function() {
                const idx = this.dataset.idx;
                seleccionarVehiculo(parseInt(idx));
                dropdown.classList.remove('active');
                document.getElementById('chasisBuscador').value = '';
            });
        });
    } else {
        dropdown.innerHTML = '<div class="sugerencia-item" style="color: #999;">Sin coincidencias</div>';
        dropdown.classList.add('active');
    }
});

// Seleccionar vehículo
function seleccionarVehiculo(indice) {
    INVENTARIO.vehiculoSeleccionado = INVENTARIO.vehiculos[indice];
    actualizarPanelVehiculo();
}

// Actualizar panel de información del vehículo
function actualizarPanelVehiculo() {
    const v = INVENTARIO.vehiculoSeleccionado;
    if (!v) return;

    document.getElementById('infoChasis').textContent = v.chasis;
    document.getElementById('infoMarca').textContent = v.marca;
    document.getElementById('infoModelo').textContent = v.modelo;
    
    if (v.posicionAsignada && v.playa && v.bloque) {
        document.getElementById('infoPosicion').textContent = `${v.playa} - Bloque ${v.bloque} - C${v.carril}_P${v.posicion}`;
        document.getElementById('btnAsignarPosicion').style.display = 'none';
    } else {
        document.getElementById('infoPosicion').textContent = 'No asignada';
        document.getElementById('btnAsignarPosicion').style.display = 'block';
    }
}

// Asignar posición automática
document.getElementById('btnAsignarPosicion').addEventListener('click', function() {
    if (!INVENTARIO.vehiculoSeleccionado) return;

    const v = INVENTARIO.vehiculoSeleccionado;
    const mapeo = MAPEO_MODELOS_PLAYAS.find(m => m.marca === v.marca && m.modelo === v.modelo);
    
    if (!mapeo) {
        alert('No existe mapeo configurado para ' + v.marca + ' ' + v.modelo);
        return;
    }

    // Buscar posición disponible según algoritmo
    asignarPosicionAutomatica(v, mapeo);
});

// Lógica de asignación automática
function asignarPosicionAutomatica(vehiculo, mapeo) {
    let bloqueTarget;

    if (esPlayaEspecial(mapeo.playaDestino)) {
        bloqueTarget = INVENTARIO.bloques[mapeo.playaDestino];
    } else {
        bloqueTarget = INVENTARIO.bloques[`${mapeo.playaDestino}_${mapeo.bloqueDestino}`];
    }

    // Encontrar primera posición libre
    for (let posKey in bloqueTarget.posiciones) {
        if (!bloqueTarget.posiciones[posKey].ocupada) {
            const pos = bloqueTarget.posiciones[posKey];
            vehiculo.playa = mapeo.playaDestino;
            vehiculo.bloque = mapeo.bloqueDestino;
            vehiculo.carril = pos.carril;
            vehiculo.posicion = pos.posicion;
            vehiculo.posicionAsignada = true;

            bloqueTarget.posiciones[posKey].ocupada = true;
            bloqueTarget.posiciones[posKey].chasis = vehiculo.chasis;

            actualizarPanelVehiculo();
            renderizarLayout();
            alert('Vehículo asignado a: ' + vehiculo.playa + ' - Bloque ' + vehiculo.bloque);
            return;
        }
    }

    alert('No hay posiciones disponibles en el bloque designado');
}
