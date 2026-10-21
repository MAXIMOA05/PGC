/**
 * @file app.js
 * @description Lógica del prototipo Agile Mind (Ciclo 1): temporizador Pomodoro con
 * transición manual entre modos, gestión de tareas en memoria, contador de pérdidas
 * de foco mediante la Page Visibility API, configuración de duraciones, consentimiento
 * informado, código de participante y valoración de concentración.
 * Correspondencia con el pseudocódigo: ver README.md, sección "Trazabilidad".
 */

// =====================================================================
// ESTADO DEL TEMPORIZADOR                                (Pseudocódigo B1)
// =====================================================================
let tiempoConcentracion = 25
let tiempoDescansoCorto = 5
let tiempoDescansoLargo = 15
let modoActual = 'concentracion'
let segundos = tiempoConcentracion * 60
let corriendo = false
let intervalo = null

const display = document.getElementById('tiempo')
const btnIniciar = document.getElementById('btn-iniciar')
const btnReiniciar = document.getElementById('btn-reiniciar')
let contextoAudio = null   // se crea con el primer clic en Iniciar (política de reproducción del navegador)

/**
 * Prepara el contexto de audio. Debe llamarse desde un clic del usuario, porque los
 * navegadores no permiten reproducir sonido sin una interacción previa.
 */
function prepararAudio() {
    const ContextoAudio = window.AudioContext || window.webkitAudioContext
    if (!ContextoAudio) return
    if (!contextoAudio) contextoAudio = new ContextoAudio()
    if (contextoAudio.state === 'suspended') contextoAudio.resume()
}

/**
 * Genera la señal sonora de fin de lapso con la Web Audio API: tres tonos cortos
 * de 880 Hz. El sonido se sintetiza en el navegador; no se usa ningún archivo externo.
 */
function reproducirAviso() {
    if (!contextoAudio) return
    const inicio = contextoAudio.currentTime
    for (let i = 0; i < 3; i++) {
        const oscilador = contextoAudio.createOscillator()
        const volumen = contextoAudio.createGain()
        oscilador.type = 'sine'
        oscilador.frequency.value = 880
        const t = inicio + i * 0.35
        volumen.gain.setValueAtTime(0.0001, t)
        volumen.gain.exponentialRampToValueAtTime(0.3, t + 0.02)
        volumen.gain.exponentialRampToValueAtTime(0.0001, t + 0.25)
        oscilador.connect(volumen)
        volumen.connect(contextoAudio.destination)
        oscilador.start(t)
        oscilador.stop(t + 0.26)
    }
}

/**
 * Devuelve la duración configurada, en minutos, del modo indicado.
 * @param {string} modo - 'concentracion', 'descansoCorto' o 'descansoLargo'.
 * @returns {number} Minutos configurados para ese modo.
 */
function duracionDe(modo) {
    if (modo === 'descansoCorto') return tiempoDescansoCorto
    if (modo === 'descansoLargo') return tiempoDescansoLargo
    return tiempoConcentracion
}

/** Muestra el tiempo restante en formato mm:ss. */
function mostrarTiempo() {
    const mins = Math.floor(segundos / 60)
    const segs = segundos % 60
    display.textContent = String(mins).padStart(2, '0') + ':' + String(segs).padStart(2, '0')
}

/** Resalta en la interfaz el botón del modo activo. */
function marcarModoActivo() {
    document.querySelectorAll('#modos button').forEach(function(boton) {
        boton.classList.toggle('activo', boton.dataset.modo === modoActual)
    })
}

/**
 * Detiene la cuenta regresiva y fija la duración del modo indicado.
 * También reinicia el contador de pérdidas de foco, que se cuenta por lapso.
 * @param {string} modo - Modo que pasa a estar activo.
 */
function cambiarModo(modo) {
    clearInterval(intervalo)
    corriendo = false
    modoActual = modo
    segundos = duracionDe(modo) * 60
    btnIniciar.textContent = 'Iniciar'
    btnIniciar.disabled = false
    marcarModoActivo()
    mostrarTiempo()
    reiniciarDistracciones()
}

/**
 * Se ejecuta cuando la cuenta regresiva llega a cero: detiene el temporizador,
 * reproduce el aviso sonoro y, solo en modo concentración, solicita la valoración.
 * El sistema no cambia de modo por sí solo (transición manual).
 */
function finalizarLapso() {
    clearInterval(intervalo)
    corriendo = false
    btnIniciar.textContent = 'Iniciar'
    btnIniciar.disabled = true
    reproducirAviso()
    if (modoActual === 'concentracion') {
        mostrarValoracion()
    } else {
        alert('¡Tiempo de descanso terminado!')
    }
}

