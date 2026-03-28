/**
 * SessionSummary.jsx
 * Pantalla de resultados post-sesión.
 * Registra la sesión en el progreso del usuario y muestra los resultados.
 */
import React, { useEffect, useRef } from 'react';
import { charAccuracy }  from '../../engine/AccuracyCalculator.js';
import { useProgress }   from '../../context/ProgressContext.jsx';

/**
 * @param {object}   props
 * @param {object}   props.sessionStats     - Resultado agregado de la sesión
 * @param {object[]} props.sessionResults   - Array de resultados por grupo
 * @param {object}   props.settings         - Settings de la sesión
 * @param {number}   props.durationSeconds  - Duración real de la sesión
 * @param {Function} props.onRestart        - Volver a entrenar
 * @param {Function} props.onHome           - Ir a home
 * @param {Function} props.onProgress       - Ir a pantalla de progreso
 */
export function SessionSummary({
  sessionStats,
  sessionResults,
  settings,
  durationSeconds,
  onRestart,
  onHome,
  onProgress,
}) {
  const { recordSession } = useProgress();

  // Registrar la sesión solo una vez al montar (evitar doble registro con StrictMode)
  const hasRecorded = useRef(false);
  useEffect(() => {
    if (!hasRecorded.current && sessionStats && sessionStats.totalChars > 0) {
      hasRecorded.current = true;
      recordSession({ sessionStats, settings, durationSeconds });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!sessionStats) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p style={{ color: 'var(--color-text-muted)' }} className="font-ui">
          Sin datos de sesión
        </p>
        <button className="btn-secondary" onClick={onHome}>Volver</button>
      </div>
    );
  }

  const { accuracy, correctChars, totalChars, charScores } = sessionStats;

  const accuracyColor = accuracy >= 90
    ? 'var(--color-correct)'
    : accuracy >= 70
      ? 'var(--color-accent)'
      : 'var(--color-error)';

  // Ordenar caracteres: peores primero para que el usuario sepa qué trabajar
  const charEntries = Object.entries(charScores)
    .map(([char, scores]) => ({
      char,
      accuracy: charAccuracy(scores),
      correct:  scores.correct,
      total:    scores.total,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <span
          className="font-ui text-xs tracking-widest uppercase"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Resumen de sesión
        </span>
        <span
          className="font-ui text-xs tracking-widest uppercase"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Koch L{settings.kochLevel} · {settings.speedValue} {settings.speedUnit.toUpperCase()}
          {durationSeconds ? ` · ${Math.floor(durationSeconds / 60)}m${durationSeconds % 60}s` : ''}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-2xl mx-auto w-full">

        {/* ── Accuracy principal ───────────────────────────── */}
        <div className="text-center mb-10">
          <div
            className="morse-text inline-block"
            style={{ fontSize: 'clamp(4rem, 15vw, 8rem)', color: accuracyColor, lineHeight: 1 }}
          >
            {accuracy.toFixed(0)}
          </div>
          <div
            className="font-ui text-lg tracking-widest uppercase mt-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            % de precisión
          </div>
          <div
            className="mt-3 font-ui text-sm tracking-wide"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {accuracy >= 90
              ? '¡Excelente! Podés subir al siguiente nivel Koch.'
              : accuracy >= 70
                ? 'Buen trabajo. Seguí practicando.'
                : 'Seguí adelante — la constancia hace al maestro.'}
          </div>
        </div>

        {/* ── Stats de la sesión ───────────────────────────── */}
        <div
          className="grid grid-cols-3 gap-px mb-8"
          style={{ background: 'var(--color-border)' }}
        >
          {[
            { label: 'Grupos',    value: sessionResults.length },
            { label: 'Correctos', value: correctChars },
            { label: 'Total',     value: totalChars },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center py-5"
              style={{ background: 'var(--color-surface)' }}
            >
              <span
                className="morse-text text-2xl"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {value}
              </span>
              <span
                className="font-ui text-xs tracking-widest uppercase mt-1"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Desglose por carácter ────────────────────────── */}
        {charEntries.length > 0 && (
          <div className="mb-8">
            <h3
              className="font-ui text-xs tracking-widest uppercase mb-4"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Precisión por carácter (peores primero)
            </h3>
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
              {charEntries.map(({ char, accuracy: acc, correct, total }) => {
                const barColor = acc >= 90
                  ? 'var(--color-correct)'
                  : acc >= 70
                    ? 'var(--color-accent)'
                    : 'var(--color-error)';
                return (
                  <div
                    key={char}
                    className="flex items-center gap-2 px-3 py-2 rounded-sm"
                    style={{ background: 'var(--color-surface)' }}
                  >
                    <span
                      className="morse-text text-xl w-8 text-center flex-shrink-0"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {char}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className="h-1 rounded-full mb-1"
                        style={{ background: 'var(--color-border-2)' }}
                      >
                        <div
                          className="h-1 rounded-full"
                          style={{ width: `${acc}%`, background: barColor }}
                        />
                      </div>
                      <span
                        className="font-ui text-xs"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {acc.toFixed(0)}%
                        <span style={{ opacity: 0.5 }}> ({correct}/{total})</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Sugerencia subir nivel ───────────────────────── */}
        {accuracy >= 90 && (
          <div
            className="mb-8 px-4 py-3 rounded-sm border"
            style={{
              background:  'rgba(34,197,94,0.05)',
              borderColor: 'rgba(34,197,94,0.2)',
            }}
          >
            <p className="font-ui text-sm" style={{ color: 'var(--color-correct)' }}>
              ↑ Accuracy ≥ 90%. Podés subir al nivel Koch {settings.kochLevel + 1} en Settings.
            </p>
          </div>
        )}

        {/* ── Acciones ─────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button className="btn-primary" onClick={onRestart}>Nueva sesión</button>
          <button className="btn-secondary" onClick={onProgress}>Ver progreso</button>
          <button className="btn-secondary" onClick={onHome}>Inicio</button>
        </div>
      </div>
    </div>
  );
}
