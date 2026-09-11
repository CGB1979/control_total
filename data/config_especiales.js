// Configuración de playas especiales (no espalda con espalda)
const CONFIG_ESPECIALES = [
    {
        playa: "Playa I",
        tipo: "especial",
        descripcion: "Playas especiales - Almacenamiento de vehículos especiales",
        carriles: 60,
        posicionesPorCarril: 5,
        estructura: "lineal"
    }
];

// Playas comunes (espalda con espalda)
const CONFIG_PLAYAS_COMUNES = [
    {
        playa: "Playa A",
        tipo: "comun",
        bloques: ["A", "B"],
        carriles: 150,
        posicionesPorCarril: 2
    },
    {
        playa: "Playa B",
        tipo: "comun",
        bloques: ["A", "B"],
        carriles: 140,
        posicionesPorCarril: 2
    },
    {
        playa: "Playa C",
        tipo: "comun",
        bloques: ["A", "B"],
        carriles: 150,
        posicionesPorCarril: 2
    },
    {
        playa: "Playa D",
        tipo: "comun",
        bloques: ["A", "B"],
        carriles: 145,
        posicionesPorCarril: 2
    },
    {
        playa: "Playa E",
        tipo: "comun",
        bloques: ["A", "B"],
        carriles: 135,
        posicionesPorCarril: 2
    },
    {
        playa: "Playa F",
        tipo: "comun",
        bloques: ["A", "B"],
        carriles: 125,
        posicionesPorCarril: 2
    }
];

// Obtener si una playa es especial
function esPlayaEspecial(nombrePlaya) {
    return CONFIG_ESPECIALES.some(p => p.playa === nombrePlaya);
}

// Obtener configuración de playa especial
function getConfigPlayaEspecial(nombrePlaya) {
    return CONFIG_ESPECIALES.find(p => p.playa === nombrePlaya);
}

// Obtener configuración de playa común
function getConfigPlayaComun(nombrePlaya) {
    return CONFIG_PLAYAS_COMUNES.find(p => p.playa === nombrePlaya);
}
