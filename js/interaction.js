// ============================================
// MÓDULO DE INTERACCIONES
// ============================================

// Función auxiliar para crear datos de ejemplo
function crearDatosEjemplo() {
    return [
        { Chasis: "ABC123456789", Marca: "Toyota", Modelo: "Hilux", Playa: "Playa A", Bloque: "A", Carril: 1, Posicion: 1 },
        { Chasis: "DEF987654321", Marca: "Toyota", Modelo: "Corolla", Playa: "Playa A", Bloque: "B", Carril: 3, Posicion: 1 },
        { Chasis: "GHI112233445", Marca: "Honda", Modelo: "Civic", Playa: "Playa B", Bloque: "A", Carril: 5, Posicion: 2 },
        { Chasis: "JKL556677889", Marca: "Toyota", Modelo: "Camry", Playa: "Playa B", Bloque: "B", Carril: 1, Posicion: 1 },
        { Chasis: "MNO998877665", Marca: "Ford", Modelo: "F-150", Playa: "Playa C", Bloque: "A", Carril: 7, Posicion: 1 },
        { Chasis: "PQR111222333", Marca: "Honda", Modelo: "Accord", Playa: "Playa C", Bloque: "B", Carril: 9, Posicion: 2 },
        { Chasis: "STU444555666", Marca: "Chevrolet", Modelo: "Silverado", Playa: "", Bloque: "", Carril: "", Posicion: "" },
        { Chasis: "VWX777888999", Marca: "Nissan", Modelo: "Altima", Playa: "", Bloque: "", Carril: "", Posicion: "" },
        { Chasis: "YZA101112131", Marca: "Hyundai", Modelo: "Elantra", Playa: "Playa E", Bloque: "A", Carril: 11, Posicion: 1 },
        { Chasis: "BCD141516171", Marca: "SW4", Modelo: "Todos", Playa: "Playa I", Bloque: "", Carril: 1, Posicion: 1 }
    ];
}

// Función para exportar datos como JSON
function exportarInventario() {
    const datos = INVENTARIO.vehiculos.map(v => ({
        Chasis: v.chasis,
        Marca: v.marca,
        Modelo: v.modelo,
        Playa: v.playa,
        Bloque: v.bloque,
        Carril: v.carril,
        Posicion: v.posicion
    }));

    const json = JSON.stringify(datos, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventario_yms.json';
    a.click();
}

// Evento para cargar datos de ejemplo (descomentar en desarrollo)
/*
document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos de ejemplo automáticamente en desarrollo
    cargarInventario(crearDatosEjemplo());
});
*/
