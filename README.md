# Control Total - YMS

## Objetivo

El sistema trabaja con dos fuentes de Excel y una estructura física configurada internamente:

1. **Vehículos nuevos**: Planta envía VIN/Chasis + Marca + Modelo. No tienen posición.
2. **Planilla del escáner**: informa ubicaciones y permite actualizar/reubicar el inventario.
3. **Configuración de patio**: playas, bloques, cantidad de carriles y carriles bloqueados. Está en `data/config_playas.js` y NO se carga desde Excel.

## Flujo de operación

- Cargar una vez la planilla de Vehículos Nuevos.
- Llegan los vehículos al control.
- Escanear el VIN con lector USB/Bluetooth. El lector puede funcionar sin foco en el campo.
- El sistema busca VIN + Marca + Modelo.
- Si existe una regla en `data/config_modelos_playas.js`, sugiere Playa/Bloque.
- Muestra la primera posición libre de ese destino.
- El operador puede asignarla o hacer click sobre cualquier posición libre del visor para reemplazar la sugerencia y asignar manualmente.
- Cuando se recibe una planilla del escáner, se procesa como actualización del estado físico. Si una posición indicada está ocupada, se informa el conflicto y se muestran alternativas libres del mismo bloque.

## Configurar playas, bloques y capacidad

Editar solamente `data/config_playas.js`.

### Cambiar capacidad de una playa

Cada playa tiene `carrilesPorDefecto: 100`.

### Cambiar solamente un bloque

Dentro del bloque se puede colocar, por ejemplo:

```js
{ nombre: "C", carriles: 75, carrilesBloqueados: [] }
```

### Bloquear carriles

En una playa común, los carriles visibles son impares porque cada carril físico tiene dos posiciones:

`1, 3, 5, 7, 9...`

Ejemplo:

```js
carrilesBloqueados: [11, 23, 47]
```

En una playa especial se numeran normalmente:

`1, 2, 3, 4, 5...`

Ejemplo:

```js
carrilesBloqueados: [4, 8, 12]
```

Un carril bloqueado no genera posiciones disponibles.

## Playas especiales

Actualmente `I` y `J` están definidas como especiales.

- Comunes: 2 posiciones por carril.
- Especiales: 5 posiciones por carril.

## Reglas Marca/Modelo

Editar `data/config_modelos_playas.js`.

Ejemplo:

```js
{ marca: "Toyota", modelo: "Hilux", playaDestino: "A", bloqueDestino: "A" }
```

## Excel aceptado

El lector de Excel admite `.xlsx`, `.xls`, `.csv` y `.json`.

### Vehículos nuevos

Columnas recomendadas:

- `Numero de chasis` (también reconoce `Chasis` o `VIN`)
- `Marca`
- `Modelo`

### Planilla del escáner

Reconoce:

- `Numero de chasis` / `Chasis` / `VIN`
- `Marca`
- `Modelo`
- `Playa`
- `Bloque`
- `Carril`
- `Posicion`

También tolera `Posición` con tilde.

## Persistencia

Por ahora el estado se guarda en `localStorage` del navegador. Esto permite cerrar y volver a abrir la aplicación en la misma PC/navegador sin perder el inventario.

Para sincronizar varias PCs o conectar el escáner directamente a una base central, el siguiente paso es reemplazar esta persistencia local por una API/base de datos compartida.

## Excel.js / XLSX

El proyecto usa SheetJS (`xlsx`) para leer Excel en el navegador. Actualmente se carga desde CDN en `index.html`. Si la instalación debe funcionar totalmente offline, guardar una copia local de `xlsx.full.min.js` y cambiar el `<script src=...>` por una ruta local.
