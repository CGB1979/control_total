// ============================================================
// INTERACCIONES AUXILIARES
// ============================================================
// La asignacion real vive en inventory.js. Este archivo mantiene
// acciones de interfaz para que sea facil ampliar botones futuros.

function exportarInventario() {
    const datos = INVENTARIO.vehiculos.map(v => ({
        "Numero de chasis": v.chasis,
        "Marca": v.marca,
        "Modelo": v.modelo,
        "Playa": v.playa,
        "Bloque": v.bloque,
        "Carril": v.carril,
        "Posicion": v.posicion
    }));
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "control_total_inventario.json";
    a.click();
    URL.revokeObjectURL(a.href);
}
