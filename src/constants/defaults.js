/**
 * defaults.js
 * ─────────────────────────────────────────────────────────────────
 * Fuente de verdad para los valores por defecto de todos los settings
 * y del estado de progreso del usuario.
 * 
 * Estos objetos se usan para:
 *   1. Inicializar el estado en el primer uso (sin localStorage)
 *   2. Como fallback cuando un setting está ausente en localStorage
 *   3. Para el botón "Restaurar valores por defecto"
 * 
 * IMPORTANTE: Si se agrega un nuevo setting, se debe agregar aquí
 * con su valor por defecto para que la app funcione correctamente.
 * ─────────────────────────────────────────────────────────────────
 */

/**
 * Configuración por defecto de todos los parámetros de la sesión.
 * Ver spec completa en la sección 3 del documento de producto.
 */
export const DEFAULT_SETTINGS = {
  // ── Tipo de ejercicio ───────────────────────────────────────
  // 'koch_g4fon' | 'koch_lcwo' | 'koch_custom' | 'custom_string' |
  // 'words_custom' | 'words_custom_g4fon' | 'words_custom_lcwo'
  exerciseType: 'koch_g4fon',

  // ── Velocidad ───────────────────────────────────────────────
  // Velocidad de los caracteres individuales (no del texto completo con espacios)
  speedValue: 20,
  speedUnit: 'wpm',  // 'wpm' | 'cpm'

  // ── Estructura de la sesión ─────────────────────────────────
  exerciseDuration: 300,    // Duración total en segundos (5 minutos)
  wordLength: 5,            // Caracteres por grupo Koch
  wordLengthMode: 'fixed',  // 'fixed' | 'variable' (random entre 1 y wordLength)
  startPause: 3,            // Pausa inicial antes de empezar a transmitir (segundos)

  // ── Koch level ──────────────────────────────────────────────
  // Cantidad de caracteres activos de la secuencia Koch.
  // Nivel 2 = los primeros 2 caracteres (K y M en G4FON).
  kochLevel: 2,

  // ── Hard letters ────────────────────────────────────────────
  // Caracteres marcados manualmente como "difíciles" → aparecen 3× más
  hardLetters: [],
  // Si true: los últimos 2 caracteres del nivel actual son automáticamente hard
  autoHardLetters: true,

  // ── Spacing (Farnsworth) ────────────────────────────────────
  // Multiplicadores sobre el timing estándar.
  // 1.0 = estándar ITU. 2.0 = el doble de espacio. 0.5 = la mitad.
  // Cada uno es independiente: podés extender el espacio entre palabras
  // sin afectar el espacio entre caracteres dentro de cada palabra.
  charSpacing: 1.0,  // Multiplica el inter-carácter (3 dots → N×3 dots)
  wordSpacing: 1.0,  // Multiplica el inter-palabra  (7 dots → N×7 dots)

  // ── Audio / Tono ─────────────────────────────────────────────
  sidetoneFrequency: 600, // Hz — frecuencia principal del tono CW
  dotPitch: 0,            // Hz — si > 0, los dots usan esta frecuencia (vs dashes)
  toneAttack: 5,          // ms — fade-in del tono (evita clicks audibles)
  toneRelease: 5,         // ms — fade-out del tono (evita clicks audibles)
  dashDotRatio: 3.0,      // Ratio duración dash/dot (estándar ITU = 3.0)
  volume: 80,             // % de volumen (0-100)

  // ── Visualización ───────────────────────────────────────────
  // Si true: los caracteres enviados aparecen solo al FINAL del grupo,
  //          no uno a uno mientras suenan (entrena "head copy")
  groupPrint: false,
  // Segundos de delay entre fin del audio y la aparición del texto (head copy)
  groupPrintDelay: 0,
  // Tamaño de fuente del display principal: 'small'|'medium'|'large'|'xlarge'
  fontSize: 'medium',
  // Mantener la pantalla activa durante la sesión (Screen Wake Lock API)
  keepScreenOn: true,

  // ── Speech / Text-to-Speech ──────────────────────────────────
  // 'none' | 'itu_phonetic' | 'short_letters' | 'tts_read'
  speechMode: 'none',
  speechLang: 'en-US',   // Código de idioma para la Web Speech API
  timeBeforeSpeech: 1.5, // Segundos entre fin del audio CW y la voz
  timeAfterSpeech: 1.0,  // Segundos después de la voz antes del siguiente grupo

  // ── Custom string ────────────────────────────────────────────
  // Texto personalizado para los modos 'custom_string' y 'words_*'
  customString: '',

  // ── Presets de usuario ───────────────────────────────────────
  // Array de hasta 5 configuraciones guardadas.
  // Cada preset: { id: string, name: string, settings: {...} }
  userPresets: [],
};

/**
 * Estado de progreso por defecto.
 * Se acumula a través de sesiones y persiste en localStorage.
 */
export const DEFAULT_PROGRESS = {
  // Estadísticas por carácter (acumuladas de todas las sesiones)
  // Estructura: { [char]: { correct: number, total: number } }
  // Ejemplo: { 'K': { correct: 45, total: 50 }, 'M': { correct: 38, total: 50 } }
  characterStats: {},

  // Historial de sesiones (últimas 100).
  // Cada sesión es un snapshot completo para poder graficar evolución.
  sessionHistory: [],
  // Estructura de cada entrada en sessionHistory:
  // {
  //   id:              string (UUID simple),
  //   date:            string (ISO 8601),
  //   exerciseType:    string,
  //   kochLevel:       number,
  //   speedValue:      number,
  //   speedUnit:       string,
  //   accuracy:        number (0-100, promedio de la sesión),
  //   totalChars:      number,
  //   correctChars:    number,
  //   durationSeconds: number,
  //   characterScores: { [char]: { correct, total } },
  // }

  // ── Estadísticas globales ────────────────────────────────────
  totalTrainingTime: 0,  // Segundos totales de práctica
  totalSessions: 0,       // Cantidad de sesiones completadas
  firstSessionDate: null, // ISO string de la primera sesión
  lastSessionDate: null,  // ISO string de la última sesión
};

/**
 * Fusiona settings guardados en localStorage con los defaults.
 * Garantiza que si se agregan nuevos settings en el futuro,
 * los usuarios con datos viejos no pierdan funcionalidad.
 * 
 * @param {object} saved - Settings leídos de localStorage (pueden estar incompletos)
 * @returns {object}       Settings completos con defaults para lo que falte
 */
export function mergeWithDefaults(saved) {
  if (!saved || typeof saved !== 'object') return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...saved };
}

/**
 * Fusiona progreso guardado con los defaults.
 * 
 * @param {object} saved - Progreso leído de localStorage
 * @returns {object}       Progreso completo
 */
export function mergeProgressWithDefaults(saved) {
  if (!saved || typeof saved !== 'object') return { ...DEFAULT_PROGRESS };
  return {
    ...DEFAULT_PROGRESS,
    ...saved,
    // Los objetos anidados necesitan merge explícito para no ser reemplazados
    characterStats: saved.characterStats ?? {},
    sessionHistory:  saved.sessionHistory  ?? [],
  };
}
