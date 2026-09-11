# YMS - Control de Patio

## Importación de Excel

La aplicación utiliza **SheetJS (`xlsx`)** en el navegador para leer `.xlsx`, `.xls` y `.csv`.
No es necesario instalar Node ni `excel.js` para esta versión. La librería se carga desde jsDelivr en `index.html`.

> Si el entorno donde se ejecuta la aplicación no tiene Internet, descargue una copia de `xlsx.full.min.js` y colóquela localmente; luego cambie el `<script src="...">` de `index.html` por la ruta local.

### 1. Inventario base / mapa inicial

Seleccionar `Inventario base / mapa inicial`.

Columnas recomendadas:
- `Chasis`
- `Marca`
- `Modelo`
- `Playa`
- `Bloque`
- `Carril`
- `Posicion`

El archivo base reemplaza el inventario actual y marca como ocupadas las posiciones indicadas.

### 2. Reubicaciones / movimientos

Seleccionar `Reubicaciones / movimientos`.

Puede cargar filas con:
- `Chasis` + `Playa` + `Bloque` + `Carril` + `Posicion`: mueve el vehículo a esa posición.
- `Chasis` + `Marca` + `Modelo`: intenta ubicarlo automáticamente según `config_modelos_playas.js`.
- También se aceptan columnas de destino como `NuevaPlaya`, `NuevoBloque`, `NuevoCarril`, `NuevaPosicion` o sus variantes.

Si la posición solicitada está ocupada, el sistema **no pisa el vehículo existente**. Genera un conflicto y propone posiciones libres alternativas, priorizando el destino y luego otros bloques de la misma playa / el mapeo del modelo.

### 3. Escáner

- **Lector físico USB/Bluetooth:** funciona como teclado. El sistema escucha el flujo de teclas globalmente y procesa el código al recibir `Enter`, aunque el buscador no tenga foco.
- **Cámara:** el botón `▣ Escanear` intenta usar `BarcodeDetector` del navegador. Requiere permisos de cámara y normalmente HTTPS o localhost.

### Formato sugerido de archivos

**base.xlsx**
| Chasis | Marca | Modelo | Playa | Bloque | Carril | Posicion |
|---|---|---|---|---|---:|---:|
| ABC123 | Toyota | Hilux | Playa A | A | 1 | 1 |

**movimientos.xlsx**
| Chasis | NuevaPlaya | NuevoBloque | NuevoCarril | NuevaPosicion |
|---|---|---|---:|---:|
| ABC123 | Playa A | B | 3 | 2 |

El objetivo es que el archivo base sea el "estado maestro" y los archivos posteriores actualicen ese estado sin perder las posiciones ya cargadas.
