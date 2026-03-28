/**
 * morseCodes.js
 * ─────────────────────────────────────────────────────────────────
 * Tabla completa de códigos Morse Internacional (ITU).
 * 
 * Convenciones:
 *   '.'  = dit  (punto, tono corto)
 *   '-'  = dah  (raya, tono largo = 3× la duración del dit)
 * 
 * Los prosigns son combinaciones de letras enviadas sin espacio inter-carácter
 * (ej: <AR> = A+R pegados). Se almacenan como claves multi-carácter.
 * ─────────────────────────────────────────────────────────────────
 */

export const MORSE_CODE = {
  // ── Letras (A-Z) ──────────────────────────────────────────────
  'A': '.-',      // Alpha
  'B': '-...',    // Bravo
  'C': '-.-.',    // Charlie
  'D': '-..',     // Delta
  'E': '.',       // Echo    ← el más corto: un solo dit
  'F': '..-.',    // Foxtrot
  'G': '--.',     // Golf
  'H': '....',    // Hotel
  'I': '..',      // India
  'J': '.---',    // Juliett
  'K': '-.-',     // Kilo    ← primer carácter en secuencia G4FON
  'L': '.-..',    // Lima
  'M': '--',      // Mike
  'N': '-.',      // November
  'O': '---',     // Oscar
  'P': '.--.',    // Papa
  'Q': '--.-',    // Quebec
  'R': '.-.',     // Romeo
  'S': '...',     // Sierra
  'T': '-',       // Tango
  'U': '..-',     // Uniform
  'V': '...-',    // Victor
  'W': '.--',     // Whiskey
  'X': '-..-',    // X-ray
  'Y': '-.--',    // Yankee
  'Z': '--..',    // Zulu

  // ── Números (0-9) ────────────────────────────────────────────
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',

  // ── Puntuación ───────────────────────────────────────────────
  '.': '.-.-.-',  // Punto final
  ',': '--..--',  // Coma
  '?': '..--..',  // Interrogación
  '/': '-..-.',   // Barra oblicua
  '=': '-...-',   // Igual / BT (double dash)
  '+': '.-.-.',   // Más / AR
  '-': '-....-',  // Guión
  '@': '.--.-.',  // Arroba (Commat)
  '!': '-.-.--',  // Exclamación
  '(': '-.--.',   // Paréntesis abre
  ')': '-.--.-',  // Paréntesis cierra
  '&': '.-...',   // Ampersand / AS (esperar)
  ':': '---...',  // Dos puntos
  ';': '-.-.-.',  // Punto y coma
  "'": '.----.',  // Apóstrofe
  '"': '.-..-.',  // Comillas dobles

  // ── Prosigns ─────────────────────────────────────────────────
  // Los prosigns se transmiten sin espacio entre sus letras componentes.
  // Se representan con corchetes angulares para distinguirlos de letras sueltas.
  '<AR>': '.-.-.',    // End of message (fin de mensaje)
  '<AS>': '.-...',    // Wait / Stand by (esperar)
  '<BK>': '-...-.-',  // Break (interrumpir)
  '<BT>': '-...-',    // New paragraph / double dash (nuevo párrafo)
  '<CL>': '-.-..-..',  // Closing (cerrando estación)
  '<CT>': '-.-.-',    // Attention / Start (atención, inicio de transmisión)
  '<KN>': '-.--.',    // Go ahead, specific station (adelante, estación específica)
  '<SK>': '...-.-',   // End of contact (fin del contacto)
  '<SN>': '...-.',    // Understood (entendido)
  '<SOS>': '...---...', // Distress signal (señal de auxilio)
};

/**
 * Dado un carácter, retorna su código Morse.
 * Acepta tanto minúsculas como mayúsculas.
 * Retorna null si el carácter no tiene código definido.
 * 
 * @param {string} char - Carácter a buscar
 * @returns {string|null} Código Morse o null
 */
export function getMorseCode(char) {
  if (!char) return null;
  const upper = char.toUpperCase();
  return MORSE_CODE[upper] ?? null;
}

/**
 * Verifica si un carácter tiene código Morse definido.
 * 
 * @param {string} char - Carácter a verificar
 * @returns {boolean}
 */
export function hasMorseCode(char) {
  return getMorseCode(char) !== null;
}

/**
 * Retorna todos los caracteres que tienen código Morse definido
 * (excluye prosigns, que son claves multi-carácter).
 * 
 * @returns {string[]} Array de caracteres soportados
 */
export function getSupportedChars() {
  return Object.keys(MORSE_CODE).filter(k => k.length === 1 || k.startsWith('<'));
}
