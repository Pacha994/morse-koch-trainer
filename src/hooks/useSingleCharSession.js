/**
 * useSingleCharSession.js
 * ─────────────────────────────────────────────────────────────────
 * Hook que orquesta la lógica de una sesión Single Char.
 *
 * ── Máquina de estados ────────────────────────────────────────────
 *   IDLE → COUNTDOWN → PLAYING_AUDIO → WAITING_INPUT → FEEDBACK → (loop)
 *                                                              ↓
 *                                                           PAUSED
 *                                                              ↓
 *                                                          FINISHED
 *
 * Diferencias con useTrainingSession:
 * - Genera 1 carácter por turno (no grupos)
 * - Sin timeout de input: el usuario se toma el tiempo que necesita
 * - El feedback muestra el nombre OTAN del carácter correcto
 * - El siguiente carácter suena automáticamente tras el feedback
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { getNextSingleChar }  from '../engine/SingleCharGenerator.js';
import { ITU_PHONETIC }       from '../constants/ituPhonetic.js';

export const SC_STATE = {
  IDLE:          'idle',
  COUNTDOWN:     'countdown',
  PLAYING_AUDIO: 'playing_audio',
  WAITING_INPUT: 'waiting_input',
  FEEDBACK:      'feedback',
  PAUSED:        'paused',
  FINISHED:      'finished',
};

// Ms que se muestra el feedback antes de pasar al siguiente carácter
const FEEDBACK_DISPLAY_MS = 1600;

export function useSingleCharSession({ settings, charSet, playGroup, stopAudio }) {
  // ── Estado reactivo ───────────────────────────────────────
  const [sessionState,   setSessionState]   = useState(SC_STATE.IDLE);
  const [currentChar,    setCurrentChar]    = useState('');
  const [inputChar,      setInputChar]      = useState('');
  const [lastFeedback,   setLastFeedback]   = useState(null);
  const [timeRemaining,  setTimeRemaining]  = useState(0);
  const [countdownSec,   setCountdownSec]   = useState(0);
  const [sessionResults, setSessionResults] = useState([]);

  // ── Refs paralelas ────────────────────────────────────────
  const sessionStateRef = useRef(SC_STATE.IDLE);
  const currentCharRef  = useRef('');
  const inputCharRef    = useRef('');
  const settingsRef     = useRef(settings);
  const charSetRef      = useRef(charSet);

  useEffect(() => { sessionStateRef.current = sessionState;  }, [sessionState]);
  useEffect(() => { currentCharRef.current  = currentChar;   }, [currentChar]);
  useEffect(() => { inputCharRef.current    = inputChar;     }, [inputChar]);
  useEffect(() => { settingsRef.current     = settings;      }, [settings]);
  useEffect(() => { charSetRef.current      = charSet;       }, [charSet]);

  // ── Refs de timers ────────────────────────────────────────
  const sessionTimerRef   = useRef(null);
  const countdownTimerRef = useRef(null);
  const feedbackTimerRef  = useRef(null);
  const isPlayingRef      = useRef(false);

  const clearAllTimers = useCallback(() => {
    [sessionTimerRef, countdownTimerRef, feedbackTimerRef].forEach(ref => {
      if (ref.current !== null) {
        clearInterval(ref.current);
        clearTimeout(ref.current);
        ref.current = null;
      }
    });
  }, []);

  // ── submitResponse ────────────────────────────────────────
  const submitResponse = useCallback((typed) => {
    const state = sessionStateRef.current;
    if (state !== SC_STATE.PLAYING_AUDIO &&
        state !== SC_STATE.WAITING_INPUT) return;

    stopAudio();

    const correct   = currentCharRef.current;
    const isCorrect = typed.toUpperCase() === correct;
    const phonetic  = ITU_PHONETIC[correct] ?? correct;

    const result = {
      char:      correct,
      typed:     typed.toUpperCase(),
      isCorrect,
      phonetic,
    };

    setLastFeedback(result);
    setSessionResults(prev => [...prev, result]);
    setInputChar('');
    inputCharRef.current = '';

    setSessionState(SC_STATE.FEEDBACK);
    sessionStateRef.current = SC_STATE.FEEDBACK;

    feedbackTimerRef.current = setTimeout(() => {
      feedbackTimerRef.current = null;
      if (sessionStateRef.current === SC_STATE.FEEDBACK) {
        playNextCharInternal();
      }
    }, FEEDBACK_DISPLAY_MS);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopAudio]);

  // ── playNextCharInternal ──────────────────────────────────
  const playNextCharInternal = useCallback(async () => {
    if (isPlayingRef.current) return;
    if (sessionStateRef.current === SC_STATE.FINISHED ||
        sessionStateRef.current === SC_STATE.PAUSED) return;

    const set = charSetRef.current;
    if (!set || set.length === 0) return;

    isPlayingRef.current = true;

    const char = getNextSingleChar(set);
    setCurrentChar(char);
    currentCharRef.current = char;
    setInputChar('');
    inputCharRef.current = '';
    setLastFeedback(null);

    setSessionState(SC_STATE.PLAYING_AUDIO);
    sessionStateRef.current = SC_STATE.PLAYING_AUDIO;

    // playGroup acepta un string; pasamos el carácter solo
    await playGroup(char, settingsRef.current);

    isPlayingRef.current = false;

    if (sessionStateRef.current === SC_STATE.PAUSED ||
        sessionStateRef.current === SC_STATE.FINISHED) return;

    setSessionState(SC_STATE.WAITING_INPUT);
    sessionStateRef.current = SC_STATE.WAITING_INPUT;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playGroup]);

  // ── startSessionTimer ─────────────────────────────────────
  const startSessionTimer = useCallback(() => {
    if (sessionTimerRef.current) return;
    sessionTimerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(sessionTimerRef.current);
          sessionTimerRef.current = null;
          stopAudio();
          clearAllTimers();
          setSessionState(SC_STATE.FINISHED);
          sessionStateRef.current = SC_STATE.FINISHED;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopAudio, clearAllTimers]);

  // ── startSession ──────────────────────────────────────────
  const startSession = useCallback(() => {
    clearAllTimers();
    isPlayingRef.current = false;
    setSessionResults([]);
    setLastFeedback(null);
    setInputChar('');
    inputCharRef.current = '';

    const duration   = settingsRef.current.exerciseDuration;
    const startPause = settingsRef.current.startPause || 0;
    setTimeRemaining(duration);

    if (startPause > 0) {
      setCountdownSec(startPause);
      setSessionState(SC_STATE.COUNTDOWN);
      sessionStateRef.current = SC_STATE.COUNTDOWN;

      let remaining = startPause;
      countdownTimerRef.current = setInterval(() => {
        remaining -= 1;
        setCountdownSec(remaining);
        if (remaining <= 0) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
          startSessionTimer();
          playNextCharInternal();
        }
      }, 1000);
    } else {
      startSessionTimer();
      playNextCharInternal();
    }
  }, [clearAllTimers, playNextCharInternal, startSessionTimer]);

  // ── togglePause ───────────────────────────────────────────
  const togglePause = useCallback(() => {
    if (sessionStateRef.current === SC_STATE.PAUSED) {
      startSessionTimer();
      isPlayingRef.current = false;
      playNextCharInternal();
    } else {
      stopAudio();
      isPlayingRef.current = false;
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = null;
      }
      setSessionState(SC_STATE.PAUSED);
      sessionStateRef.current = SC_STATE.PAUSED;
    }
  }, [stopAudio, playNextCharInternal, startSessionTimer]);

  // ── endSession ────────────────────────────────────────────
  const endSession = useCallback(() => {
    stopAudio();
    clearAllTimers();
    isPlayingRef.current = false;
    setSessionState(SC_STATE.FINISHED);
    sessionStateRef.current = SC_STATE.FINISHED;
  }, [stopAudio, clearAllTimers]);

  // ── resetSession ──────────────────────────────────────────
  const resetSession = useCallback(() => {
    stopAudio();
    clearAllTimers();
    isPlayingRef.current = false;
    setSessionState(SC_STATE.IDLE);
    sessionStateRef.current = SC_STATE.IDLE;
    setSessionResults([]);
    setCurrentChar('');
    currentCharRef.current = '';
    setInputChar('');
    inputCharRef.current = '';
    setLastFeedback(null);
    setTimeRemaining(0);
  }, [stopAudio, clearAllTimers]);

  // ── handleKeyPress: llamado desde el componente al presionar tecla ──
  const handleKeyPress = useCallback((key) => {
    const state = sessionStateRef.current;
    if (state !== SC_STATE.PLAYING_AUDIO &&
        state !== SC_STATE.WAITING_INPUT) return;
    if (key.length !== 1) return; // ignorar teclas especiales
    submitResponse(key);
  }, [submitResponse]);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  // ── Stats acumuladas ──────────────────────────────────────
  const totalAttempts = sessionResults.length;
  const correctCount  = sessionResults.filter(r => r.isCorrect).length;
  const accuracy      = totalAttempts > 0
    ? (correctCount / totalAttempts) * 100
    : 0;

  // charScores: { [char]: { correct, total } } — compatible con ProgressContext
  const charScores = sessionResults.reduce((acc, r) => {
    if (!acc[r.char]) acc[r.char] = { correct: 0, total: 0 };
    acc[r.char].total   += 1;
    acc[r.char].correct += r.isCorrect ? 1 : 0;
    return acc;
  }, {});

  const sessionStats = totalAttempts > 0
    ? { accuracy, correctChars: correctCount, totalChars: totalAttempts, charScores }
    : null;

  return {
    sessionState,
    currentChar,
    inputChar,
    lastFeedback,
    timeRemaining,
    countdownSec,
    sessionResults,
    sessionStats,
    startSession,
    togglePause,
    endSession,
    resetSession,
    handleKeyPress,
  };
}
