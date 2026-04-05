/**
 * GroupGenerator.js
 * ─────────────────────────────────────────────────────────────────
 * Genera grupos aleatorios de caracteres Koch con ponderación
 * de "hard letters" (caracteres difíciles que aparecen más seguido).
 * 
 * ── Lógica de hard letters ────────────────────────────────────────
 * IZ2UUF implementa dos tipos de hard letters:
 * 
 *   1. Manuales: el usuario marca caracteres específicos como difíciles
/**
 * GroupGenerator.js
  * Fix: soporte completo para todos los tipos de ejercicio.
   * Bug corregido: generateGroup() ignoraba exerciseType y siempre
    * usaba el pool Koch. Ahora respeta custom_string, koch_custom,
     * words_custom, words_custom_g4fon, words_custom_lcwo.
      */

import { getActiveCharacters } from '../constants/kochSequences.js';

// -- Helpers de cadena personalizada ------------------------------------

/**
 * Parsea la cadena personalizada en tokens.
  * Elimina comentarios entre llaves {ignorado}.
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
 * Extrae los caracteres unicos de la cadena personalizada.
  * Ejemplo: "S O E" -> ['S','O','E'] / "SOS" -> ['S','O']
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
 * Obtiene el pool de caracteres activos segun el tipo de ejercicio.
  * FIX central: antes siempre llamaba a getActiveCharacters(kochSequence, kochLevel).
   */
function getActivePool(settings, kochSequence) {
    const type = settings.exerciseType;
    const customChars = parseCustomChars(settings.customString);
    const fallback = ['K', 'M'];
  
    switch (type) {
      case 'koch_custom':
      case 'words_custom':
              return customChars.length > 0 ? customChars : fallback;
        
      case 'words_custom_g4fon':
      case 'words_custom_lcwo': {
              const kochChars = getActiveCharacters(kochSequence, settings.kochLevel);
              return [...new Set([...customChars, ...kochChars])];
      }
        
      case 'koch_lcwo':
      case 'koch_g4fon':
      default:
              return getActiveCharacters(kochSequence, settings.kochLevel);
    }
}

// -- Generador principal ------------------------------------------------

/**
 * Genera un grupo de caracteres segun el tipo de ejercicio y settings.
  *
   * @param {object} settings - Configuracion de la sesion
    * @param {string[]} kochSequence - Secuencia Koch activa (G4FON o LCWO)
     * @returns {string} Grupo como string (ej: "KMRTU")
      */
export function generateGroup(settings, kochSequence) {
  
    // Cadena personalizada exacta: tomar slice aleatorio de los tokens
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
      
        // Pool segun tipo de ejercicio
        const activeChars = getActivePool(settings, kochSequence);
    if (activeChars.length === 0) return 'K';
      
        // Largo del grupo
        const groupLen = settings.wordLength === 0
              ? Math.floor(Math.random() * 5) + 1
              : settings.wordLength;
  
    // Hard letters (solo en modos Koch estandar)
    const hardSet = new Set(settings.hardLetters || []);
    const isKochStandard = settings.exerciseType === 'koch_g4fon' ||
                               settings.exerciseType === 'koch_lcwo';
    if (isKochStandard && settings.autoHardLetters && activeChars.length >= 2) {
          hardSet.add(activeChars[activeChars.length - 1]);
          hardSet.add(activeChars[activeChars.length - 2]);
    }
        const hardArray = [...hardSet].filter(c => activeChars.includes(c));
  
    // Generar grupo con coin flip para hard letters
    const group = [];
    for (let i = 0; i < groupLen; i++) {
          let selectedChar;
          if (hardArray.length > 0 && Math.random() < 0.5) {
                  selectedChar = hardArray[Math.floor(Math.random() * hardArray.length)];
          } else {
                  selectedChar = activeChars[Math.floor(Math.random() * activeChars.length)];
          }
          group.push(selectedChar);
    }
    return group.join('');
}

