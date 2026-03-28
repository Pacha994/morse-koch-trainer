/**
 * ProgressContext.jsx
 * ─────────────────────────────────────────────────────────────────
 * Contexto global para el progreso acumulado del usuario.
 *
 * ── Qué guarda ────────────────────────────────────────────────────
 * - Historial de sesiones (últimas 100)
 * - Estadísticas por carácter (acumuladas de toda la vida del usuario)
 * - Estadísticas globales (tiempo total, sesiones, fechas)
 *
 * ── Persistencia ─────────────────────────────────────────────────
 * Se guarda en localStorage en cada modificación.
 * Al cargar, se fusiona con los defaults para tolerar cambios de schema.
 * ─────────────────────────────────────────────────────────────────
 */

import React, {
  createContext, useContext, useReducer, useEffect, useCallback,
} from 'react';
import { DEFAULT_PROGRESS, mergeProgressWithDefaults } from '../constants/defaults.js';
import { loadProgress, saveProgress, generateId }     from '../utils/storage.js';
import { mergeCharStats }                              from '../engine/AccuracyCalculator.js';

// ── Tipos de acción ───────────────────────────────────────────────
const ACTIONS = {
  RECORD_SESSION: 'RECORD_SESSION', // Guardar una sesión completada
  RESET_PROGRESS: 'RESET_PROGRESS', // Borrar todo el historial
};

/**
 * Reducer del progreso.
 * Cada acción retorna un nuevo objeto de progreso inmutable.
 */
function progressReducer(state, action) {
  switch (action.type) {

    case ACTIONS.RECORD_SESSION: {
      const session    = action.payload;
      const now        = new Date().toISOString();

      // Fusionar las stats de la sesión con las acumuladas lifetime
      const updatedCharStats = mergeCharStats(
        state.characterStats,
        session.characterScores
      );

      // Construir la entrada del historial
      const historyEntry = {
        id:              generateId(),
        date:            now,
        exerciseType:    session.exerciseType,
        kochLevel:       session.kochLevel,
        speedValue:      session.speedValue,
        speedUnit:       session.speedUnit,
        accuracy:        session.accuracy,
        totalChars:      session.totalChars,
        correctChars:    session.correctChars,
        durationSeconds: session.durationSeconds,
        characterScores: session.characterScores,
      };

      return {
        ...state,
        characterStats:   updatedCharStats,
        sessionHistory:   [...state.sessionHistory, historyEntry].slice(-100),
        totalTrainingTime: state.totalTrainingTime + (session.durationSeconds || 0),
        totalSessions:     state.totalSessions + 1,
        firstSessionDate:  state.firstSessionDate ?? now,
        lastSessionDate:   now,
      };
    }

    case ACTIONS.RESET_PROGRESS:
      return { ...DEFAULT_PROGRESS };

    default:
      return state;
  }
}

// ── Contexto ──────────────────────────────────────────────────────
const ProgressContext = createContext(null);

/**
 * Provider de Progreso.
 * @param {{ children: React.ReactNode }} props
 */
export function ProgressProvider({ children }) {
  const [progress, dispatch] = useReducer(
    progressReducer,
    null,
    () => {
      const saved = loadProgress();
      return mergeProgressWithDefaults(saved);
    }
  );

  // Persistir en localStorage cuando el progreso cambia
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  /**
   * Registra una sesión completada en el historial.
   *
   * @param {object} sessionData
   * @param {object} sessionData.sessionStats    - Resultado agregado (accuracy, totalChars, etc.)
   * @param {object} sessionData.settings        - Settings de la sesión
   * @param {number} sessionData.durationSeconds - Duración real de la sesión
   */
  const recordSession = useCallback((sessionData) => {
    const { sessionStats, settings, durationSeconds } = sessionData;
    if (!sessionStats || sessionStats.totalChars === 0) return; // Ignorar sesiones vacías

    dispatch({
      type: ACTIONS.RECORD_SESSION,
      payload: {
        exerciseType:    settings.exerciseType,
        kochLevel:       settings.kochLevel,
        speedValue:      settings.speedValue,
        speedUnit:       settings.speedUnit,
        accuracy:        sessionStats.accuracy,
        totalChars:      sessionStats.totalChars,
        correctChars:    sessionStats.correctChars,
        durationSeconds: durationSeconds,
        characterScores: sessionStats.charScores,
      },
    });
  }, []);

  /**
   * Borra todo el historial de progreso.
   * Pide confirmación antes de ejecutar.
   */
  const resetProgress = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_PROGRESS });
  }, []);

  // ── Derivaciones útiles ──────────────────────────────────────

  /**
   * Retorna las últimas N sesiones del historial, de más reciente a más antigua.
   * @param {number} n
   */
  const getRecentSessions = useCallback((n = 10) => {
    return [...progress.sessionHistory].reverse().slice(0, n);
  }, [progress.sessionHistory]);

  /**
   * Retorna la accuracy promedio de las últimas N sesiones.
   * @param {number} n
   */
  const getRecentAccuracy = useCallback((n = 5) => {
    const recent = getRecentSessions(n);
    if (recent.length === 0) return null;
    return recent.reduce((sum, s) => sum + s.accuracy, 0) / recent.length;
  }, [getRecentSessions]);

  /**
   * Formatea el tiempo total de entrenamiento como string legible.
   * Ej: "3h 25m" o "45m"
   */
  const formattedTotalTime = (() => {
    const total = progress.totalTrainingTime;
    const h     = Math.floor(total / 3600);
    const m     = Math.floor((total % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  })();

  const value = {
    progress,
    recordSession,
    resetProgress,
    getRecentSessions,
    getRecentAccuracy,
    formattedTotalTime,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

/**
 * Hook para acceder al contexto de progreso.
 */
export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress() debe usarse dentro de <ProgressProvider>');
  return ctx;
}

export default ProgressContext;
