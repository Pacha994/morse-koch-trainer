/**
 * TrainingScreen.jsx
 * Pantalla principal de entrenamiento.
 * Orquesta todos los estados de la sesión y conecta audio, input, feedback y progreso.
 */
import React, { useEffect, useRef } from 'react';
import { useAudioPlayer }     from '../../hooks/useAudioPlayer.js';
import { useTrainingSession, SESSION_STATE } from '../../hooks/useTrainingSession.js';
import { useKeyboardInput }   from '../../hooks/useKeyboardInput.js';
import { useSettings }        from '../../context/SettingsContext.jsx';
import { AudioIndicator }     from '../training/AudioIndicator.jsx';
import { GroupFeedback }      from '../training/GroupFeedback.jsx';
import { SessionSummary }     from './SessionSummary.jsx';
import { G4FON_ORDER, LCWO_ORDER } from '../../constants/kochSequences.js';

/**
 * @param {object}   props
 * @param {Function} props.onHome     - Callback para volver al home
 * @param {Function} props.onProgress - Callback para ir a la pantalla de progreso
 */
export function TrainingScreen({ onHome, onProgress }) {
  const { settings } = useSettings();

  // ── Audio ─────────────────────────────────────────────────
  const { playGroup, stop: stopAudio, initAudio } = useAudioPlayer();

  // ── Sesión ────────────────────────────────────────────────
  const {
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
  } = useTrainingSession({ settings, playGroup, stopAudio });

  // Trackear duración real de la sesión para el summary
  const sessionStartTime = useRef(null);
  const [durationSeconds, setDurationSeconds] = React.useState(0);

  useEffect(() => {
    if (sessionState === SESSION_STATE.PLAYING_AUDIO && !sessionStartTime.current) {
      sessionStartTime.current = Date.now();
    }
    if (sessionState === SESSION_STATE.FINISHED && sessionStartTime.current) {
      setDurationSeconds(Math.round((Date.now() - sessionStartTime.current) / 1000));
    }
  }, [sessionState]);

  // ── Keyboard input ────────────────────────────────────────
  const inputEnabled =
    sessionState === SESSION_STATE.PLAYING_AUDIO ||
    sessionState === SESSION_STATE.WAITING_INPUT;

  const { inputText: kbText, clearInput } = useKeyboardInput({
    enabled:   inputEnabled,
    onConfirm: confirmInput,
    onPause:   togglePause,
    onRepeat:  () => { /* Fase 3: repetir grupo */ },
  });

  // Sincronizar texto capturado → estado de sesión
  useEffect(() => {
    if (inputEnabled) setInputText(kbText);
  }, [kbText, inputEnabled, setInputText]);

  // Limpiar buffer de teclado al cambiar grupo
  useEffect(() => {
    clearInput();
  }, [currentGroup]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Inicializar audio + arrancar sesión ───────────────────
  const handleStart = () => {
    initAudio(); // Política autoplay: necesita interacción del usuario
    sessionStartTime.current = null;
    startSession();
  };

  // ── Summary ───────────────────────────────────────────────
  if (sessionState === SESSION_STATE.FINISHED && sessionStats) {
    return (
      <SessionSummary
        sessionStats={sessionStats}
        sessionResults={sessionResults}
        settings={settings}
        durationSeconds={durationSeconds}
        onRestart={() => { resetSession(); handleStart(); }}
        onHome={() => { resetSession(); onHome(); }}
        onProgress={() => { resetSession(); onProgress(); }}
      />
    );
  }

  // ── Helpers ───────────────────────────────────────────────
  const mins     = Math.floor(timeRemaining / 60);
  const secs     = String(timeRemaining % 60).padStart(2, '0');
  const sizeClass = {
    small: 'morse-sm', medium: 'morse-md', large: 'morse-lg', xlarge: 'morse-xl',
  }[settings.fontSize] ?? 'morse-md';

  const activeSequence = settings.exerciseType === 'koch_lcwo' ? LCWO_ORDER : G4FON_ORDER;
  const activeChars    = activeSequence.slice(0, settings.kochLevel).join(' ');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        {/* Tiempo restante */}
        <div className="flex items-center gap-2 min-w-[4.5rem]">
          <span
            className="font-mono text-lg font-bold tabular-nums"
            style={{
              color: sessionState === SESSION_STATE.IDLE
                ? 'var(--color-text-muted)'
                : timeRemaining <= 30
                  ? 'var(--color-error)'
                  : 'var(--color-text-primary)',
            }}
          >
            {mins}:{secs}
          </span>
          {sessionState === SESSION_STATE.PAUSED && (
            <span
              className="font-ui text-xs tracking-widest uppercase px-2 py-0.5 rounded-sm"
              style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--color-accent)' }}
            >
              PAUSA
            </span>
          )}
        </div>

        {/* Info central */}
        <span
          className="font-ui text-xs tracking-widest uppercase"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Koch L{settings.kochLevel} · {settings.speedValue} {settings.speedUnit.toUpperCase()}
          {settings.charSpacing !== 1.0 && ` · ${settings.charSpacing.toFixed(1)}×`}
        </span>

        {/* Controles */}
        <div className="flex gap-2 min-w-[4.5rem] justify-end">
          {sessionState !== SESSION_STATE.IDLE ? (
            <>
              <button className="btn-ghost text-xs" onClick={togglePause}>
                {sessionState === SESSION_STATE.PAUSED ? 'Resumir' : 'Pausa'}
              </button>
              <button className="btn-ghost text-xs" onClick={() => { endSession(); onHome(); }}>
                ✕
              </button>
            </>
          ) : (
            <button className="btn-ghost text-xs" onClick={onHome}>← Volver</button>
          )}
        </div>
      </div>

      {/* ── Área principal ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-8">

        {/* IDLE ─────────────────────────────────────────────── */}
        {sessionState === SESSION_STATE.IDLE && (
          <div className="text-center space-y-6 w-full max-w-sm">
            <div>
              <h2
                className="font-ui text-3xl font-bold tracking-widest uppercase"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Sesión Koch
              </h2>
              <p className="mt-2 font-ui text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Nivel {settings.kochLevel} · {Math.floor(settings.exerciseDuration / 60)} minutos ·{' '}
                {settings.speedValue} {settings.speedUnit.toUpperCase()}
              </p>
            </div>

            {/* Caracteres activos */}
            <div
              className="px-6 py-4 rounded-sm border"
              style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <p
                className="font-ui text-xs tracking-widest uppercase mb-2"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Caracteres activos
              </p>
              <p className="morse-text text-lg" style={{ color: 'var(--color-accent)', letterSpacing: '0.3em' }}>
                {activeChars}
              </p>
            </div>

            <button className="btn-primary text-xl px-12 py-4 w-full" onClick={handleStart}>
              EMPEZAR
            </button>

            <p
              className="font-ui text-xs tracking-widest uppercase"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Teclado · Enter confirma · Esc pausa
            </p>
          </div>
        )}

        {/* COUNTDOWN ───────────────────────────────────────── */}
        {sessionState === SESSION_STATE.COUNTDOWN && (
          <div className="text-center">
            <div
              className="morse-text"
              style={{ fontSize: 'clamp(5rem, 20vw, 10rem)', color: 'var(--color-accent)', lineHeight: 1 }}
            >
              {countdownSec}
            </div>
            <p
              className="font-ui text-sm tracking-widest uppercase mt-4"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Preparate para escuchar...
            </p>
          </div>
        )}

        {/* PLAYING_AUDIO / WAITING_INPUT / FEEDBACK ─────────── */}
        {(sessionState === SESSION_STATE.PLAYING_AUDIO ||
          sessionState === SESSION_STATE.WAITING_INPUT ||
          sessionState === SESSION_STATE.FEEDBACK) && (
          <>
            <AudioIndicator
              sessionState={sessionState}
              currentGroup={currentGroup}
              groupPrint={settings.groupPrint}
              inputTimeout={inputTimeout}
            />

            {/* Zona central */}
            <div className="w-full max-w-lg text-center min-h-28 flex flex-col items-center justify-center">
              {sessionState === SESSION_STATE.FEEDBACK ? (
                <GroupFeedback feedback={lastFeedback} fontSize={settings.fontSize} />
              ) : (
                <>
                  {/* Texto tipeado por el usuario */}
                  <div
                    className={`${sizeClass} morse-text`}
                    style={{ color: 'var(--color-accent)', minHeight: '3rem', letterSpacing: '0.3em' }}
                  >
                    {inputText || (
                      <span style={{ color: 'var(--color-text-muted)', opacity: 0.25 }}>_</span>
                    )}
                  </div>

                  {sessionState === SESSION_STATE.WAITING_INPUT && (
                    <p
                      className="mt-3 font-ui text-xs tracking-widest uppercase slide-up"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Tipea lo que escuchaste · Enter para confirmar
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Barra de timeout */}
            {sessionState === SESSION_STATE.WAITING_INPUT && (
              <div
                className="w-full max-w-sm h-0.5 rounded-full overflow-hidden"
                style={{ background: 'var(--color-border)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width:      `${(inputTimeout / INPUT_TIMEOUT_SEC) * 100}%`,
                    background: inputTimeout > 2 ? 'var(--color-accent)' : 'var(--color-error)',
                    transition: 'width 1s linear, background 0.3s',
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* PAUSED ──────────────────────────────────────────── */}
        {sessionState === SESSION_STATE.PAUSED && (
          <div className="text-center space-y-5">
            <p
              className="font-ui text-5xl"
              style={{ color: 'var(--color-text-muted)', opacity: 0.3 }}
            >
              ⏸
            </p>
            <p
              className="font-ui text-lg tracking-widest uppercase"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Sesión pausada
            </p>
            <div className="flex gap-3 justify-center">
              <button className="btn-primary" onClick={togglePause}>Resumir</button>
              <button className="btn-secondary" onClick={() => { endSession(); onHome(); }}>Terminar</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom stats ─────────────────────────────────────── */}
      {sessionState !== SESSION_STATE.IDLE &&
       sessionState !== SESSION_STATE.COUNTDOWN && (
        <div
          className="px-4 py-2.5 border-t flex items-center justify-center gap-6"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <span className="font-ui text-xs tracking-widest uppercase" style={{ color: 'var(--color-text-muted)' }}>
            {sessionResults.length} grupos
          </span>
          {sessionResults.length > 0 && (
            <span className="font-ui text-xs tracking-widest uppercase" style={{ color: 'var(--color-accent)' }}>
              {(sessionResults.reduce((s, r) => s + r.accuracy, 0) / sessionResults.length).toFixed(0)}% acc
            </span>
          )}
          <span className="font-ui text-xs tracking-widest uppercase" style={{ color: 'var(--color-text-muted)' }}>
            {sessionResults.reduce((s, r) => s + r.totalChars, 0)} chars
          </span>
        </div>
      )}
    </div>
  );
}

// Exportar constante para uso interno
const INPUT_TIMEOUT_SEC = 4;
