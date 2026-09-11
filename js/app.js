// ============================================
// MÓDULO PRINCIPAL DE APLICACIÓN
// ============================================

// Función de inicialización principal
function initializeApp() {
    // Inicializar estructura de playas
    inicializarEstructuraPlayas();
    
    // Cargar datos de ejemplo (comentar en producción)
    // cargarInventario(crearDatosEjemplo());
    
    // Actualizar selectores
    actualizarSelectoresPlayas();
}

// Esperar a que todos los scripts se carguen
document.addEventListener('DOMContentLoaded', function() {
    // Ya se ejecutó checkSession desde login.js
    // Si la sesión es válida, se llamará a initializeApp desde login.js
});
