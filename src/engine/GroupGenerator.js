/**
 * GroupGenerator.js
 * ─────────────────────────────────────────────────────────────────
 * Genera grupos de caracteres Morse para los ejercicios de entrenamiento.
 *
 * ── Modos soportados ──────────────────────────────────────────────
 *   custom_string        → subcadena aleatoria del texto personalizado
 *   koch_custom          → chars únicos del customString
 *   words_custom         → ídem (alias semántico)
 *   words_custom_g4fon   → chars Koch del nivel + chars del customString
 *   words_custom_lcwo    → ídem con secuencia LCWO
 *   koch_g4fon / lcwo    → chars Koch estándar hasta kochLevel
 *
 * ── Aleatoriedad ─────────────────────────────────────────────────
 * El pool de chars activos se shufflea con Fisher-Yates antes de usarlo
 * para evitar sesgos perceptibles con pools pequeños (ej: 2 chars).
 * La lógica de "hard letters" se desactiva cuando el pool tiene <= 2
 * chars porque con pools tan chicos todos los chars ya son igualmente
 * frecuentes y el mecanismo no aporta nada útil.
 * ─────────────────────────────────────────────────────────────────
 */

import { getActiveCharacters } from '../constants/kochSequences.js';

// ── Helpers de cadena personalizada ───────────────────────────────

/**
 * Extrae tokens (palabras/letras) del customString, eliminando comentarios
 * entre llaves {así}. Devuelve array de strings en mayúsculas.
 */
function parseCustomTokens(customString) {
  if (!customString || typeof customString !== 'string') return [];
  const withoutComments = customString.replace(/\{[^}]*\}/g, '');
  return withoutComments
    .split(/\s+/)
    .map(t => t.trim().toUpperCase())
    .filter(t => t.length > 0);
}

/**
 * Extrae el conjunto de caracteres únicos del customString.
 * El orden del array resultante se shufflea en getActivePool para
 * garantizar aleatoriedad uniforme.
 */
function parseCustomChars(customString) {
  const tokens = parseCustomTokens(customString);
  const chars = new Set();
  tokens.forEach(token => {
    [...token].forEach(ch => { if (ch.trim()) chars.add(ch); });
  });
  return [...chars];
}

/**
 * Fisher-Yates shuffle — mezcla el array in-place y lo devuelve.
 * Garantiza distribución uniforme independientemente del tamaño del pool.
 */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Devuelve el pool de caracteres activos según el exerciseType.
 * El resultado siempre viene shuffleado para evitar sesgos de orden.
 */
function getActivePool(settings, kochSequence) {
  const type = settings.exerciseType;
  const customChars = parseCustomChars(settings.customString);
  const fallback = ['K', 'M'];

  let pool;
  switch (type) {
    case 'koch_custom':
    case 'words_custom':
      pool = customChars.length > 0 ? customChars : fallback;
      break;

    case 'words_custom_g4fon':
    case 'words_custom_lcwo': {
      const kochChars = getActiveCharacters(kochSequence, settings.kochLevel);
      pool = [...new Set([...customChars, ...kochChars])];
      break;
    }

    case 'koch_lcwo':
    case 'koch_g4fon':
    default:
      pool = getActiveCharacters(kochSequence, settings.kochLevel);
      break;
  }

  // Shuffle para garantizar distribución uniforme con pools pequeños
  return shuffleArray([...pool]);
}

// ── Generador principal ────────────────────────────────────────────

/**
 * Genera un único grupo de caracteres para un ejercicio.
 * En modo custom_string toma una subcadena aleatoria del texto configurado.
 * En el resto de modos elige chars al azar del pool activo.
 *
 * @param {object} settings      - Configuración actual (del SettingsContext)
 * @param {string[]} kochSequence - Secuencia Koch (G4FON o LCWO)
 * @returns {string}             - Grupo de caracteres a transmitir
 */
