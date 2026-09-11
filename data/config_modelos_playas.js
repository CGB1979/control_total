// Configuración de mapeo: Marca/Modelo -> Playa/Bloque destino
const MAPEO_MODELOS_PLAYAS = [
    { marca: "Toyota", modelo: "Hilux", playaDestino: "Playa A", bloqueDestino: "A", posicionesMax: 300 },
    { marca: "Toyota", modelo: "Corolla", playaDestino: "Playa A", bloqueDestino: "B", posicionesMax: 250 },
    { marca: "Toyota", modelo: "Camry", playaDestino: "Playa B", bloqueDestino: "A", posicionesMax: 280 },
    { marca: "Honda", modelo: "Civic", playaDestino: "Playa B", bloqueDestino: "B", posicionesMax: 250 },
    { marca: "Honda", modelo: "Accord", playaDestino: "Playa C", bloqueDestino: "A", posicionesMax: 240 },
    { marca: "Ford", modelo: "F-150", playaDestino: "Playa C", bloqueDestino: "B", posicionesMax: 300 },
    { marca: "Chevrolet", modelo: "Silverado", playaDestino: "Playa D", bloqueDestino: "A", posicionesMax: 290 },
    { marca: "Nissan", modelo: "Altima", playaDestino: "Playa D", bloqueDestino: "B", posicionesMax: 260 },
    { marca: "Hyundai", modelo: "Elantra", playaDestino: "Playa E", bloqueDestino: "A", posicionesMax: 270 },
    { marca: "Hyundai", modelo: "Tucson", playaDestino: "Playa E", bloqueDestino: "B", posicionesMax: 280 },
    { marca: "SW4", modelo: "Todos", playaDestino: "Playa I", bloqueDestino: "A", posicionesMax: 200 },
    { marca: "Volkswagen", modelo: "Golf", playaDestino: "Playa F", bloqueDestino: "A", posicionesMax: 250 }
];

// Regla de negocio configurable: true = MAX (más libres), false = MIN (más llenos)
const ALGORITMO_MODO_MAX = true;
