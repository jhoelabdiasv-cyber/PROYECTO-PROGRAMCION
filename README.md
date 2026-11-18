# SIMTELE-WEB: Panel interactivo de prevención y monitoreo de Mi Teleférico

Proyecto académico de **Programación Web I**. Página única desarrollada con **HTML5, CSS3 y JavaScript puro**, sin frameworks ni librerías externas.

> **Aviso didáctico:** todos los datos, rangos, mediciones y umbrales son simulaciones educativas. **No son límites operativos reales de Mi Teleférico** ni deben utilizarse para tomar decisiones de seguridad.

## Integrantes del equipo

- Integrante 1: __________________________________
- Integrante 2: __________________________________
- Integrante 3: __________________________________
- Integrante 4: __________________________________

## Estructura de carpetas

```text
proyecto-simtele-web/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── app.js
└── README.md
```

## Módulos

1. **Detención de emergencia:** ingresa velocidad en km/h (0–120) y tiempo de reacción en segundos (0–60). Calcula `d = (v / 3.6) × t` y compara el resultado con el **umbral didáctico ficticio de 50 m**. Ejemplo: 72 km/h y 3 s → **60 m**.
2. **Mantenimiento:** agrega componentes con nombre, horas de uso (0–100 000) y estado (normal, revisión o urgente). Los registros se guardan en un arreglo de objetos usando `push()`, se muestran en una tabla dinámica y pueden eliminarse con `splice()`.
3. **Viento y oscilación:** introduce **exactamente cinco** mediciones ficticias (0–120 unidades simuladas), calcula suma, promedio y máximo usando arreglos, `for` y `forEach`. Clasifica el **promedio** como bajo (menos de 20), moderado (desde 20 y menos de 40) o alto (40 o más). Los rangos son didácticos, no reales.
4. **Sensores:** registra código, tipo y lectura (0–100 unidades didácticas). El código debe cumplir exactamente la expresión regular `/^SEN-\d{3}$/` usando `.test()`, por ejemplo `SEN-001`. Se validan campos vacíos, valores no numéricos y rangos. Los sensores válidos aparecen en una tabla y también pueden eliminarse.

## Instrucciones de uso

1. Abre **`index.html`** en un navegador moderno o ejecuta un servidor web local en esta carpeta.
2. Utiliza el menú superior para pasar a uno de los cuatro módulos.
3. Completa los formularios y presiona el botón del módulo. Los resultados y errores aparecen **sin recargar** la página.
4. En mantenimiento y sensores, presiona **Eliminar** para quitar una fila.
5. Los registros se guardan automáticamente en **`localStorage`** cuando el navegador lo permite. Para borrar todos los registros y resultados, utiliza el botón **Limpiar todos los datos guardados** del pie de página.

## Pruebas mínimas de aceptación

| Prueba | Pasos | Resultado esperado |
| --- | --- | --- |
| Detención | Velocidad `72`, tiempo `3`; calcular | **60 m** y aviso de que supera 50 m ficticios |
| Mantenimiento | Agregar `Polea A` y `Motor B`; eliminar una fila | Primero **2 filas**, después **1 fila** |
| Viento | Introducir `10`, `20`, `30`, `40`, `50` | **Promedio 30**, **máximo 50**, clasificación moderada |
| Sensores | Registrar `SEN-001` con tipo y lectura; intentar `SEN-1` y código vacío | Primer registro válido; los otros muestran errores y no se agregan |
| Adaptabilidad | Abrir en escritorio y vista móvil | Navegación, formularios, tablas y botones utilizables |

Pruebas negativas recomendadas: horas no numéricas, una medición vacía, valores fuera de rango, código de sensor incorrecto, lectura no numérica; no deben agregarse registros inválidos.

## Publicación y entrega en GitHub

1. Crea un repositorio público en GitHub y sube el contenido de esta carpeta **sin modificar las rutas** de `css/styles.css` y `js/app.js`.
2. En GitHub, abre **Settings → Pages → Build and deployment** y selecciona la rama principal (`main`) con carpeta raíz (`/root`).
3. Cuando GitHub Pages publique la página, prueba los cuatro módulos en la URL pública.
4. Entrega a la docente **dos enlaces**: URL pública de GitHub Pages y URL del repositorio. Esos enlaces deben generarse en la cuenta del equipo; no están incluidos artificialmente en este proyecto.

## Detalles técnicos

- Etiquetas semánticas `header`, `nav`, `main`, cuatro `section` y `footer`.
- Campos con `label` asociado, texto de ayuda y mensajes de error accesibles.
- `addEventListener` para todos los eventos y `preventDefault()` para evitar recargas.
- Diseño adaptable con media queries para celulares y escritorios.
- Persistencia exclusiva bajo la clave `simtele_web_datos_v1`, sin servidores externos.
- Renderizado de datos de usuario con `textContent` para evitar insertar HTML arbitrario.

**Importante:** el archivo abierto directamente puede tener restricciones de `localStorage` en algunos navegadores o modos privados. El resto de la aplicación seguirá funcionando durante la sesión; para una prueba de persistencia consistente, usa un servidor web local o GitHub Pages.
