/**
 * defaults.js
 * ─────────────────────────────────────────────────────────────────
 * Fuente de verdad para todos los settings y el estado de progreso.
 *
 * Cuando se agrega un setting nuevo, siempre agregarlo acá con su
 * default. mergeWithDefaults() garantiza retrocompatibilidad con
 * datos guardados en versiones anteriores.
 * ─────────────────────────────────────────────────────────────────
 */

// ── Opciones discretas reutilizadas en la UI ──────────────────────
// Centralizar acá evita que la UI y los defaults diverjan.

/** Opciones de duración de ejercicio (valor en segundos, label para UI) */
export const DURATION_OPTIONS = [
  { value: 10,   label: '10 seg' },
  { value: 30,   label: '30 seg' },
  { value: 60,   label: '1 min'  },
  { value: 120,  label: '2 min'  },
  { value: 180,  label: '3 min'  },
  { value: 300,  label: '5 min'  },
  { value: 600,  label: '10 min' },
];

/** Opciones de longitud de grupo (valor en cantidad de letras, label para UI) */
export const WORD_LENGTH_OPTIONS = [
  { value: 0,  label: 'Variable' },  // 0 = modo variable
  { value: 1,  label: '1 letra'  },
  { value: 2,  label: '2 letras' },
  { value: 3,  label: '3 letras' },
  { value: 4,  label: '4 letras' },
  { value: 5,  label: '5 letras' },
  { value: 6,  label: '6 letras' },
  { value: 7,  label: '7 letras' },
  { value: 8,  label: '8 letras' },
];

/** Opciones de pausa inicial (valor en segundos) */
export const START_PAUSE_OPTIONS = [
  { value: 0, label: '0 seg' },
  { value: 1, label: '1 seg' },
  { value: 2, label: '2 seg' },
  { value: 3, label: '3 seg' },
  { value: 5, label: '5 seg' },
];

/**
 * Opciones de dot pitch.
 * IZ2UUF usa opciones relativas al sidetone, no Hz absolutos.
 * Valor 0 = igual al sidetone (desactivado como frecuencia separada).
 * Valores positivos = multiplicador sobre sidetoneFrequency.
 */
export const DOT_PITCH_OPTIONS = [
  { value: 0,    label: 'Igual que el tablero' },
  { value: 1.03, label: '3% más alto'  },
  { value: 1.04, label: '4% más alto'  },
  { value: 1.05, label: '5% más alto'  },
  { value: 1.10, label: '10% más alto' },
  { value: 1.20, label: '20% más alto' },
  { value: 1.50, label: '50% más alto' },
];

/** Opciones de retraso de impresión grupal (segundos) */
export const GROUP_PRINT_DELAY_OPTIONS = [
  { value: 0,   label: '0 seg'   },
  { value: 2.5, label: '2.5 seg' },
  { value: 3.0, label: '3 seg'   },
  { value: 3.5, label: '3.5 seg' },
  { value: 4.0, label: '4 seg'   },
  { value: 5.0, label: '5 seg'   },
];

/** Opciones de espaciado entre caracteres (multiplicador) */
export const CHAR_SPACING_OPTIONS = [
  { value: 1.0, label: '1.0×' },
  { value: 1.5, label: '1.5×' },
  { value: 2.0, label: '2.0×' },
  { value: 2.5, label: '2.5×' },
  { value: 3.0, label: '3.0×' },
  { value: 3.5, label: '3.5×' },
];

/** Opciones de espacio entre palabras (multiplicador) */
export const WORD_SPACING_OPTIONS = [
  { value: 1.0, label: '1.0×' },
  { value: 1.5, label: '1.5×' },
  { value: 2.0, label: '2.0×' },
  { value: 2.5, label: '2.5×' },
  { value: 3.0, label: '3.0×' },
  { value: 3.5, label: '3.5×' },
];

/** Opciones de ratio dash/dot */
export const DASH_DOT_RATIO_OPTIONS = [
  { value: 2.5, label: '2.5×' },
  { value: 2.8, label: '2.8×' },
  { value: 3.0, label: '3.0× (estándar)' },
  { value: 3.2, label: '3.2×' },
  { value: 3.5, label: '3.5×' },
];