// Iniciar / Pausar: un solo botón que alterna su función.        (Pseudocódigo B3)
btnIniciar.addEventListener('click', function() {
    if (corriendo) {
        corriendo = false
        clearInterval(intervalo)
        btnIniciar.textContent = 'Iniciar'
        return
    }
    if (segundos <= 0) return
    prepararAudio()
    corriendo = true
    btnIniciar.textContent = 'Pausar'
    intervalo = setInterval(function() {               // (Pseudocódigo B4)
        segundos--
        mostrarTiempo()
        if (segundos <= 0) finalizarLapso()
    }, 1000)
})

// Reiniciar: vuelve a la duración configurada del modo activo.  (Pseudocódigo B5)
btnReiniciar.addEventListener('click', function() {
    cambiarModo(modoActual)
})

// Cambio manual de modo.                                        (Pseudocódigo B6)
document.getElementById('btn-concentracion').addEventListener('click', function() {
    cambiarModo('concentracion')
})
document.getElementById('btn-descanso-corto').addEventListener('click', function() {
    cambiarModo('descansoCorto')
})
document.getElementById('btn-descanso-largo').addEventListener('click', function() {
    cambiarModo('descansoLargo')
})

// =====================================================================
// GESTIÓN DE TAREAS (en memoria, no persiste)
// =====================================================================
const inputTarea = document.getElementById('input-tarea')
const listaTareas = document.getElementById('lista-tareas')

/**
 * Agrega una tarea a la lista con su prioridad y número estimado de pomodoros.
 * El número estimado es informativo: no se vincula al temporizador.
 */
function agregarTarea() {
    const texto = inputTarea.value.trim()
    if (texto === '') return
    const prioridad = document.getElementById('input-prioridad').value
    const pomodoros = document.getElementById('input-pomodoros').value
    const iconos = { alta: '🔴', media: '🟡', baja: '🟢' }

    const li = document.createElement('li')
    const spanTexto = document.createElement('span')
    spanTexto.textContent = iconos[prioridad] + ' ' + texto   // textContent evita inyectar HTML
    const spanPomodoros = document.createElement('span')
    spanPomodoros.textContent = '🍅 ' + pomodoros
    const btnListo = document.createElement('button')
    btnListo.className = 'btn-listo'
    btnListo.textContent = 'Listo'
    btnListo.addEventListener('click', function() {
        const completada = li.classList.toggle('completada')
        btnListo.textContent = completada ? 'Deshacer' : 'Listo'
    })
    li.append(spanTexto, spanPomodoros, btnListo)
    listaTareas.appendChild(li)
    inputTarea.value = ''
}

document.getElementById('btn-agregar').addEventListener('click', agregarTarea)
inputTarea.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') agregarTarea()
})

// =====================================================================
// REGISTRO DE PÉRDIDAS DE FOCO (Page Visibility API)     (Pseudocódigo B7)
// Solo cuenta cuando la pestaña se oculta, el temporizador está en marcha
// y el modo activo es concentración. No distingue el motivo de la salida.
// =====================================================================
let distracciones = 0
const contadorDistracciones = document.getElementById('contador-distracciones')
const avisoDistraccion = document.getElementById('aviso-distraccion')

/** Pone en cero el contador de pérdidas de foco y borra el aviso. */
function reiniciarDistracciones() {
    distracciones = 0
    contadorDistracciones.textContent = '0'
    avisoDistraccion.textContent = ''
}

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        if (corriendo && modoActual === 'concentracion') {
            distracciones++
            contadorDistracciones.textContent = distracciones
        }
    } else if (modoActual === 'concentracion' && distracciones > 0) {
        avisoDistraccion.textContent = '⚠️ Saliste de la pestaña ' + distracciones +
            ' veces en este lapso de concentración'
    }
})

// =====================================================================
// CONFIGURACIÓN DE DURACIONES (persiste en localStorage)  (Pseudocódigo B8)
// =====================================================================
const KEY_CONFIG = 'ma_config'
const modalConfig = document.getElementById('modal-config')

/** Comprueba que un valor sea un entero dentro del rango indicado. */
function enRango(valor, min, max) {
    return Number.isInteger(valor) && valor >= min && valor <= max
}

/** Copia las duraciones vigentes a los campos del formulario de configuración. */
function mostrarConfigEnFormulario() {
    document.getElementById('config-concentracion').value = tiempoConcentracion
    document.getElementById('config-descanso-corto').value = tiempoDescansoCorto
    document.getElementById('config-descanso-largo').value = tiempoDescansoLargo
}

