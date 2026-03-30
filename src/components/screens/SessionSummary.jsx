/**
 * SessionSummary.jsx — Resultados post-sesión rediseñado.
 */
import React, { useEffect, useRef } from 'react';
import { charAccuracy }  from '../../engine/AccuracyCalculator.js';
import { useProgress }   from '../../context/ProgressContext.jsx';

export function SessionSummary({ sessionStats, sessionResults, settings, durationSeconds, onRestart, onHome, onProgress }) {
  const { recordSession } = useProgress();
  const hasRecorded = useRef(false);

  useEffect(() => {
    if (!hasRecorded.current && sessionStats?.totalChars > 0) {
      hasRecorded.current = true;
      recordSession({ sessionStats, settings, durationSeconds });
    }
  }, []);

  if (!sessionStats) return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <span style={{ color: 'var(--text-3)', fontFamily: 'var(--font-ui)' }}>Sin datos de sesión</span>
      <button className="btn btn-secondary" onClick={onHome}>Volver</button>
    </div>
  );

  const { accuracy, correctChars, totalChars, charScores } = sessionStats;
  const accColor = accuracy >= 90 ? 'var(--green)' : accuracy >= 70 ? 'var(--amber)' : 'var(--red)';

  const charEntries = Object.entries(charScores)
    .map(([char, s]) => ({ char, acc: charAccuracy(s), correct: s.correct, total: s.total }))
    .sort((a, b) => a.acc - b.acc);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          Resumen de sesión
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-3)' }}>
          L{settings.kochLevel} · {settings.speedValue} {settings.speedUnit.toUpperCase()}
          {durationSeconds ? ` · ${Math.floor(durationSeconds / 60)}m${durationSeconds % 60}s` : ''}
        </span>
      </div>

      {/* Contenido */}
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
            {accuracy >= 90 ? '¡Excelente! Podés subir al siguiente nivel Koch.'
              : accuracy >= 70 ? 'Buen trabajo. Seguí practicando.'
              : 'Seguí adelante — la constancia hace al maestro.'}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '32px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
          {[
            { l: 'Grupos',    v: sessionResults.length },
            { l: 'Correctos', v: correctChars },
            { l: 'Total',     v: totalChars },
          ].map(({ l, v }, i) => (
            <div key={l} style={{ padding: '20px 16px', textAlign: 'center', borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700, color: 'var(--text-1)', lineHeight: 1 }}>{v}</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--text-3)', marginTop: '6px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Chars */}
        {charEntries.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '12px' }}>
              Precisión por carácter — peores primero
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
              {charEntries.map(({ char, acc, correct, total }) => {
                const c = acc >= 90 ? 'var(--green)' : acc >= 70 ? 'var(--amber)' : 'var(--red)';
                return (
                  <div key={char} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--text-1)', width: '24px', flexShrink: 0 }}>{char}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: '2px', background: 'var(--border-2)', borderRadius: '1px', marginBottom: '4px' }}>
                        <div style={{ height: '2px', width: `${acc}%`, background: c, transition: 'width 0.4s ease' }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: c }}>{acc.toFixed(0)}%</span>
                      <span style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--text-3)', marginLeft: '6px' }}>({correct}/{total})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sugerencia */}
        {accuracy >= 90 && (
          <div style={{ marginBottom: '24px', padding: '12px 16px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '2px' }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: '14px', color: 'var(--green)' }}>
              ↑ Podés subir al nivel Koch {settings.kochLevel + 1} en Settings.
            </span>
          </div>
        )}

        {/* Acciones */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ flex: 1, padding: '14px' }} onClick={onRestart}>Nueva sesión</button>
          <button className="btn btn-secondary" onClick={onProgress}>Ver progreso</button>
          <button className="btn btn-secondary" onClick={onHome}>Inicio</button>
        </div>
      </div>
    </div>
  );
}
