/**
 * SettingsContext.jsx
 * ─────────────────────────────────────────────────────────────────
 * Contexto global para todos los settings de la app.
 * 
 * ── Patrón: Context + useReducer ─────────────────────────────────
 * Usamos useReducer en vez de useState para el settings completo porque:
 *   1. Los settings son un objeto grande con muchos campos
 *   2. useReducer permite actualizar campos individuales de forma predecible
 *   3. Los reducers son fáciles de testear unitariamente
 *   4. Las acciones son auto-documentadas (nombre descriptivo)
 * 
 * ── Persistencia ─────────────────────────────────────────────────
 * Cada vez que los settings cambian, se guardan en localStorage automáticamente.
 * Al inicializar, se cargan los settings guardados (con fallback a defaults).
 * ─────────────────────────────────────────────────────────────────
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { DEFAULT_SETTINGS, mergeWithDefaults } from '../constants/defaults.js';
import { loadSettings, saveSettings } from '../utils/storage.js';

// ─────────────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────────────

/**
 * Tipos de acción del settings reducer.
 * Cada acción tiene un nombre descriptivo y un payload mínimo.
 */
const ACTIONS = {
  UPDATE_SETTING: 'UPDATE_SETTING',   // Actualizar un setting individual
  UPDATE_MANY:    'UPDATE_MANY',      // Actualizar múltiples settings a la vez (para presets)
  RESET_ALL:      'RESET_ALL',        // Restaurar todos los settings a los defaults
};

/**
 * Reducer de settings.
 * Maneja todas las modificaciones al estado de configuración.
 * 
 * @param {object} state  - Estado actual de los settings
 * @param {object} action - Acción con { type, payload }
 * @returns {object}        Nuevo estado
 */
function settingsReducer(state, action) {
  switch (action.type) {
    case ACTIONS.UPDATE_SETTING:
      // Actualizar un campo específico por su key
      return {
        ...state,
        [action.payload.key]: action.payload.value,
      };

    case ACTIONS.UPDATE_MANY:
      // Cargar un preset: merge de los settings del preset sobre el estado actual
      return {
        ...state,
        ...action.payload,
      };

    case ACTIONS.RESET_ALL:
      // Restaurar a defaults (el efecto de persistencia lo guardará en localStorage)
      return { ...DEFAULT_SETTINGS };

    default:
      console.warn(`SettingsContext: acción desconocida: ${action.type}`);
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────
// Contexto
// ─────────────────────────────────────────────────────────────────

const SettingsContext = createContext(null);

/**
 * Provider de Settings.
 * Envuelve la app para que cualquier componente pueda leer/escribir settings.
 * 
 * @param {{ children: React.ReactNode }} props
 */
export function SettingsProvider({ children }) {
  // Inicializar desde localStorage (con fallback a defaults)
  const [settings, dispatch] = useReducer(
    settingsReducer,
    null, // initialState null → usamos la función de inicialización
    () => {
      const saved = loadSettings();
      return mergeWithDefaults(saved); // garantiza que todos los campos existan
    }
  );

  // Persistir en localStorage cada vez que los settings cambian
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // ── Actions expuestas al resto de la app ───────────────────

  /**
   * Actualiza un setting individual.
   * @param {string} key   - ID del setting (ej: 'speedValue')
   * @param {any}    value - Nuevo valor
   */
  const updateSetting = useCallback((key, value) => {
    dispatch({ type: ACTIONS.UPDATE_SETTING, payload: { key, value } });
  }, []);

  /**
   * Aplica múltiples settings a la vez.
   * Se usa principalmente para cargar presets.
   * @param {object} updates - Objeto con los settings a actualizar
   */
  const updateMany = useCallback((updates) => {
    dispatch({ type: ACTIONS.UPDATE_MANY, payload: updates });
  }, []);

  /**
   * Restaura todos los settings a los valores por defecto.
   */
  const resetToDefaults = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_ALL });
  }, []);

  // ── Valor del contexto ─────────────────────────────────────
  const value = {
    settings,
    updateSetting,
    updateMany,
    resetToDefaults,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Hook para acceder al contexto de settings.
 * Lanza un error descriptivo si se usa fuera del SettingsProvider.
 * 
 * @returns {{ settings: object, updateSetting: Function, updateMany: Function, resetToDefaults: Function }}
 */
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings() debe usarse dentro de <SettingsProvider>');
  }
  return context;
}

export default SettingsContext;