/** Opciones de sidetone frecuencia (Hz) */
export const SIDETONE_OPTIONS = [
  { value: 400, label: '400 Hz' },
  { value: 500, label: '500 Hz' },
  { value: 600, label: '600 Hz' },
  { value: 700, label: '700 Hz' },
  { value: 750, label: '750 Hz' },
  { value: 800, label: '800 Hz' },
  { value: 900, label: '900 Hz' },
  { value: 1000, label: '1000 Hz' },
];

/** Opciones de attack/release de tono (ms) */
export const TONE_ENVELOPE_OPTIONS = [
  { value: 1,  label: '1 ms'  },
  { value: 2,  label: '2 ms'  },
  { value: 3,  label: '3 ms'  },
  { value: 5,  label: '5 ms'  },
  { value: 8,  label: '8 ms'  },
  { value: 10, label: '10 ms' },
  { value: 15, label: '15 ms' },
  { value: 20, label: '20 ms' },
];

/** Tipos de ejercicio disponibles */
export const EXERCISE_TYPES = [
  { value: 'koch_g4fon',          label: 'Koch (secuencia G4FON)'                    },
  { value: 'koch_lcwo',           label: 'Koch (secuencia LCWO)'                     },
  { value: 'koch_custom',         label: 'Koch (caracteres de cadena personalizada)' },
  { value: 'custom_string',       label: 'Cadena personalizada'                      },
  { value: 'words_custom',        label: 'Palabras de cadena personalizada'          },
  { value: 'words_custom_g4fon',  label: 'Palabras de cadena personalizada y G4FON' },
  { value: 'words_custom_lcwo',   label: 'Palabras de cadena personalizada y LCWO'  },
  { value: 'single_char',         label: 'Single Char'                               },
];

/** Modos de voz (Web Speech API) */
export const SPEECH_MODES = [
  { value: 'none',         label: 'Ningún discurso'         },
  { value: 'itu_phonetic', label: 'ITU ortografía fonética' },
  { value: 'short_letters', label: 'Ortografía letras cortas' },
  { value: 'tts_read',     label: 'Text-to-speech palabras' },
];

/** Idiomas de TTS disponibles */
export const SPEECH_LANGS = [
  { value: 'es-AR', label: 'Español (Argentina)' },
  { value: 'es-ES', label: 'Español (España)'    },
  { value: 'en-US', label: 'Inglés (EE.UU.)'     },
  { value: 'en-GB', label: 'Inglés (UK)'         },
  { value: 'de-DE', label: 'Alemán'              },
  { value: 'fr-FR', label: 'Francés'             },
  { value: 'it-IT', label: 'Italiano'            },
  { value: 'pt-BR', label: 'Portugués (Brasil)'  },
];

/** Opciones de tamaño de fuente del display */
export const FONT_SIZE_OPTIONS = [
  { value: 'small',  label: 'Pequeño' },
  { value: 'medium', label: 'Mediano' },
  { value: 'large',  label: 'Grande'  },
  { value: 'xlarge', label: 'Muy grande' },
];

/** Opciones de tiempo antes/después de hablar (segundos) */
export const SPEECH_TIMING_OPTIONS = [
  { value: 0.5, label: '0.5 seg' },
  { value: 1.0, label: '1 seg'   },
  { value: 1.5, label: '1.5 seg' },
  { value: 2.0, label: '2 seg'   },
  { value: 2.5, label: '2.5 seg' },
  { value: 3.0, label: '3 seg'   },
];

