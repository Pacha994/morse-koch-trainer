/**
 * AccuracyCalculator.js
 * ─────────────────────────────────────────────────────────────────
 * Compara lo que se envió (sent) con lo que el usuario tipeo (received)
 * y calcula la precisión tanto del grupo como por carácter individual.
 * 
 * ── Reglas de comparación ─────────────────────────────────────────
 * La comparación es posicional (índice a índice):
 *   - "KMRS" vs "KMLS" → K✓ M✓ L✗ S✓ → 75% accuracy
 *   - "KMRS" vs "KMR"  → K✓ M✓ R✓ S✗ → 75% (S faltante = error)
 *   - "KMRS" vs "KMRSUU" → K✓ M✓ R✓ S✓ → 100% (extras se ignoran)
 * 
 * La comparación es case-insensitive (el usuario puede tipear en minúsculas).
 * ─────────────────────────────────────────────────────────────────
 */

/**
 * Resultado de comparar un grupo sent vs received.
 * @typedef {object} ComparisonResult
 * @property {number}   accuracy      - Precisión 0-100 (porcentaje)
 * @property {number}   correctChars  - Cantidad de caracteres correctos
 * @property {number}   totalChars    - Total de caracteres en sent
 * @property {object[]} details       - Detalle por carácter
 * @property {object}   charScores    - Scores por carácter: { [char]: { correct, total } }
 */

/**
 * Compara el grupo enviado con la respuesta del usuario.
 * 
 * @param {string} sent     - Grupo original enviado (ej: "KMRS")
 * @param {string} received - Respuesta del usuario (ej: "KMLS")
 * @returns {ComparisonResult}
 */
export function compareGroups(sent, received) {
  const sentUpper     = sent.toUpperCase();
  const receivedUpper = received.toUpperCase();

  let correctChars = 0;
  const details = [];         // Array de { char, received, correct }
  const charScores = {};      // { [char]: { correct, total } }

  // Comparar posición por posición (basado en lo enviado)
  for (let i = 0; i < sentUpper.length; i++) {
    const sentChar     = sentUpper[i];
    const receivedChar = i < receivedUpper.length ? receivedUpper[i] : null;
    const isCorrect    = sentChar === receivedChar;

    if (isCorrect) correctChars++;

    // Acumular stats por carácter
    if (!charScores[sentChar]) {
      charScores[sentChar] = { correct: 0, total: 0 };
    }
    charScores[sentChar].total++;
    if (isCorrect) charScores[sentChar].correct++;

    details.push({
      sentChar,
      receivedChar,  // null si el usuario tipeo menos caracteres que los enviados
      isCorrect,
    });
  }

  const totalChars = sentUpper.length;
  const accuracy   = totalChars > 0 ? (correctChars / totalChars) * 100 : 0;

  return {
    accuracy:     Math.round(accuracy * 10) / 10, // 1 decimal
    correctChars,
    totalChars,
    details,
    charScores,
  };
}

/**
 * Fusiona las estadísticas de múltiples grupos en un objeto acumulado.
 * Se usa para calcular las stats de toda la sesión.
 * 
 * @param {object[]} results - Array de ComparisonResult
 * @returns {{
 *   accuracy:      number,  Precisión total de la sesión
 *   correctChars:  number,
 *   totalChars:    number,
 *   charScores:    object,  Stats acumuladas por carácter
 * }}
 */
export function aggregateResults(results) {
  let totalCorrect = 0;
  let totalChars   = 0;
  const charScores = {};

  for (const result of results) {
    totalCorrect += result.correctChars;
    totalChars   += result.totalChars;

    // Acumular stats por carácter
    for (const [char, scores] of Object.entries(result.charScores)) {
      if (!charScores[char]) {
        charScores[char] = { correct: 0, total: 0 };
      }
      charScores[char].correct += scores.correct;
      charScores[char].total   += scores.total;
    }
  }

  const accuracy = totalChars > 0 ? (totalCorrect / totalChars) * 100 : 0;

  return {
    accuracy:     Math.round(accuracy * 10) / 10,
    correctChars: totalCorrect,
    totalChars,
    charScores,
  };
}

/**
 * Fusiona estadísticas de una sesión con el historial acumulado del usuario.
 * Los datos anteriores se preservan y los nuevos se suman.
 * 
 * @param {object} existing - charScores existentes en el progreso del usuario
 * @param {object} newScores - charScores de la sesión recién terminada
 * @returns {object}           charScores fusionados
 */
export function mergeCharStats(existing, newScores) {
  const merged = { ...existing };

  for (const [char, scores] of Object.entries(newScores)) {
    if (!merged[char]) {
      merged[char] = { correct: 0, total: 0 };
    }
    merged[char].correct += scores.correct;
    merged[char].total   += scores.total;
  }

  return merged;
}

/**
 * Calcula el porcentaje de precisión de un carácter específico.
 * 
 * @param {object} charStats - Stats de un carácter: { correct, total }
 * @returns {number}           Precisión 0-100, o null si sin datos
 */
export function charAccuracy(charStats) {
  if (!charStats || charStats.total === 0) return null;
  return Math.round((charStats.correct / charStats.total) * 1000) / 10;
}