/**
 * Genera multiples grupos para pre-cargar la sesion.
  *
   * @param {number} count
    * @param {object} settings
     * @param {string[]} kochSequence
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
 * Calcula la distribucion de frecuencia esperada.
  * Util para debugging y testing.
   *
    * @param {string[]} activeChars
     * @param {string[]} hardChars
      * @param {number} sampleSize
       * @returns {object} { [char]: frecuencia (0-1) }
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
}*   2. Auto: los últimos 2 caracteres del nivel actual son automáticamente hard
 *      (los más nuevos = los menos practicados = los más difíciles)
 * 
 * El algoritmo de selección usa una coin flip (50%):
 *   - 50% de probabilidad: elegir del hardSet (solo si no está vacío)
 *   - 50% de probabilidad: elegir del pool completo de activos
 * 
 * Esto resulta en que los hard letters aparecen ~3x más que un carácter normal.
 * (Si hay 10 chars activos y 2 son hard, la frecuencia de un hard char = ~30% vs ~10% normal)
 * ─────────────────────────────────────────────────────────────────
 */

import { getActiveCharacters } from '../constants/kochSequences.js';

/**
 * Genera un grupo de caracteres Koch con ponderación de hard letters.
 * 
 * @param {object}   settings      - Configuración de la sesión
 * @param {string[]} kochSequence  - Secuencia Koch activa (G4FON o LCWO)
 * @returns {string}                 Grupo como string (ej: "KMRTU")
 */
export function generateGroup(settings, kochSequence) {
  // ── 1. Obtener pool de caracteres activos ──────────────────
  const activeChars = getActiveCharacters(kochSequence, settings.kochLevel);

  // ── 2. Determinar largo del grupo ─────────────────────────
  // wordLength === 0  → modo variable (1 a 5 caracteres aleatorio)
  // wordLength  >  0  → exactamente ese número de caracteres
  let groupLen;
  if (settings.wordLength === 0) {
    groupLen = Math.floor(Math.random() * 5) + 1; // 1 a 5
  } else {
    groupLen = settings.wordLength;
  }

  // ── 3. Construir el set de hard letters ───────────────────
  // Empezamos con los hard letters manuales del usuario
  const hardSet = new Set(settings.hardLetters || []);

  // Agregar auto-hard: los últimos 2 del nivel actual
  if (settings.autoHardLetters && activeChars.length >= 2) {
    hardSet.add(activeChars[activeChars.length - 1]); // el último (más nuevo)
    hardSet.add(activeChars[activeChars.length - 2]); // el penúltimo
  }

  // Filtrar el hardSet para incluir solo chars que están en el pool activo
  // (evita referencias a chars de niveles anteriores que ya fueron desactivados)
  const hardArray = [...hardSet].filter(c => activeChars.includes(c));

  // ── 4. Generar el grupo ────────────────────────────────────
  const group = [];

  for (let i = 0; i < groupLen; i++) {
    let selectedChar;

    if (hardArray.length > 0 && Math.random() < 0.5) {
      // Coin flip: elegir del hardSet → mayor frecuencia de hard letters
      selectedChar = hardArray[Math.floor(Math.random() * hardArray.length)];
    } else {
      // Elegir del pool completo de activos (puede incluir hard letters también)
      selectedChar = activeChars[Math.floor(Math.random() * activeChars.length)];
    }

    group.push(selectedChar);
  }

  return group.join('');
}

/**
 * Genera múltiples grupos para pre-cargar la sesión.
 * Útil para pre-calcular el texto total y sus duraciones.
 * 
 * @param {number}   count        - Cantidad de grupos a generar
 * @param {object}   settings     - Configuración de la sesión
 * @param {string[]} kochSequence - Secuencia Koch activa
 * @returns {string[]}              Array de grupos
 */
export function generateGroupBatch(count, settings, kochSequence) {
  const groups = [];
  for (let i = 0; i < count; i++) {
    groups.push(generateGroup(settings, kochSequence));
  }
  return groups;
}

/**
 * Calcula la distribución de frecuencia esperada para verificar
 * que el generador está ponderando correctamente los hard letters.
 * Útil para debugging y testing.
 * 
 * @param {string[]} activeChars - Chars activos
 * @param {string[]} hardChars   - Hard letters
 * @param {number}   sampleSize  - Cuántos chars generar para el análisis
 * @returns {object}               { [char]: frecuencia (0-1) }
 */
export function analyzeDistribution(activeChars, hardChars, sampleSize = 1000) {
  const counts = {};
  activeChars.forEach(c => { counts[c] = 0; });

  const hardSet = new Set(hardChars);
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

  // Convertir a frecuencias relativas
  const freqs = {};
  Object.entries(counts).forEach(([char, count]) => {
    freqs[char] = count / sampleSize;
  });

  return freqs;
}
