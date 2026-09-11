// ============================================================
// CONFIGURACION CENTRAL DE PLAYAS, BLOQUES Y CARRILES
// ============================================================
// ESTE ES EL ARCHIVO PRINCIPAL PARA MODIFICAR LA CAPACIDAD FISICA.
//
// Playa comun:
//   - carriles = cantidad de carriles FISICOS.
//   - cada carril tiene 2 posiciones.
//   - el numero visible del carril es IMPAR: 1, 3, 5, 7...
//   - ejemplo: carril fisico 1 -> posiciones 1 y 2.
//
// Playa especial:
//   - cada carril se numera normalmente: 1, 2, 3...
//   - cada carril tiene 5 posiciones.
//
// PARA AGREGAR / QUITAR PLAYAS: editar el array PLAYAS_CONFIG.
// PARA CAMBIAR CARRILES DE UNA PLAYA/BLOQUE: editar carriles del bloque.
// PARA BLOQUEAR UN CARRIL: agregar el numero a carrilesBloqueados.
//
// IMPORTANTE: en playas comunes, "3" significa el SEGUNDO carril fisico,
// no que falte el carril 2. El 2 existe como segunda posicion del carril 3.
// ============================================================

const BLOQUES_DISPONIBLES = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L",
    "M", "N", "O", "P", "Q", "X", "Y", "Z", "b1", "b2", "b3", "b4", "b5"
];

// Playas especiales actuales. Para agregar otra, incluir su nombre aqui
// y marcar tipo: "especial" en PLAYAS_CONFIG.
const PLAYAS_ESPECIALES = ["I", "J"];

const PLAYAS_CONFIG = [
    "A", "B", "C", "C1", "D", "E", "E2", "F", "G", "H", "I", "J",
    "K", "L", "M", "N", "O", "P", "Q", "X", "Y", "Z", "Perimetro", "Lateral"
].map(nombre => ({
    playa: nombre,
    tipo: PLAYAS_ESPECIALES.includes(nombre) ? "especial" : "comun",
    // ========================================================
    // ACA CAMBIAS LA CANTIDAD DE CARRILES DE UNA PLAYA ENTERA.
    // Por defecto: 100 carriles por bloque.
    // ========================================================
    carrilesPorDefecto: 100,
    bloques: BLOQUES_DISPONIBLES.map(bloque => ({
        nombre: bloque,
        // ACA podes poner una cantidad distinta SOLO para este bloque.
        // Ejemplo: { nombre: "C", carriles: 75, carrilesBloqueados: [12, 14] }
        carriles: 100,

        // ====================================================
        // ACA BLOQUEAS CARRILES POR COLUMNAS, LUCES, OBRAS, ETC.
        // Comun: usar los numeros de carril visibles (1,3,5,7...).
        // Especial: usar 1,2,3,4...
        // Ejemplo: carrilesBloqueados: [5, 11, 17]
        // ====================================================
        carrilesBloqueados: []
    }))
}));

function obtenerConfigPlaya(nombre) {
    return PLAYAS_CONFIG.find(p => p.playa === String(nombre || "").trim());
}

function obtenerConfigBloque(playa, bloque) {
    const p = obtenerConfigPlaya(playa);
    return p ? p.bloques.find(b => b.nombre === String(bloque || "").trim()) : null;
}

function esPlayaEspecial(nombre) {
    return PLAYAS_ESPECIALES.includes(String(nombre || "").trim().toUpperCase());
}
