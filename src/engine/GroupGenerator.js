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
 *   2. Auto: los últimos 2 caracteres del nivel actual son automáticamente hard
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
