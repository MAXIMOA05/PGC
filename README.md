# Agile Mind — Prototipo funcional (Ciclo 1)

Prototipo web de apoyo a sesiones de estudio mediante la Técnica Pomodoro y el registro de
pérdidas de foco de la pestaña del navegador. Proyecto de Gestión del Conocimiento (PGC),
Ingeniería de Sistemas y Computación, Universidad de Cundinamarca, seccional Ubaté.

Autores: Santiago López Forero y Andrea Valentina Rodríguez Ladino.

## Alcance de esta versión

- Aplicación de una sola capa (frontend): HTML, CSS y JavaScript ES6, sin backend ni base de datos.
- La transición entre modos es **manual**: el sistema no cuenta ciclos ni cambia de modo por sí solo.
- El contador **solo cuenta** las veces que la pestaña se oculta (Page Visibility API) mientras el
  temporizador está en marcha en modo concentración. No detecta el uso del celular, de un segundo
  monitor ni de programas de escritorio, y no distingue el motivo de la salida.
- No accede a cámara, micrófono ni sensores del dispositivo.

## Cómo ejecutarlo

1. Abrir la versión publicada: https://maximoa05.github.io/PGC/ (etiqueta `v1.0-ciclo1`), o
2. Descargar el repositorio y abrir `index.html` en un navegador actualizado (Chrome, Edge o Firefox).

Para repetir el flujo desde el consentimiento, borrar los datos del sitio en el navegador
(Herramientas de desarrollo → Aplicación → Almacenamiento local).

## Estructura de archivos

| Archivo | Contenido |
|---|---|
| `index.html` | Estructura de la interfaz y ventanas modales |
| `css/estilos.css` | Estilos |
| `js/app.js` | Lógica del prototipo. La señal sonora se genera con la Web Audio API, sin archivos de audio externos |

## Módulos y estado

| # | Módulo | Estado |
|---|---|---|
| 1 | Temporizador (tres modos, iniciar/pausar, reiniciar) | Implementado |
| 2 | Gestión de tareas (en memoria, no persiste) | Implementado |
| 3 | Registro de pérdidas de foco | Implementado |
| 4 | Configuración de duraciones (persiste en el navegador) | Implementado |
| 5 | Consentimiento informado | Implementado |
| 6 | Código de participante anónimo (`crypto.randomUUID()`) | Implementado |
| 7 | Verificación de prueba previa (PDAC) | Proyectado, no incluido en esta versión |
| 8 | Valoración de concentración (1 a 5) | Implementado |

## Datos almacenados en el navegador (localStorage)

| Clave | Contenido |
|---|---|
| `ma_consentimiento` | Aceptación del consentimiento |
| `ma_participante` | Código anónimo del participante |
| `ma_config` | Duraciones configuradas |
| `ma_valoraciones` | Valoración, fecha, código y pérdidas de foco del lapso |

Las tareas y el contador en curso se pierden al cerrar o recargar la pestaña.

## Trazabilidad pseudocódigo ↔ código

| Bloque | Pseudocódigo | Implementación en `js/app.js` |
|---|---|---|
| B1 | Estado del temporizador | variables iniciales, `duracionDe()`, `mostrarTiempo()` |
| B2 | Arranque: consentimiento y código | `iniciarApp()`, listeners de `btn-aceptar` y `btn-rechazar`, `asegurarParticipante()` |
| B3 | Iniciar / Pausar | listener de `btnIniciar` |
| B4 | Tic de un segundo y fin del lapso | `setInterval` dentro de `btnIniciar`, `finalizarLapso()` |
| B5 | Reiniciar | listener de `btnReiniciar` → `cambiarModo(modoActual)` |
| B6 | Cambio manual de modo | listeners de los tres botones de modo, `cambiarModo()`, `marcarModoActivo()` |
| B7 | Registro de pérdidas de foco | listener de `visibilitychange`, `reiniciarDistracciones()` |
| B8 | Configuración | `cargarConfig()`, listener de `btn-guardar-config` |
| B9 | Valoración de concentración | `mostrarValoracion()`, `guardarValoracion()` |

## Funcionalidades proyectadas (no implementadas)

Prueba Digital de Atención y Concentración (PDAC), escala SUS, registro con alias, semestre,
programa y correo, panel de control, estadísticas, base de datos con servidor, agente
conversacional (LLM), visión por computador (YOLOv8), aprendizaje profundo y gamificación con avatar.