// ── Settings por defecto ──────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  // Tipo de ejercicio
  exerciseType: 'koch_g4fon',

  // Velocidad
  speedValue: 20,
  speedUnit: 'wpm',  // 'wpm' | 'cpm'

  // Duración: valor en segundos, elegido de DURATION_OPTIONS
  exerciseDuration: 600,

  // Longitud de grupo:
  //   wordLength = 0  → modo variable (random 1–5 chars)
  //   wordLength = N  → exactamente N caracteres
  wordLength: 5,

  // Koch level: índice 1-based en la secuencia activa
  // (nivel 2 = K y M en G4FON; nivel 5 = K M R S U en G4FON)
  kochLevel: 2,

  // Hard letters: array de caracteres marcados como difíciles
  hardLetters: [],
  // Si true: los últimos 2 del nivel actual se suman automáticamente al hardSet
  autoHardLetters: true,

  // Espaciado Farnsworth — valores elegidos de CHAR/WORD_SPACING_OPTIONS
  charSpacing: 1.0,
  wordSpacing: 1.0,

  // Audio
  sidetoneFrequency: 700,  // Hz — elegido de SIDETONE_OPTIONS
  dotPitch: 0,             // multiplicador (0 = igual al sidetone) — de DOT_PITCH_OPTIONS
  toneAttack: 5,           // ms — de TONE_ENVELOPE_OPTIONS
  toneRelease: 5,          // ms — de TONE_ENVELOPE_OPTIONS
  dashDotRatio: 3.0,       // de DASH_DOT_RATIO_OPTIONS
  volume: 80,              // % (0–100, slider libre)

  // Impresión del grupo
  groupPrint: false,
  groupPrintDelay: 0,      // segundos — de GROUP_PRINT_DELAY_OPTIONS

  // Pausa inicial antes de transmitir — de START_PAUSE_OPTIONS
  startPause: 3,

  // Display
  fontSize: 'medium',      // de FONT_SIZE_OPTIONS
  keepScreenOn: true,

  // Speech / TTS
  speechMode: 'none',      // de SPEECH_MODES
  speechLang: 'es-AR',     // de SPEECH_LANGS (default español Argentina)
  timeBeforeSpeech: 2.0,   // segundos — de SPEECH_TIMING_OPTIONS
  timeAfterSpeech: 1.0,    // segundos — de SPEECH_TIMING_OPTIONS

  // Deletreo fonético ITU al mostrar resultado (Kilo, Mike, Alpha…)
  phoneticReadout: true,

  // Cadena personalizada (para modos custom_string / words_*)
  customString: '',

  // Set de caracteres para modo Single Char (string libre, se parsea en el engine)
  singleCharSet: '',

  // Presets guardados por el usuario (hasta 5)
  // Estructura: [{ id, name, settings: {...} }]
  userPresets: [],
};

// ── Progreso por defecto ──────────────────────────────────────────

export const DEFAULT_PROGRESS = {
  // Stats por carácter: { [char]: { correct: number, total: number } }
  characterStats: {},

  // Historial de sesiones (últimas 100)
  // [{ id, date, exerciseType, kochLevel, speedValue, speedUnit,
  //    accuracy, totalChars, correctChars, durationSeconds, characterScores }]
  sessionHistory: [],

  totalTrainingTime: 0,
  totalSessions: 0,
  firstSessionDate: null,
  lastSessionDate: null,
};

// ── Helpers de merge ──────────────────────────────────────────────

/**
 * Fusiona settings guardados con los defaults.
 * Garantiza retrocompatibilidad: campos nuevos tienen su default
 * aunque no estén en los datos guardados.
 */
export function mergeWithDefaults(saved) {
  if (!saved || typeof saved !== 'object') return { ...DEFAULT_SETTINGS };
  return { ...DEFAULT_SETTINGS, ...saved };
}

export function mergeProgressWithDefaults(saved) {
  if (!saved || typeof saved !== 'object') return { ...DEFAULT_PROGRESS };
  return {
    ...DEFAULT_PROGRESS,
    ...saved,
    characterStats: saved.characterStats ?? {},
    sessionHistory:  saved.sessionHistory  ?? [],
  };
}

// ── Helpers de validación ─────────────────────────────────────────

/**
 * Dado un valor y una lista de opciones, devuelve el valor
 * más cercano de la lista. Útil para normalizar valores viejos
 * que venían de un slider y ahora son discretos.
 */
export function snapToOption(value, options) {
  if (!options || options.length === 0) return value;
  return options.reduce((best, opt) =>
    Math.abs(opt.value - value) < Math.abs(best.value - value) ? opt : best
  ).value;
}
