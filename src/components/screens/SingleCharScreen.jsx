/**
 * SingleCharScreen.jsx
 * ─────────────────────────────────────────────────────────────────
 * Pantalla de entrenamiento para el modo Single Char.
 *
 * Flujo por turno:
 *   1. Suena 1 carácter (WPM configurado)
 *   2. Usuario presiona 1 tecla
 *   3. Feedback inmediato: ✓ / ✗ + nombre fonético ITU del carácter correcto
 *   4. Siguiente carácter automático tras FEEDBACK_DISPLAY_MS
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef } from 'react';
import { useAudioPlayer }        from '../../hooks/useAudioPlayer.js';
import { useSingleCharSession, SC_STATE } from '../../hooks/useSingleCharSession.js';
import { useSettings }           from '../../context/SettingsContext.jsx';
import { useProgress }           from '../../context/ProgressContext.jsx';
import { parseSingleCharSet }    from '../../engine/SingleCharGenerator.js';
import { MORSE_CODE }            from '../../constants/morseCodes.js';

// ── Componente de feedback por carácter ──────────────────────────
function SingleCharFeedback({ feedback }) {
  if (!feedback) return null;
  const { char, typed, isCorrect, phonetic } = feedback;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      animation: 'fadeIn 0.15s ease',
    }}>
      {/* Resultado correcto/incorrecto */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'clamp(4rem, 12vw, 6rem)',
        fontWeight: 700,
        color: isCorrect ? 'var(--green)' : 'var(--red)',
        lineHeight: 1,
      }}>
        {char}
      </div>

      {/* Nombre fonético */}
      <div style={{
        fontFamily: 'var(--font-ui)',
        fontSize: '22px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        color: isCorrect ? 'var(--green)' : 'var(--red)',
        textTransform: 'uppercase',
      }}>
        {phonetic}
      </div>

      {/* Código Morse del carácter */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '20px',
        letterSpacing: '0.2em',
        color: 'var(--text-3)',
      }}>
        {MORSE_CODE[char] ?? ''}
      </div>

      {/* Si erró: mostrar qué escribió */}
      {!isCorrect && typed && (
        <div style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '13px',
          color: 'var(--text-3)',
        }}>
          Escribiste: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--red)', fontWeight: 700 }}>{typed}</span>
        </div>
      )}

      {/* Indicador ✓ / ✗ */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '28px',
        color: isCorrect ? 'var(--green)' : 'var(--red)',
      }}>
        {isCorrect ? '✓' : '✗'}
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────
export function SingleCharScreen({ onHome, onProgress }) {
  const { settings }  = useSettings();
  const { recordSession } = useProgress();
  const { playGroup, stop: stopAudio, initAudio } = useAudioPlayer();

  // Parsear el set de caracteres
  const charSet = parseSingleCharSet(settings.singleCharSet || '');

  const {
    sessionState, currentChar, inputChar,
    lastFeedback, timeRemaining, countdownSec,
    sessionResults, sessionStats,
    startSession, togglePause, endSession, resetSession,
    handleKeyPress,
  } = useSingleCharSession({ settings, charSet, playGroup, stopAudio });

  // Referencia de tiempo de inicio para duración real
  const sessionStartTime = useRef(null);
  const [durationSeconds, setDurationSeconds] = React.useState(0);
  const hasRecorded = useRef(false);

  useEffect(() => {
    if (sessionState === SC_STATE.PLAYING_AUDIO && !sessionStartTime.current) {
      sessionStartTime.current = Date.now();
    }
    if (sessionState === SC_STATE.FINISHED && sessionStartTime.current) {
      setDurationSeconds(Math.round((Date.now() - sessionStartTime.current) / 1000));
    }
  }, [sessionState]);

  // Grabar progreso cuando termina la sesión
  useEffect(() => {
    if (sessionState === SC_STATE.FINISHED && sessionStats && !hasRecorded.current) {
      hasRecorded.current = true;
      recordSession({ sessionStats, settings, durationSeconds });
    }
  }, [sessionState, sessionStats, durationSeconds, settings, recordSession]);

  // Keyboard listener
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { togglePause(); return; }
      if (e.key.length === 1) { handleKeyPress(e.key); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleKeyPress, togglePause]);

  const handleStart = () => {
    hasRecorded.current = false;
    sessionStartTime.current = null;
    initAudio();
    startSession();
  };

  const mins = Math.floor(timeRemaining / 60);
  const secs = String(timeRemaining % 60).padStart(2, '0');
  const timeColor = timeRemaining <= 30 && sessionState !== SC_STATE.IDLE
    ? 'var(--red)' : 'var(--text-1)';

  const isActive = sessionState !== SC_STATE.IDLE && sessionState !== SC_STATE.COUNTDOWN;
  const totalAttempts = sessionResults.length;
  const correctCount  = sessionResults.filter(r => r.isCorrect).length;
  const liveAcc       = totalAttempts > 0
    ? ((correctCount / totalAttempts) * 100).toFixed(0) : '—';

  // ── FINISHED ─────────────────────────────────────────────
  if (sessionState === SC_STATE.FINISHED) {
    const accuracy = sessionStats?.accuracy ?? 0;
    const accColor = accuracy >= 90 ? 'var(--green)' : accuracy >= 70 ? 'var(--amber)' : 'var(--red)';

    // Stats por carácter
    const charEntries = Object.entries(sessionStats?.charScores ?? {})
      .map(([char, s]) => ({
        char,
        acc: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
        correct: s.correct,
        total: s.total,
      }))
      .sort((a, b) => a.acc - b.acc);

    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
            Single Char — Resumen
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-3)' }}>
            {settings.speedValue} {settings.speedUnit.toUpperCase()}
            {durationSeconds ? ` · ${Math.floor(durationSeconds / 60)}m${durationSeconds % 60}s` : ''}
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', maxWidth: '600px', width: '100%', margin: '0 auto', padding: '32px 24px 48px' }}>
          {/* Accuracy grande */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(5rem,15vw,8rem)', fontWeight: 700, color: accColor, lineHeight: 1 }}>
              {accuracy.toFixed(0)}
            </div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '14px', fontWeight: 600, letterSpacing: '0.12em', color: 'var(--text-3)', textTransform: 'uppercase', marginTop: '4px' }}>
              % de precisión
            </div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '14px', color: 'var(--text-3)', marginTop: '12px' }}>
              {accuracy >= 90 ? '¡Excelente! Ya dominas estos caracteres.'
                : accuracy >= 70 ? 'Buen trabajo. Seguí practicando.'
                : 'Seguí adelante — la constancia hace al maestro.'}
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '32px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
            {[
              { l: 'Intentos',  v: totalAttempts },
              { l: 'Correctos', v: correctCount  },
              { l: 'Set',       v: charSet.join(' ') || '—' },
            ].map(({ l, v }, i) => (
              <div key={l} style={{ padding: '20px 16px', textAlign: 'center', borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: i === 2 ? '14px' : '24px', fontWeight: 700, color: 'var(--text-1)', lineHeight: 1, letterSpacing: i === 2 ? '0.2em' : 0 }}>{v}</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--text-3)', marginTop: '6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Por carácter */}
          {charEntries.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '10px' }}>
                Por carácter
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {charEntries.map(({ char, acc, correct, total }) => {
                  const c = acc >= 90 ? 'var(--green)' : acc >= 70 ? 'var(--amber)' : 'var(--red)';
                  return (
                    <div key={char} style={{ padding: '10px 14px', background: 'var(--surface)', border: `1px solid ${c}`, borderRadius: '2px', textAlign: 'center', minWidth: '64px' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: c, lineHeight: 1 }}>{char}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '8px', color: 'var(--text-3)', marginTop: '2px' }}>{MORSE_CODE[char] ?? ''}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: c, marginTop: '4px' }}>{acc}%</div>
                      <div style={{ fontFamily: 'var(--font-ui)', fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>{correct}/{total}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, padding: '14px' }}
              onClick={() => { resetSession(); handleStart(); }}
            >
              Repetir
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => { resetSession(); onProgress(); }}
            >
              Progreso
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => { resetSession(); onHome(); }}
            >
              Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PANTALLA DE ENTRENAMIENTO ─────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Topbar */}
      <div style={{
        height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '90px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: timeColor, fontVariantNumeric: 'tabular-nums' }}>
            {mins}:{secs}
          </span>
          {sessionState === SC_STATE.PAUSED && (
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-ui)', fontWeight: 700, letterSpacing: '0.15em', color: 'var(--amber)', background: 'var(--amber-dim)', padding: '3px 8px', borderRadius: '2px' }}>
              PAUSA
            </span>
          )}
        </div>

        <span style={{ fontFamily: 'var(--font-ui)', fontSize: '12px', color: 'var(--text-3)', letterSpacing: '0.08em' }}>
          Single Char · {settings.speedValue} {settings.speedUnit.toUpperCase()}
        </span>

        <div style={{ display: 'flex', gap: '4px', minWidth: '90px', justifyContent: 'flex-end' }}>
          {sessionState !== SC_STATE.IDLE ? (
            <>
              <button className="btn btn-ghost" onClick={togglePause}>
                {sessionState === SC_STATE.PAUSED ? 'Resumir' : 'Pausa'}
              </button>
              <button className="btn btn-ghost" onClick={() => { endSession(); onHome(); }}>✕</button>
            </>
          ) : (
            <button className="btn btn-ghost" onClick={onHome}>← Volver</button>
          )}
        </div>
      </div>

      {/* Área principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: '32px' }}>

        {/* IDLE */}
        {sessionState === SC_STATE.IDLE && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', width: '100%', maxWidth: '440px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Modo Single Char
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: '20px', fontWeight: 700, color: 'var(--text-1)' }}>
                {charSet.length > 0
                  ? `${charSet.length} carácter${charSet.length !== 1 ? 'es' : ''} en el set`
                  : 'Sin set configurado'}
              </div>
            </div>

            {charSet.length > 0 ? (
              <div style={{ width: '100%', padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Set activo
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 600, color: 'var(--amber-text)', letterSpacing: '0.3em', lineHeight: 1.8 }}>
                  {charSet.join(' ')}
                </div>
              </div>
            ) : (
              <div style={{ width: '100%', padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--red)', borderRadius: '2px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: '13px', color: 'var(--red)' }}>
                  Configurá el set de caracteres en Configuración → Ejercicio → Set de caracteres
                </div>
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: '16px' }}
              onClick={handleStart}
              disabled={charSet.length === 0}
            >
              EMPEZAR
            </button>

            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '12px', color: 'var(--text-3)', textAlign: 'center' }}>
              Presioná la letra que escuchaste · Esc pausa
            </div>
          </div>
        )}

        {/* COUNTDOWN */}
        {sessionState === SC_STATE.COUNTDOWN && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'clamp(6rem,18vw,10rem)', fontWeight: 700, color: 'var(--amber-text)', lineHeight: 1 }}>
              {countdownSec}
            </div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '13px', color: 'var(--text-3)', marginTop: '16px', letterSpacing: '0.1em' }}>
              Preparate para escuchar...
            </div>
          </div>
        )}

        {/* PLAYING / WAITING / FEEDBACK */}
        {(sessionState === SC_STATE.PLAYING_AUDIO ||
          sessionState === SC_STATE.WAITING_INPUT ||
          sessionState === SC_STATE.FEEDBACK) && (
          <>
            {/* Indicador de transmisión */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                className={sessionState === SC_STATE.PLAYING_AUDIO ? 'transmit-dot' : ''}
                style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: sessionState === SC_STATE.PLAYING_AUDIO
                    ? 'var(--amber)'
                    : sessionState === SC_STATE.WAITING_INPUT
                      ? 'var(--text-3)'
                      : 'var(--border-2)',
                  transition: 'background 0.3s',
                }}
              />
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: '12px', letterSpacing: '0.1em', color: 'var(--text-3)', textTransform: 'uppercase' }}>
                {sessionState === SC_STATE.PLAYING_AUDIO
                  ? 'Transmitiendo'
                  : sessionState === SC_STATE.WAITING_INPUT
                    ? 'Esperando tu respuesta'
                    : 'Resultado'}
              </span>
            </div>

            {/* Zona central */}
            <div style={{ width: '100%', maxWidth: '400px', minHeight: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {sessionState === SC_STATE.FEEDBACK ? (
                <SingleCharFeedback feedback={lastFeedback} />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  {sessionState === SC_STATE.WAITING_INPUT && (
                    <div style={{ fontFamily: 'var(--font-ui)', fontSize: '13px', color: 'var(--text-3)', letterSpacing: '0.06em' }}>
                      Presioná la letra que escuchaste
                    </div>
                  )}
                  {sessionState === SC_STATE.PLAYING_AUDIO && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '48px', color: 'var(--text-3)', opacity: 0.2 }}>
                      ?
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* PAUSED */}
        {sessionState === SC_STATE.PAUSED && (
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
            { v: totalAttempts,       l: 'intentos' },
            { v: `${liveAcc}%`,       l: 'acc', c: 'var(--amber)' },
            { v: charSet.join(' '),   l: 'set', mono: true },
          ].map(({ v, l, c, mono }) => (
            <span key={l} style={{ fontFamily: mono ? 'var(--font-mono)' : 'var(--font-mono)', fontSize: '13px', color: c ?? 'var(--text-3)', letterSpacing: mono ? '0.2em' : 0 }}>
              {v} <span style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--text-3)', letterSpacing: 0 }}>{l}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
