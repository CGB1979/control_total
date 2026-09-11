// ============================================
// MÓDULO DE RENDERIZADO DE LAYOUT
// ============================================

function renderizarLayout() {
    const playaSelect = document.getElementById('playaSelect');
    const bloqueSelect = document.getElementById('bloqueSelect');
    
    const playaActiva = playaSelect.value;
    const bloqueActivo = bloqueSelect.value;

    if (!playaActiva || !bloqueActivo) {
        document.getElementById('gridActivo').innerHTML = '<p style="text-align: center; color: #999;">Seleccione una Playa y un Bloque</p>';
        document.getElementById('gridReferencia').innerHTML = '';
        return;
    }

    // Actualizar estadísticas
    actualizarEstadisticas(playaActiva, bloqueActivo);

    // Determinar si es playa especial o común
    if (esPlayaEspecial(playaActiva)) {
        renderizarBloqueEspecial(playaActiva);
    } else {
        renderizarBloqueComun(playaActiva, bloqueActivo);
    }
}

// Renderizar bloque especial
function renderizarBloqueEspecial(playa) {
    const bloqueKey = playa;
    const bloque = INVENTARIO.bloques[bloqueKey];
    
    document.getElementById('bloqueActivoTitle').textContent = `${playa} (Especial)`;
    document.getElementById('bloqueReferenciaTitle').textContent = 'N/A';
    document.getElementById('bloqueReferencia').style.display = 'none';

    const grid = document.getElementById('gridActivo');
    grid.innerHTML = '';

    for (let posKey in bloque.posiciones) {
        const pos = bloque.posiciones[posKey];
        const celda = crearCeldaPosicion(bloqueKey, posKey, pos, true);
        grid.appendChild(celda);
    }
}

// Renderizar bloques comunes (espalda con espalda)
function renderizarBloqueComun(playa, bloqueActivo) {
    document.getElementById('bloqueReferenciaTitle').textContent = bloque encontr;
    document.getElementById('bloqueReferencia').style.display = 'flex';
    
    const configPlaya = CONFIG_PLAYAS_COMUNES.find(p => p.playa === playa);
    const otroBloque = configPlaya.bloques.find(b => b !== bloqueActivo);

    // Bloque Activo
    document.getElementById('bloqueActivoTitle').textContent = `${playa} - Bloque ${bloqueActivo} (Activo)`;
    const bloqueKeyActivo = `${playa}_${bloqueActivo}`;
    const bloqueKeyReferencia = `${playa}_${otroBloque}`;

    renderizarGridBloque(bloqueKeyActivo, document.getElementById('gridActivo'), true);
    renderizarGridBloque(bloqueKeyReferencia, document.getElementById('gridReferencia'), false);
}

// Renderizar grid de un bloque
function renderizarGridBloque(bloqueKey, grid, esActivo) {
    const bloque = INVENTARIO.bloques[bloqueKey];
    grid.innerHTML = '';

    for (let posKey in bloque.posiciones) {
        const pos = bloque.posiciones[posKey];
        const celda = crearCeldaPosicion(bloqueKey, posKey, pos, esActivo);
        grid.appendChild(celda);
    }
}

// Crear celda de posición
function crearCeldaPosicion(bloqueKey, posKey, pos, esActivo) {
    const celda = document.createElement('div');
    celda.className = `celda-posicion ${pos.ocupada ? 'celda-ocupada' : 'celda-libre'}`;
    celda.textContent = `C${pos.carril}-P${pos.posicion}`;
    celda.title = pos.chasis || 'Disponible';

    // Clic en celda libre con vehículo seleccionado
    if (!pos.ocupada && esActivo && INVENTARIO.vehiculoSeleccionado && !INVENTARIO.vehiculoSeleccionado.posicionAsignada) {
        celda.addEventListener('click', function() {
            asignarVehiculoAPosicion(bloqueKey, posKey);
        });
    }

    // Clic en celda ocupada para ver detalles
    if (pos.ocupada && esActivo) {
        celda.addEventListener('click', function() {
            mostrarDetallesVehiculo(pos.chasis);
        });
    }

    return celda;
}

// Asignar vehículo a posición específica
function asignarVehiculoAPosicion(bloqueKey, posKey) {
    const v = INVENTARIO.vehiculoSeleccionado;
    const pos = INVENTARIO.bloques[bloqueKey].posiciones[posKey];

    if (pos.ocupada) {
        alert('Esta posición ya está ocupada');
        return;
    }

    const partes = bloqueKey.split('_');
    v.playa = partes[0];
    v.bloque = partes[1];
    v.carril = pos.carril;
    v.posicion = pos.posicion;
    v.posicionAsignada = true;

    pos.ocupada = true;
    pos.chasis = v.chasis;

    actualizarPanelVehiculo();
    renderizarLayout();
    alert('¡Vehículo asignado exitosamente!');
}

// Actualizar estadísticas
function actualizarEstadisticas(playa, bloque) {
    let bloqueKey;
    
    if (esPlayaEspecial(playa)) {
        bloqueKey = playa;
    } else {
        bloqueKey = `${playa}_${bloque}`;
    }

    const bloqueObj = INVENTARIO.bloques[bloqueKey];
    let capacidad = 0;
    let ocupadas = 0;

    for (let posKey in bloqueObj.posiciones) {
        capacidad++;
        if (bloqueObj.posiciones[posKey].ocupada) {
            ocupadas++;
        }
    }

    const libres = capacidad - ocupadas;

    document.getElementById('statCapacidad').textContent = capacidad;
    document.getElementById('statLibres').textContent = libres;
    document.getElementById('statOcupados').textContent = ocupadas;
}

// Mostrar detalles del vehículo
function mostrarDetallesVehiculo(chasis) {
    const vehiculo = INVENTARIO.vehiculos.find(v => v.chasis === chasis);
    if (!vehiculo) return;

    const modal = document.getElementById('modalDetalles');
    const detalles = document.getElementById('detallesVehiculo');

    detalles.innerHTML = `
        <p><strong>Chasis:</strong> ${vehiculo.chasis}</p>
        <p><strong>Marca:</strong> ${vehiculo.marca}</p>
        <p><strong>Modelo:</strong> ${vehiculo.modelo}</p>
        <p><strong>Playa:</strong> ${vehiculo.playa}</p>
        <p><strong>Bloque:</strong> ${vehiculo.bloque}</p>
        <p><strong>Carril:</strong> ${vehiculo.carril}</p>
        <p><strong>Posición:</strong> ${vehiculo.posicion}</p>
    `;

    modal.style.display = 'flex';
}

// Cerrar modal
document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('modalDetalles').style.display = 'none';
});

window.addEventListener('click', function(event) {
    const modal = document.getElementById('modalDetalles');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});