/** Carga las duraciones guardadas, si existen y son válidas. */
function cargarConfig() {
    try {
        const guardada = JSON.parse(localStorage.getItem(KEY_CONFIG))
        if (guardada && enRango(guardada.concentracion, 1, 60) &&
            enRango(guardada.descansoCorto, 1, 30) && enRango(guardada.descansoLargo, 1, 60)) {
            tiempoConcentracion = guardada.concentracion
            tiempoDescansoCorto = guardada.descansoCorto
            tiempoDescansoLargo = guardada.descansoLargo
        }
    } catch (e) { /* configuración ausente o dañada: se usan los valores por defecto */ }
    mostrarConfigEnFormulario()
}

document.getElementById('btn-config').addEventListener('click', function() {
    mostrarConfigEnFormulario()
    modalConfig.style.display = 'flex'
})

document.getElementById('btn-cerrar-config').addEventListener('click', function() {
    modalConfig.style.display = 'none'
})

document.getElementById('btn-guardar-config').addEventListener('click', function() {
    const c = parseInt(document.getElementById('config-concentracion').value, 10)
    const dc = parseInt(document.getElementById('config-descanso-corto').value, 10)
    const dl = parseInt(document.getElementById('config-descanso-largo').value, 10)
    if (!enRango(c, 1, 60) || !enRango(dc, 1, 30) || !enRango(dl, 1, 60)) {
        alert('Valores no válidos. Concentración: 1 a 60 min; descanso corto: 1 a 30 min; descanso largo: 1 a 60 min.')
        return
    }
    tiempoConcentracion = c
    tiempoDescansoCorto = dc
    tiempoDescansoLargo = dl
    localStorage.setItem(KEY_CONFIG, JSON.stringify({ concentracion: c, descansoCorto: dc, descansoLargo: dl }))
    cambiarModo(modoActual)
    modalConfig.style.display = 'none'
})

// =====================================================================
// CONSENTIMIENTO, CÓDIGO DE PARTICIPANTE Y VALORACIÓN    (Pseudocódigo B2, B9)
// =====================================================================
const KEY_CONSENTIMIENTO = 'ma_consentimiento'
const KEY_PARTICIPANTE = 'ma_participante'
const KEY_VALORACIONES = 'ma_valoraciones'

function mostrarModal(id) {
    document.getElementById(id).style.display = 'flex'
}

function ocultarModal(id) {
    document.getElementById(id).style.display = 'none'
}

/** Punto de entrada: exige el consentimiento antes de habilitar la aplicación. */
function iniciarApp() {
    cargarConfig()
    cambiarModo('concentracion')
    if (!localStorage.getItem(KEY_CONSENTIMIENTO)) {
        mostrarModal('modal-consentimiento')
    } else {
        asegurarParticipante()
    }
}

document.getElementById('btn-aceptar').addEventListener('click', function() {
    localStorage.setItem(KEY_CONSENTIMIENTO, 'true')
    ocultarModal('modal-consentimiento')
    asegurarParticipante()
})

document.getElementById('btn-rechazar').addEventListener('click', function() {
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;padding:2rem;"><div><h2>Participación cancelada</h2><p style="color:#666;margin-top:1rem;">Para usar Agile Mind es necesario aceptar el consentimiento informado. Puedes cerrar esta ventana.</p></div></div>'
})

/** Genera (una sola vez) un código anónimo con crypto.randomUUID() y lo muestra. */
function asegurarParticipante() {
    let codigo = localStorage.getItem(KEY_PARTICIPANTE)
    if (!codigo) {
        codigo = crypto.randomUUID()
        localStorage.setItem(KEY_PARTICIPANTE, codigo)
    }
    document.getElementById('codigo-participante').textContent = codigo
}

function mostrarValoracion() {
    mostrarModal('modal-valoracion')
}

/**
 * Guarda la valoración de concentración (1 a 5) con fecha, código de participante
 * y número de pérdidas de foco del lapso.
 * @param {number} valor - Valoración seleccionada por el estudiante.
 */
function guardarValoracion(valor) {
    const valoraciones = JSON.parse(localStorage.getItem(KEY_VALORACIONES) || '[]')
    valoraciones.push({
        valor: valor,
        fecha: new Date().toISOString(),
        participante: localStorage.getItem(KEY_PARTICIPANTE),
        distracciones: distracciones
    })
    localStorage.setItem(KEY_VALORACIONES, JSON.stringify(valoraciones))
    ocultarModal('modal-valoracion')
}

iniciarApp()
