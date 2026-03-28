/**
 * timings.js
 * ─────────────────────────────────────────────────────────────────
 * Cálculo de todas las duraciones de timing para el audio Morse.
 * 
 * ── Base matemática ──────────────────────────────────────────────
 * El estándar ITU-R M.1677-1 define el timing Morse basándose en la
 * palabra "PARIS" = 50 unidades de tiempo.
 * 
 *   1 WPM = enviar "PARIS" una vez por minuto
 *   → 50 unidades en 60 segundos
 *   → 1 unidad (dot) = 1200ms / WPM
 * 
 * Relaciones de tiempo estándar:
 *   dot duration  = 1 unidad
 *   dash duration = 3 unidades (default, configurable via dashDotRatio)
 *   intra-char gap  = 1 unidad  (entre elementos de UN carácter)
 *   inter-char gap  = 3 unidades (entre caracteres distintos)
 *   inter-word gap  = 7 unidades (entre palabras/grupos)
 * 
 * ── Farnsworth / Multiplicadores ────────────────────────────────
 * IZ2UUF usa multiplicadores (no "effective WPM") para extender los espacios.
 * Esto permite:
 *   - Mantener los caracteres a alta velocidad (reconocimiento de patrón)
 *   - Dar más tiempo entre caracteres y palabras para procesar
 * 
 *   interCharGap = (3 × dot) × charSpacing
 *   interWordGap = (7 × dot) × wordSpacing
 * 
 * Ejemplo 20 WPM, charSpacing=2.0:
 *   dot = 60ms, interCharGap = 60×3×2.0 = 360ms (vs 180ms estándar)
 * ─────────────────────────────────────────────────────────────────
 */

/**
 * Calcula todas las duraciones de timing en milisegundos.
 * 
 * @param {number} wpm          - Velocidad de los caracteres (palabras por minuto)
 * @param {number} charSpacing  - Multiplicador del espacio inter-carácter (default 1.0)
 * @param {number} wordSpacing  - Multiplicador del espacio inter-palabra (default 1.0)
 * @param {number} dashDotRatio - Ratio duración dash/dot (estándar ITU = 3.0)
 * @returns {{
 *   dot:           number,  ms
 *   dash:          number,  ms
 *   intraCharGap:  number,  ms — entre elementos dentro de un carácter
 *   interCharGap:  number,  ms — entre caracteres distintos
 *   interWordGap:  number,  ms — entre palabras/grupos
 *   wpm:           number,  WPM efectivo (igual al input, sin modificar)
 * }}
 */
export function calculateTimings(
  wpm,
  charSpacing  = 1.0,
  wordSpacing  = 1.0,
  dashDotRatio = 3.0
) {
  // La unidad base de tiempo: duración de un dit
  const dotDuration = 1200 / wpm;

  return {
    dot:          dotDuration,
    dash:         dotDuration * dashDotRatio,
    intraCharGap: dotDuration,                     // 1 dit entre elementos
    interCharGap: dotDuration * 3 * charSpacing,   // 3 dits × multiplicador
    interWordGap: dotDuration * 7 * wordSpacing,   // 7 dits × multiplicador
    wpm,
  };
}

/**
 * Convierte CPM (caracteres por minuto) a WPM (palabras por minuto).
 * Basado en la convención de la palabra PARIS = 5 caracteres.
 * 
 * @param {number} cpm
 * @returns {number} wpm
 */
export function cpmToWpm(cpm) {
  return cpm / 5;
}

/**
 * Convierte WPM a CPM.
 * 
 * @param {number} wpm
 * @returns {number} cpm
 */
export function wpmToCpm(wpm) {
  return wpm * 5;
}

/**
 * Normaliza la velocidad a WPM independientemente de la unidad configurada.
 * Centraliza la conversión para que el resto del código siempre trabaje en WPM.
 * 
 * @param {number} speedValue - Valor de velocidad
 * @param {string} speedUnit  - 'wpm' | 'cpm'
 * @returns {number}            Velocidad en WPM
 */
export function normalizeToWpm(speedValue, speedUnit) {
  if (speedUnit === 'cpm') return cpmToWpm(speedValue);
  return speedValue;
}

/**
 * Estima la duración total en ms de un grupo de caracteres dado los timings.
 * Útil para pre-calcular el progreso de la barra de tiempo y para tests.
 * 
 * @param {string}   group    - Cadena de caracteres a transmitir
 * @param {object}   timings  - Resultado de calculateTimings()
 * @param {object}   morseCodes - Tabla de códigos Morse
 * @returns {number}            Duración estimada en ms
 */
export function estimateGroupDuration(group, timings, morseCodes) {
  let totalMs = 0;

  for (let ci = 0; ci < group.length; ci++) {
    const code = morseCodes[group[ci].toUpperCase()];
    if (!code) continue;

    // Suma la duración de cada elemento del carácter
    for (let ei = 0; ei < code.length; ei++) {
      const isDot = code[ei] === '.';
      totalMs += isDot ? timings.dot : timings.dash;

      // Gap intra-carácter (entre elementos del mismo carácter)
      if (ei < code.length - 1) {
        totalMs += timings.intraCharGap;
      }
    }

    // Gap inter-carácter (entre caracteres distintos, no después del último)
    if (ci < group.length - 1) {
      totalMs += timings.interCharGap;
    }
  }

  return totalMs;
}