export function generateGroup(settings, kochSequence) {

  // ── Modo cadena personalizada ──────────────────────────────────
  // Toma una subcadena aleatoria de los tokens del customString.
  // No usa el pool de chars individuales sino los tokens completos.
  if (settings.exerciseType === 'custom_string') {
    const tokens = parseCustomTokens(settings.customString);
    if (tokens.length === 0) return 'K';
    const groupLen = settings.wordLength === 0
      ? Math.floor(Math.random() * 5) + 1
      : settings.wordLength;
    const maxStart = Math.max(0, tokens.length - groupLen);
    const startIdx = Math.floor(Math.random() * (maxStart + 1));
    return tokens.slice(startIdx, startIdx + groupLen).join('') || tokens[0];
  }

  // ── Modos Koch y custom ────────────────────────────────────────
  const activeChars = getActivePool(settings, kochSequence);
  if (activeChars.length === 0) return 'K';

  const groupLen = settings.wordLength === 0
    ? Math.floor(Math.random() * 5) + 1
    : settings.wordLength;

  // Hard letters: solo se aplica en modos Koch estándar Y con pool > 2.
  // Con 2 chars o menos el mecanismo no aporta nada — todos los chars
  // ya están igualmente representados y solo generaría sesgo perceptible.
  const isKochStandard = settings.exerciseType === 'koch_g4fon' ||
                         settings.exerciseType === 'koch_lcwo';
  const hardSet = new Set(settings.hardLetters || []);

  if (isKochStandard && settings.autoHardLetters && activeChars.length > 2) {
    // Los últimos dos chars de la secuencia Koch son los más nuevos → más difíciles
    hardSet.add(activeChars[activeChars.length - 1]);
    hardSet.add(activeChars[activeChars.length - 2]);
  }
  const hardArray = [...hardSet].filter(c => activeChars.includes(c));

  // Construir el grupo char a char.
  // Para evitar patrones perceptibles (ej: FNFNFN con pool de 2 chars),
  // nunca se repite el mismo char dos veces seguidas si hay alternativas.
  const group = [];
  for (let i = 0; i < groupLen; i++) {
    const lastChar = group[group.length - 1] ?? null;
    let selectedChar;
    let attempts = 0;

    do {
      if (hardArray.length > 0 && Math.random() < 0.5) {
        selectedChar = hardArray[Math.floor(Math.random() * hardArray.length)];
      } else {
        selectedChar = activeChars[Math.floor(Math.random() * activeChars.length)];
      }
      attempts++;
      // Máx 8 intentos para evitar loop infinito si solo hay 1 char en el pool
    } while (selectedChar === lastChar && activeChars.length > 1 && attempts < 8);

    group.push(selectedChar);
  }
  return group.join('');
}

/**
 * Genera un lote de grupos para previsualización o análisis.
 *
 * @param {number}   count        - Cantidad de grupos a generar
 * @param {object}   settings     - Configuración actual
 * @param {string[]} kochSequence - Secuencia Koch (G4FON o LCWO)
 * @returns {string[]}
 */
export function generateGroupBatch(count, settings, kochSequence) {
  const groups = [];
  for (let i = 0; i < count; i++) {
    groups.push(generateGroup(settings, kochSequence));
  }
  return groups;
}

/**
 * Analiza la distribución estadística de chars en una muestra simulada.
 * Útil para verificar que el generador produce distribuciones uniformes.
 *
 * @param {string[]} activeChars - Pool de chars activos
 * @param {string[]} hardChars   - Chars marcados como difíciles
 * @param {number}   sampleSize  - Tamaño de la muestra (default 1000)
 * @returns {object}             - Mapa char → frecuencia (0–1)
 */
export function analyzeDistribution(activeChars, hardChars, sampleSize = 1000) {
  const counts = {};
  activeChars.forEach(c => { counts[c] = 0; });
  const hardArray = hardChars.filter(c => activeChars.includes(c));
  for (let i = 0; i < sampleSize; i++) {
    let char;
    if (hardArray.length > 0 && Math.random() < 0.5) {
      char = hardArray[Math.floor(Math.random() * hardArray.length)];
    } else {
      char = activeChars[Math.floor(Math.random() * activeChars.length)];
    }
    if (counts[char] !== undefined) counts[char]++;
  }
  const freqs = {};
  Object.entries(counts).forEach(([char, count]) => {
    freqs[char] = count / sampleSize;
  });
  return freqs;
}
