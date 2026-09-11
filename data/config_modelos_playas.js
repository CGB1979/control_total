// ============================================================
// REGLAS DE DESTINO POR MARCA / MODELO
// ============================================================
// Si un vehiculo coincide con una regla, Control Total sugiere
// automaticamente esa Playa y Bloque.
//
// Para agregar una regla:
// { marca: "Toyota", modelo: "Hilux", playaDestino: "A", bloqueDestino: "A" }
//
// Si queres que una marca/modelo pueda ir a varias playas, podes crear
// mas de una regla para la misma combinacion y luego ampliar el selector.
// ============================================================

const MAPEO_MODELOS_PLAYAS = [
    { marca: "Toyota", modelo: "Hilux", playaDestino: "A", bloqueDestino: "A" },
    { marca: "Toyota", modelo: "Corolla", playaDestino: "A", bloqueDestino: "B" },
    { marca: "Toyota", modelo: "Camry", playaDestino: "B", bloqueDestino: "A" },
    { marca: "Honda", modelo: "Civic", playaDestino: "B", bloqueDestino: "B" },
    { marca: "Honda", modelo: "Accord", playaDestino: "C", bloqueDestino: "A" },
    { marca: "Ford", modelo: "F-150", playaDestino: "C", bloqueDestino: "B" },
    { marca: "Chevrolet", modelo: "Silverado", playaDestino: "D", bloqueDestino: "A" },
    { marca: "Nissan", modelo: "Altima", playaDestino: "D", bloqueDestino: "B" },
    { marca: "Hyundai", modelo: "Elantra", playaDestino: "E", bloqueDestino: "A" },
    { marca: "Hyundai", modelo: "Tucson", playaDestino: "E", bloqueDestino: "B" },
    { marca: "SW4", modelo: "Todos", playaDestino: "I", bloqueDestino: "A" },
    { marca: "Volkswagen", modelo: "Golf", playaDestino: "F", bloqueDestino: "A" }
];
