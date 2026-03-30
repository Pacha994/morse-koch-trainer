/**
 * TrainingScreen.jsx — Pantalla de entrenamiento rediseñada.
 */
import React, { useEffect, useRef } from 'react';
import { useAudioPlayer }     from '../../hooks/useAudioPlayer.js';
import { useTrainingSession, SESSION_STATE } from '../../hooks/useTrainingSession.js';
import { useKeyboardInput }   from '../../hooks/useKeyboardInput.js';
import { useSettings }        from '../../context/SettingsContext.jsx';
import { GroupFeedback }      from '../training/GroupFeedback.jsx';
import { SessionSummary }     from './SessionSummary.jsx';
import { G4FON_ORDER, LCWO_ORDER } from '../../constants/kochSequences.js';

const INPUT_TIMEOUT_SEC = 4;

export function TrainingScreen({ onHome, onProgress }) {
  const { settings } = useSettings();
  const { playGroup, stop: stopAudio, initAudio } = useAudioPlayer();

  const {
    sessionState, currentGroup, inputText, setInputText,
    lastFeedback, timeRemaining, inputTimeout, countdownSec,
    sessionResults, sessionStats,
    startSession, togglePause, endSession, resetSession, confirmInput,
  } = useTrainingSession({ settings, playGroup, stopAudio });

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

  const inputEnabled = sessionState === SESSION_STATE.PLAYING_AUDIO || sessionState === SESSION_STATE.WAITING_INPUT;
  const { inputText: kbText, clearInput } = useKeyboardInput({
    enabled: inputEnabled, onConfirm: confirmInput, onPause: togglePause, onRepeat: () => {},
  });
  useEffect(() => { if (inputEnabled) setInputText(kbText); }, [kbText, inputEnabled, setInputText]);
  useEffect(() => { clearInput(); }, [currentGroup]);

  const handleStart = () => { initAudio(); sessionStartTime.current = null; startSession(); };

  if (sessionState === SESSION_STATE.FINISHED && sessionStats) {
    return (
      <SessionSummary
        sessionStats={sessionStats} sessionResults={sessionResults}
        settings={settings} durationSeconds={durationSeconds}
        onRestart={() => { resetSession(); handleStart(); }}
        onHome={() => { resetSession(); onHome(); }}
        onProgress={() => { resetSession(); onProgress(); }}
      />
    );
  }

  const mins = Math.floor(timeRemaining / 60);
  const secs = String(timeRemaining % 60).padStart(2, '0');

  const fontSize = { small: 'mono-sm', medium: 'mono-md', large: 'mono-lg', xlarge: 'mono-xl' }[settings.fontSize] ?? 'mono-md';
  const sequence = settings.exerciseType === 'koch_lcwo' ? LCWO_ORDER : G4FON_ORDER;
  const activeStr = sequence.slice(0, settings.kochLevel).join(' ');
  const isActive = sessionState !== SESSION_STATE.IDLE && sessionState !== SESSION_STATE.COUNTDOWN;

  // Tiempo en rojo cuando queda poco
  const timeColor = timeRemaining <= 30 && isActive ? 'var(--red)' : 'var(--text-1)';

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Topbar */}
      <div style={{
        height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)',
        flexShrink: 0,
      }}>
        {/* Tiempo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '90px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: timeColor, fontVariantNumeric: 'tabular-nums' }}>
            {mins}:{secs}
          </span>
          {sessionState === SESSION_STATE.PAUSED && (
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '0.15em', color: 'var(--amber)', background: 'var(--amber-dim)', padding: '3px 8px', borderRadius: '2px' }}>
              PAUSA
            </span>
          )}
        </div>

        {/* Info central */}
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: '12px', color: 'var(--text-3)', letterSpacing: '0.08em' }}>
          L{settings.kochLevel} · {settings.speedValue} {settings.speedUnit.toUpperCase()}
          {settings.charSpacing !== 1.0 && ` · ${settings.charSpacing}×`}
        </span>

        {/* Controles */}
        <div style={{ display: 'flex', gap: '4px', minWidth: '90px', justifyContent: 'flex-end' }}>
          {sessionState !== SESSION_STATE.IDLE ? (
            <>
              <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={togglePause}>
                {sessionState === SESSION_STATE.PAUSED ? 'Resumir' : 'Pausa'}
              </button>
              <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={() => { endSession(); onHome(); }}>✕</button>
            </>
          ) : (
            <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={onHome}>← Volver</button>
          )}
        </div>
      </div>

      {/* Área principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: '32px' }}>

        {/* IDLE */}
        {sessionState === SESSION_STATE.IDLE && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%', maxWidth: '440px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Sesión Koch
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: '22px', fontWeight: 700, color: 'var(--text-1)' }}>
                Nivel {settings.kochLevel}
              </div>
            </div>

            {/* Chars */}
            <div style={{ width: '100%', padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '10px' }}>
                Caracteres activos
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 600, color: 'var(--amber)', letterSpacing: '0.25em', lineHeight: 1.8 }}>
                {activeStr}
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '16px' }} onClick={handleStart}>
              EMPEZAR
            </button>

            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '12px', color: 'var(--text-3)', textAlign: 'center' }}>
              Letras y números directamente · Enter confirma · Esc pausa
            </div>
          </div>
        )}

        {/* COUNTDOWN */}
        {sessionState === SESSION_STATE.COUNTDOWN && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(6rem,18vw,10rem)', fontWeight: 700, color: 'var(--amber)', lineHeight: 1 }}>
              {countdownSec}
            </div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '13px', color: 'var(--text-3)', marginTop: '16px', letterSpacing: '0.1em' }}>
              Preparate para escuchar...
            </div>
          </div>
        )}

        {/* PLAYING / WAITING / FEEDBACK */}
        {(sessionState === SESSION_STATE.PLAYING_AUDIO ||
          sessionState === SESSION_STATE.WAITING_INPUT ||
          sessionState === SESSION_STATE.FEEDBACK) && (
          <>
            {/* Indicador de transmisión */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                className={sessionState === SESSION_STATE.PLAYING_AUDIO ? 'transmit-dot' : ''}
                style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: sessionState === SESSION_STATE.PLAYING_AUDIO
                    ? 'var(--amber)'
                    : sessionState === SESSION_STATE.WAITING_INPUT
                      ? 'var(--text-3)'
                      : 'var(--border-2)',
                  transition: 'background 0.3s',
                }}
              />
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: '12px', letterSpacing: '0.1em', color: 'var(--text-3)', textTransform: 'uppercase' }}>
                {sessionState === SESSION_STATE.PLAYING_AUDIO
                  ? 'Transmitiendo'
                  : sessionState === SESSION_STATE.WAITING_INPUT
                    ? `Esperando · ${inputTimeout}s`
                    : 'Resultado'}
              </span>
            </div>

            {/* Zona central */}
            <div style={{ width: '100%', maxWidth: '500px', minHeight: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {sessionState === SESSION_STATE.FEEDBACK ? (
                <GroupFeedback feedback={lastFeedback} fontSize={settings.fontSize} />
              ) : (
                <div>
                  {/* Texto del usuario */}
                  <div className={fontSize} style={{ color: 'var(--amber)', letterSpacing: '0.3em', textAlign: 'center', minHeight: '2em' }}>
                    {inputText || <span style={{ color: 'var(--text-3)', opacity: 0.3 }} className="cursor-blink">_</span>}
                  </div>
                  {sessionState === SESSION_STATE.WAITING_INPUT && (
                    <div className="slide-up" style={{ fontFamily: 'var(--font-ui)', fontSize: '12px', color: 'var(--text-3)', textAlign: 'center', marginTop: '12px' }}>
                      Tipea lo que escuchaste · Enter para confirmar
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Barra de timeout */}
            {sessionState === SESSION_STATE.WAITING_INPUT && (
              <div style={{ width: '100%', maxWidth: '320px', height: '2px', background: 'var(--border)', borderRadius: '1px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(inputTimeout / INPUT_TIMEOUT_SEC) * 100}%`,
                  background: inputTimeout > 2 ? 'var(--amber)' : 'var(--red)',
                  transition: 'width 1s linear, background 0.3s',
                }} />
              </div>
            )}
          </>
        )}

        {/* PAUSED */}
        {sessionState === SESSION_STATE.PAUSED && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: '0.2em', color: 'var(--text-3)', textTransform: 'uppercase' }}>
              — PAUSA —
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" style={{ padding: '12px 32px' }} onClick={togglePause}>Resumir</button>
              <button className="btn btn-secondary" onClick={() => { endSession(); onHome(); }}>Terminar</button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom stats */}
      {isActive && (
        <div style={{
          height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '28px',
          borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0,
        }}>
          {[
            { v: sessionResults.length, l: 'grupos' },
            { v: sessionResults.length > 0 ? `${(sessionResults.reduce((s, r) => s + r.accuracy, 0) / sessionResults.length).toFixed(0)}%` : '—', l: 'acc', c: 'var(--amber)' },
            { v: sessionResults.reduce((s, r) => s + r.totalChars, 0), l: 'chars' },
          ].map(({ v, l, c }) => (
            <span key={l} style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: c ?? 'var(--text-3)' }}>
              {v} <span style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--text-3)' }}>{l}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
