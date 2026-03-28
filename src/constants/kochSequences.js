/**
 * kochSequences.js
 * ─────────────────────────────────────────────────────────────────
 * Define los órdenes de introducción de caracteres del Método Koch.
 * 
 * El método Koch enseña Morse a velocidad alta desde el inicio,
 * comenzando con 2 caracteres y agregando 1 nuevo al alcanzar 90% de precisión.
 * 
 * Existen dos secuencias estándar:
 *   G4FON: la más clásica, desarrollada por Ray Goff (G4FON)
 *   LCWO:  usada por Learn CW Online (lcwo.net), introduce E antes
 * ─────────────────────────────────────────────────────────────────
 */

/**
 * Secuencia G4FON — 40 caracteres.
 * Orden clásico: K y M primero (fáciles de distinguir por ser opuestos),
 * letras comunes antes que raras, puntuación y números al final.
 */
export const G4FON_ORDER = [
  'K', 'M', 'R', 'S', 'U', 'A', 'P', 'T', 'L', 'O',
  'W', 'I', '.', 'N', 'J', 'E', 'F', '0', 'Y', 'V',
  ',', 'G', '5', '/', 'Q', '9', 'Z', 'H', '3', '8',
  'B', '?', '4', '2', '7', 'C', '1', 'D', '6', 'X',
];

/**
 * Secuencia LCWO — 41 caracteres.
 * Diferencia clave: introduce E en la posición 5 (vs posición 16 en G4FON).
 * E = un solo dit, difícil de distinguir de errores de timing → reto temprano.
 * También incluye '=' (que G4FON no tiene como carácter independiente).
 */
export const LCWO_ORDER = [
  'K', 'M', 'U', 'R', 'E', 'S', 'N', 'A', 'P', 'T',
  'L', 'W', 'I', '.', 'J', 'Z', '=', 'F', 'O', 'Y',
  ',', 'V', 'G', '5', '/', 'Q', '9', '2', 'H', '3',
  '8', 'B', '?', '4', '7', 'C', '1', 'D', '6', '0', 'X',
];

/**
 * Mapa de secuencias disponibles para uso programático.
 * La clave es el identificador usado en los settings.
 */
export const KOCH_SEQUENCES = {
  g4fon: G4FON_ORDER,
  lcwo:  LCWO_ORDER,
};

/**
 * Metadatos de cada secuencia (para mostrar en la UI).
 */
export const SEQUENCE_INFO = {
  g4fon: {
    id:          'g4fon',
    label:       'G4FON',
    fullName:    'G4FON (clásica)',
    description: 'Secuencia clásica de Ray Goff. K y M primero.',
    totalChars:  G4FON_ORDER.length,  // 40
  },
  lcwo: {
    id:          'lcwo',
    label:       'LCWO',
    fullName:    'LCWO (Learn CW Online)',
    description: 'Introduce E más temprano. Más desafiante al inicio.',
    totalChars:  LCWO_ORDER.length,   // 41
  },
};

/**
 * Retorna los caracteres activos para un nivel Koch dado.
 * 
 * El nivel indica CUÁNTOS caracteres están activos.
 * Nivel 2 = los primeros 2 de la secuencia.
 * Nivel 10 = los primeros 10. Etc.
 * 
 * @param {string[]} sequence - Array de caracteres en orden Koch
 * @param {number}   level    - Nivel actual (mínimo 2)
 * @returns {string[]}         Array de caracteres activos
 */
export function getActiveCharacters(sequence, level) {
  // Clampear: mínimo 2 caracteres, máximo la longitud total de la secuencia
  const clamped = Math.max(2, Math.min(level, sequence.length));
  return sequence.slice(0, clamped);
}

/**
 * Dado un tipo de ejercicio Koch, retorna la secuencia correspondiente.
 * 
 * @param {string} exerciseType - 'koch_g4fon' | 'koch_lcwo'
 * @returns {string[]}           Secuencia Koch
 */
export function getSequenceByExerciseType(exerciseType) {
  if (exerciseType === 'koch_lcwo') return LCWO_ORDER;
  return G4FON_ORDER; // default: G4FON
}

/**
 * Retorna el nivel máximo para una secuencia dada.
 * 
 * @param {string[]} sequence
 * @returns {number}
 */
export function getMaxLevel(sequence) {
  return sequence.length;
}
