/**
 * storage.js
 * ─────────────────────────────────────────────────────────────────
 * Wrapper para localStorage con serialización JSON.
 * 
 * Centraliza toda la persistencia de datos del usuario para que:
 *   1. Cualquier error de lectura/escritura se maneje en un solo lugar
 *   2. Sea fácil cambiar el backend de persistencia en el futuro
 *   3. Sea posible exportar/importar todos los datos del usuario
 * 
 * ── Claves de localStorage ────────────────────────────────────────
 *   morse-trainer-settings  → Configuración del usuario
 *   morse-trainer-progress  → Historial y estadísticas
 * ─────────────────────────────────────────────────────────────────
 */

const KEYS = {
  SETTINGS: 'morse-trainer-settings',
  PROGRESS: 'morse-trainer-progress',
};

// ─────────────────────────────────────────────────────────────────
// Operaciones genéricas de localStorage
// ─────────────────────────────────────────────────────────────────

/**
 * Lee un valor de localStorage y lo deserializa de JSON.
 * Retorna null si la clave no existe o si el JSON está corrupto.
 * 
 * @param {string} key - Clave de localStorage
 * @returns {any|null}   Valor deserializado o null
 */
export function loadFromStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.error(`storage: error leyendo "${key}":`, error);
    return null;
  }
}

/**
 * Serializa un valor a JSON y lo escribe en localStorage.
 * Retorna true si tuvo éxito, false si falló (ej: localStorage lleno).
 * 
 * @param {string} key   - Clave de localStorage
 * @param {any}    value - Valor a guardar
 * @returns {boolean}      true si se guardó exitosamente
 */
export function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`storage: error escribiendo "${key}":`, error);
    return false;
  }
}

/**
 * Elimina una clave de localStorage.
 * 
 * @param {string} key
 */
export function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`storage: error eliminando "${key}":`, error);
  }
}

// ─────────────────────────────────────────────────────────────────
// API de alto nivel para Settings
// ─────────────────────────────────────────────────────────────────

/**
 * Carga los settings del usuario desde localStorage.
 * @returns {object|null} Settings guardados, o null si no hay datos
 */
export function loadSettings() {
  return loadFromStorage(KEYS.SETTINGS);
}

/**
 * Guarda los settings del usuario en localStorage.
 * @param {object} settings
 * @returns {boolean}
 */
export function saveSettings(settings) {
  return saveToStorage(KEYS.SETTINGS, settings);
}

// ─────────────────────────────────────────────────────────────────
// API de alto nivel para Progress
// ─────────────────────────────────────────────────────────────────

/**
 * Carga el progreso del usuario desde localStorage.
 * @returns {object|null} Progreso guardado, o null si no hay datos
 */
export function loadProgress() {
  return loadFromStorage(KEYS.PROGRESS);
}

/**
 * Guarda el progreso del usuario en localStorage.
 * Limita el historial de sesiones a las últimas 100 para evitar
 * que el localStorage crezca indefinidamente.
 * 
 * @param {object} progress
 * @returns {boolean}
 */
export function saveProgress(progress) {
  const sanitized = {
    ...progress,
    // Mantener solo las últimas 100 sesiones
    sessionHistory: (progress.sessionHistory || []).slice(-100),
  };
  return saveToStorage(KEYS.PROGRESS, sanitized);
}

// ─────────────────────────────────────────────────────────────────
// Export / Import (backup del usuario)
// ─────────────────────────────────────────────────────────────────

/**
 * Exporta todos los datos del usuario como un string JSON descargable.
 * Incluye settings y progreso con metadata de versión y fecha.
 * 
 * @param {object} settings - Settings actuales
 * @param {object} progress - Progreso actual
 * @returns {string}          JSON string para descargar
 */
export function exportAllData(settings, progress) {
  const exportData = {
    _meta: {
      version:    '1.0',
      exportDate: new Date().toISOString(),
      app:        'Morse Koch Trainer — Radio Club Córdoba',
    },
    settings,
    progress,
  };
  return JSON.stringify(exportData, null, 2);
}

/**
 * Dispara la descarga del archivo de backup en el navegador.
 * 
 * @param {object} settings
 * @param {object} progress
 */
export function downloadBackup(settings, progress) {
  const json     = exportAllData(settings, progress);
  const blob     = new Blob([json], { type: 'application/json' });
  const url      = URL.createObjectURL(blob);
  const a        = document.createElement('a');
  a.href         = url;
  a.download     = `morse-trainer-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parsea e importa datos desde un archivo de backup.
 * Valida la estructura básica antes de retornar.
 * 
 * @param {string} jsonString - Contenido del archivo JSON
 * @returns {{ settings: object, progress: object } | null} null si el archivo es inválido
 */
export function importFromJson(jsonString) {
  try {
    const data = JSON.parse(jsonString);

    // Validación básica de estructura
    if (!data.settings || !data.progress) {
      console.error('storage: archivo de backup inválido (faltan settings o progress)');
      return null;
    }

    return {
      settings: data.settings,
      progress: data.progress,
    };
  } catch (error) {
    console.error('storage: error parseando backup JSON:', error);
    return null;
  }
}

/**
 * Genera un ID único simple (no necesitamos UUID completo).
 * Se usa para IDs de sesiones y presets.
 * 
 * @returns {string} ID único
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
