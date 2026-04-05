/**
 * SingleCharGenerator.js
 * ─────────────────────────────────────────────────────────────────
 * Lógica de generación de caracteres para el modo Single Char.
 *
 * A diferencia del GroupGenerator, produce un único carácter por vez
 * desde un set definido por el usuario, con distribución pareja.
 * ─────────────────────────────────────────────────────────────────
 */

import { MORSE_CODE } from '../constants/morseCodes.js';

/**
 * Normaliza el set de caracteres ingresado por el usuario:
 * - Convierte a mayúsculas
 * - Elimina duplicados
 * - Descarta caracteres que no tienen código Morse
 * - Devuelve array de caracteres válidos
 *
 * @param {string} raw - String crudo ingresado por el usuario (ej: "kmrsu abc")
 * @returns {string[]} Array de caracteres válidos sin duplicados
 */
export function parseSingleCharSet(raw) {
  if (!raw || typeof raw !== 'string') return [];
  const seen = new Set();
  return raw
    .toUpperCase()
    .split('')
    .filter(c => c.trim() !== '' && MORSE_CODE[c] !== undefined)
    .filter(c => {
      if (seen.has(c)) return false;
      seen.add(c);
      return true;
    });
}

/**
 * Elige un carácter aleatorio del set con distribución pareja.
 *
 * @param {string[]} charSet - Array de caracteres válidos
 * @returns {string|null} Un carácter, o null si el set está vacío
 */
export function getNextSingleChar(charSet) {
  if (!charSet || charSet.length === 0) return null;
  const idx = Math.floor(Math.random() * charSet.length);
  return charSet[idx];
}
