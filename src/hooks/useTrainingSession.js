/**
 * useTrainingSession.js
 * ─────────────────────────────────────────────────────────────────
 * Hook que orquesta toda la lógica de una sesión de entrenamiento Koch.
 *
 * ── Máquina de estados ────────────────────────────────────────────
 *   IDLE → COUNTDOWN → PLAYING_AUDIO → WAITING_INPUT → FEEDBACK → (loop)
 *                                                              ↓
 *                                                           PAUSED
 *                                                              ↓
 *                                                          FINISHED
 *
 * ── Notas de implementación ──────────────────────────────────────
 * El patrón de refs paralelas a estados (ej: inputTextRef + inputText)
 * es necesario porque los callbacks de setInterval/setTimeout capturan
 * el valor de los estados en el momento de su creación (closure stale).
 * Usando refs podemos siempre leer el valor más reciente desde dentro
 * de un timer sin necesidad de recrearlo.
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { generateGroup }                            from '../engine/GroupGenerator.js';
import { compareGroups, aggregateResults }          from '../engine/AccuracyCalculator.js';
import { getSequenceByExerciseType }                from '../constants/kochSequences.js';

// ── Estados posibles de la sesión ─────────────────────────────────
export const SESSION_STATE = {
  IDLE:          'idle',
  COUNTDOWN:     'countdown',
  PLAYING_AUDIO: 'playing_audio',
  WAITING_INPUT: 'waiting_input',
  FEEDBACK:      'feedback',
  PAUSED:        'paused',
  FINISHED:      'finished',
};

// Segundos que tiene el usuario para responder después del audio
const INPUT_TIMEOUT_SEC = 4;
// Ms que se muestra el feedback antes de pasar al siguiente grupo
const FEEDBACK_DISPLAY_MS = 1800;

export function useTrainingSession({ settings, playGroup, stopAudio }) {
  // ── Estado reactivo (para render) ────────────────────────────
  const [sessionState,   setSessionState]   = useState(SESSION_STATE.IDLE);
  const [currentGroup,   setCurrentGroup]   = useState('');
  const [inputText,      setInputText]      = useState('');
  const [lastFeedback,   setLastFeedback]   = useState(null);
  const [timeRemaining,  setTimeRemaining]  = useState(0);
  const [inputTimeout,   setInputTimeout]   = useState(0);
  const [countdownSec,   setCountdownSec]   = useState(0);
  const [sessionResults, setSessionResults] = useState([]);

  // ── Refs paralelas: siempre tienen el valor actual (sin stale closure) ──
  const sessionStateRef  = useRef(SESSION_STATE.IDLE);
  const currentGroupRef  = useRef('');
  const inputTextRef     = useRef('');   // ← clave para leer desde timers
  const settingsRef      = useRef(settings);

  // Mantener refs sincronizadas con el estado
  useEffect(() => { sessionStateRef.current  = sessionState;   }, [sessionState]);
  useEffect(() => { currentGroupRef.current  = currentGroup;   }, [currentGroup]);
  useEffect(() => { inputTextRef.current     = inputText;      }, [inputText]);
  useEffect(() => { settingsRef.current      = settings;       }, [settings]);

  // ── Refs de timers ─────────────────────────────────────────────
  const sessionTimerRef   = useRef(null);
  const inputTimerRef     = useRef(null);
  const countdownTimerRef = useRef(null);
  const feedbackTimerRef  = useRef(null);

  // ── Flag para evitar que playNextGroup se llame concurrentemente ──
  const isPlayingGroupRef = useRef(false);

  // ── Helper: cancelar todos los timers activos ─────────────────
  const clearAllTimers = useCallback(() => {
    [sessionTimerRef, inputTimerRef, countdownTimerRef, feedbackTimerRef].forEach(ref => {
      if (ref.current !== null) {
        clearInterval(ref.current);
        clearTimeout(ref.current);
        ref.current = null;
      }
    });
  }, []);

  // ── Helper: generar el próximo grupo según settings ───────────
  const getNextGroup = useCallback(() => {
    const s        = settingsRef.current;
    const sequence = getSequenceByExerciseType(s.exerciseType);
    return generateGroup(s, sequence);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // submitResponse: compara sent vs received, guarda resultado,
  //                 muestra feedback y programa el siguiente grupo.
  // Es el corazón del loop de entrenamiento.
  // ─────────────────────────────────────────────────────────────
  const submitResponse = useCallback((response) => {
    // Ignorar si no estamos en un estado que acepta respuestas
    const state = sessionStateRef.current;
    if (state !== SESSION_STATE.PLAYING_AUDIO &&
        state !== SESSION_STATE.WAITING_INPUT) return;

    // Detener el audio si todavía sonaba (el usuario confirmó antes de que terminara)
    stopAudio();

    // Cancelar el timer de input
    if (inputTimerRef.current) {
      clearInterval(inputTimerRef.current);
      inputTimerRef.current = null;
    }

    const group  = currentGroupRef.current;
    const result = compareGroups(group, response);

    setLastFeedback({ sent: group, received: response, result });
    setSessionResults(prev => [...prev, result]);
    setSessionState(SESSION_STATE.FEEDBACK);
    sessionStateRef.current = SESSION_STATE.FEEDBACK;

    // Auto-avanzar al siguiente grupo tras FEEDBACK_DISPLAY_MS
    feedbackTimerRef.current = setTimeout(() => {
      feedbackTimerRef.current = null;
      if (sessionStateRef.current === SESSION_STATE.FEEDBACK) {
        playNextGroupInternal();
      }
    }, FEEDBACK_DISPLAY_MS);

  }, [stopAudio]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────
  // playNextGroupInternal: genera y reproduce el siguiente grupo.
  // Función interna; no expuesta directamente.
  // ─────────────────────────────────────────────────────────────
  const playNextGroupInternal = useCallback(async () => {
    // Guardia contra llamadas concurrentes
    if (isPlayingGroupRef.current) return;
    if (sessionStateRef.current === SESSION_STATE.FINISHED ||
        sessionStateRef.current === SESSION_STATE.PAUSED) return;

    isPlayingGroupRef.current = true;

    const group = getNextGroup();
    setCurrentGroup(group);
    currentGroupRef.current = group;
    setInputText('');
    inputTextRef.current = '';
    setLastFeedback(null);
    setInputTimeout(INPUT_TIMEOUT_SEC);

    setSessionState(SESSION_STATE.PLAYING_AUDIO);
    sessionStateRef.current = SESSION_STATE.PLAYING_AUDIO;

    // Reproducir audio — await resuelve cuando el audio terminó
    await playGroup(group, settingsRef.current);

    isPlayingGroupRef.current = false;

    // Si se pausó o terminó la sesión durante el audio, salir
    if (sessionStateRef.current === SESSION_STATE.PAUSED ||
        sessionStateRef.current === SESSION_STATE.FINISHED) return;

    // Pasar a estado de espera de input
    setSessionState(SESSION_STATE.WAITING_INPUT);
    sessionStateRef.current = SESSION_STATE.WAITING_INPUT;

    // Iniciar countdown del timeout de input
    let remaining = INPUT_TIMEOUT_SEC;
    inputTimerRef.current = setInterval(() => {
      remaining -= 1;
      setInputTimeout(remaining);

      if (remaining <= 0) {
        clearInterval(inputTimerRef.current);
        inputTimerRef.current = null;
        // Leer el texto actualizado desde la ref (no desde closure stale)
        submitResponse(inputTextRef.current);
      }
    }, 1000);

  }, [getNextGroup, playGroup, submitResponse]);

  // ── startSessionTimer ────────────────────────────────────────
  // Inicia el countdown de duración de sesión.
  // Separado de startSession para que pueda llamarse DESPUÉS del COUNTDOWN
  // (fix #4: el timer no debe correr mientras se muestra la cuenta regresiva).
  const startSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) return; // ya corriendo (guard)
    sessionTimerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(sessionTimerRef.current);
          sessionTimerRef.current = null;
          stopAudio();
          clearAllTimers();
          setSessionState(SESSION_STATE.FINISHED);
          sessionStateRef.current = SESSION_STATE.FINISHED;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopAudio, clearAllTimers]);

  // ── startSession ──────────────────────────────────────────────
  const startSession = useCallback(() => {
    clearAllTimers();
    isPlayingGroupRef.current = false;
    setSessionResults([]);
    setLastFeedback(null);
    setInputText('');
    inputTextRef.current = '';

    const duration = settingsRef.current.exerciseDuration;
    setTimeRemaining(duration);

    // Cuenta regresiva inicial (startPause).
    // El timer de sesión NO arranca hasta que el countdown termina (#4).
    const startPause = settingsRef.current.startPause || 0;

    if (startPause > 0) {
      setCountdownSec(startPause);
      setSessionState(SESSION_STATE.COUNTDOWN);
      sessionStateRef.current = SESSION_STATE.COUNTDOWN;

      let remaining = startPause;
      countdownTimerRef.current = setInterval(() => {
        remaining -= 1;
        setCountdownSec(remaining);
        if (remaining <= 0) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          // Arrancar el timer de sesión AQUÍ, después del countdown
          startSessionTimer();
          playNextGroupInternal();
        }
      }, 1000);
    } else {
      // Sin countdown: el timer empieza junto con el primer grupo
      startSessionTimer();
      playNextGroupInternal();
    }
  }, [clearAllTimers, stopAudio, playNextGroupInternal, startSessionTimer]);

  // ── togglePause ───────────────────────────────────────────────
  const togglePause = useCallback(() => {
    if (sessionStateRef.current === SESSION_STATE.PAUSED) {
      // Reanudar: reiniciar el timer de sesión desde el tiempo restante actual (#5)
      // y reproducir el grupo actual nuevamente.
      startSessionTimer();
      isPlayingGroupRef.current = false;
      playNextGroupInternal();
    } else {
      // Pausar: detener audio, congelar el timer de sesión (#5) y limpiar
      // los timers de grupo.
      stopAudio();
      isPlayingGroupRef.current = false;

      // Detener el timer de sesión para que el tiempo no corra en pausa (#5)
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }

      if (inputTimerRef.current)    { clearInterval(inputTimerRef.current);  inputTimerRef.current = null; }
      if (feedbackTimerRef.current) { clearTimeout(feedbackTimerRef.current); feedbackTimerRef.current = null; }

      setSessionState(SESSION_STATE.PAUSED);
      sessionStateRef.current = SESSION_STATE.PAUSED;
    }
  }, [stopAudio, playNextGroupInternal, startSessionTimer]);

  // ── endSession ────────────────────────────────────────────────
  const endSession = useCallback(() => {
    stopAudio();
    clearAllTimers();
    isPlayingGroupRef.current = false;
    setSessionState(SESSION_STATE.FINISHED);
    sessionStateRef.current = SESSION_STATE.FINISHED;
  }, [stopAudio, clearAllTimers]);

  // ── resetSession ──────────────────────────────────────────────
  const resetSession = useCallback(() => {
    stopAudio();
    clearAllTimers();
    isPlayingGroupRef.current = false;
    setSessionState(SESSION_STATE.IDLE);
    sessionStateRef.current = SESSION_STATE.IDLE;
    setSessionResults([]);
    setCurrentGroup('');
    currentGroupRef.current = '';
    setInputText('');
    inputTextRef.current = '';
    setLastFeedback(null);
    setTimeRemaining(0);
  }, [stopAudio, clearAllTimers]);

  // ── confirmInput: el usuario presionó Enter o Space ───────────
  const confirmInput = useCallback(() => {
    // Leer desde ref para tener el texto más actualizado
    submitResponse(inputTextRef.current);
  }, [submitResponse]);

  // Cleanup al desmontar el componente
  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  // ── Stats acumuladas de la sesión ─────────────────────────────
  const sessionStats = sessionResults.length > 0
    ? aggregateResults(sessionResults)
    : null;

  return {
    sessionState,
    currentGroup,
    inputText,
    setInputText,
    lastFeedback,
    timeRemaining,
    inputTimeout,
    countdownSec,
    sessionResults,
    sessionStats,
    startSession,
    togglePause,
    endSession,
    resetSession,
    confirmInput,
  };
}
