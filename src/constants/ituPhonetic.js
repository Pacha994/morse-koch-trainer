/**
 * ituPhonetic.js
 * ─────────────────────────────────────────────────────────────────
 * Alfabeto fonético de la ITU (NATO).
 * Se usa en el modo de voz "ITU phonetic" para deletrear grupos CW.
 * 
 * Ejemplo: "KM" → "Kilo, Mike"
 * ─────────────────────────────────────────────────────────────────
 */

export const ITU_PHONETIC = {
  // Letras
  'A': 'Alpha',    'B': 'Bravo',    'C': 'Charlie',  'D': 'Delta',
  'E': 'Echo',     'F': 'Foxtrot',  'G': 'Golf',     'H': 'Hotel',
  'I': 'India',    'J': 'Juliett',  'K': 'Kilo',     'L': 'Lima',
  'M': 'Mike',     'N': 'November', 'O': 'Oscar',    'P': 'Papa',
  'Q': 'Quebec',   'R': 'Romeo',    'S': 'Sierra',   'T': 'Tango',
  'U': 'Uniform',  'V': 'Victor',   'W': 'Whiskey',  'X': 'X-ray',
  'Y': 'Yankee',   'Z': 'Zulu',

  // Números (pronunciación ITU estándar: "9" = "Niner" para evitar confusión con "nine")
  '0': 'Zero',  '1': 'One',   '2': 'Two',   '3': 'Three',
  '4': 'Four',  '5': 'Five',  '6': 'Six',   '7': 'Seven',
  '8': 'Eight', '9': 'Niner',

  // Puntuación y símbolos especiales
  '.': 'Stop',      // En telegrafía: punto = "stop"
  ',': 'Comma',
  '?': 'Question',
  '/': 'Slash',
  '=': 'Equals',
  '+': 'Plus',
  '-': 'Dash',
  '@': 'At',
};

/**
 * Convierte un string de caracteres a su representación fonética ITU.
 * Los caracteres sin fonético se deletrean normalmente.
 * 
 * @param {string} text - Texto a convertir (ej: "KM" o "KM5")
 * @returns {string}      Texto fonético (ej: "Kilo, Mike, Fiver")
 */
export function toPhonetic(text) {
  return text
    .toUpperCase()
    .split('')
    .map(char => ITU_PHONETIC[char] ?? char)
    .join(', ');
}

/**
 * Convierte un string para lectura corta (solo letras sueltas).
 * El TTS las pronuncia una por una con pausa entre ellas.
 * 
 * @param {string} text - Texto a convertir
 * @returns {string}      Letras separadas por comas
 */
export function toShortLetters(text) {
  return text.toUpperCase().split('').join(', ');
}
