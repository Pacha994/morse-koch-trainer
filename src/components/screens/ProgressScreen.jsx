/**
 * ProgressScreen.jsx
 * Pantalla de estadísticas y progreso del usuario.
 *
 * Muestra:
 *   1. Stats globales (tiempo total, sesiones, accuracy promedio)
 *   2. Gráfico de accuracy de las últimas 20 sesiones
 *   3. Heatmap de precisión por carácter
 *   4. Opción de resetear el progreso
 */
import React, { useState } from 'react';
import { useProgress } from '../../context/ProgressContext.jsx';
import { charAccuracy } from '../../engine/AccuracyCalculator.js';

// ── Mini gráfico de barras para el historial ───────────────────────
function AccuracyChart({ sessions }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-24 rounded-sm"
        style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
      >
        <span className="font-ui text-xs tracking-widest uppercase">Sin datos aún</span>
      </div>
    );
  }

  const maxSessions = 20;
  const displayed   = sessions.slice(-maxSessions);
  const barWidth    = Math.floor(100 / maxSessions);

  return (
    <div className="space-y-2">
      {/* Barras */}
      <div
        className="flex items-end gap-0.5 h-24 px-1"
        style={{ background: 'var(--color-surface-2)', borderRadius: '2px', padding: '8px 4px 4px' }}
      >
        {/* Espaciadores si hay menos de 20 sesiones */}
        {Array(maxSessions - displayed.length).fill(null).map((_, i) => (
          <div key={`empty-${i}`} className="flex-1" />
        ))}
        {displayed.map((session, i) => {
          const acc      = session.accuracy;
          const barColor = acc >= 90
            ? 'var(--color-correct)'
            : acc >= 70
              ? 'var(--color-accent)'
              : 'var(--color-error)';
          const heightPct = Math.max(2, acc); // mínimo 2% para que sea visible

          return (
            <div
              key={session.id}
              className="flex-1 flex items-end"
              title={`Sesión ${i + 1}: ${acc.toFixed(0)}% · Koch L${session.kochLevel} · ${session.speedValue}${session.speedUnit}`}
            >
              <div
                className="w-full rounded-t-sm"
                style={{
                  height:     `${heightPct}%`,
                  background: barColor,
                  opacity:    0.8,
                  minHeight:  '2px',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Eje Y: etiquetas */}
      <div className="flex justify-between px-1">
        <span className="font-ui text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {displayed.length > 0 ? `L${displayed[0].kochLevel}` : ''}
        </span>
        <span className="font-ui text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Últimas {displayed.length} sesiones
        </span>
        <span className="font-ui text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {displayed.length > 0 ? `L${displayed[displayed.length - 1].kochLevel}` : ''}
        </span>
      </div>
    </div>
  );
}

// ── Heatmap de precisión por carácter ─────────────────────────────
function CharacterHeatmap({ characterStats }) {
  const entries = Object.entries(characterStats);

  if (entries.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-20 rounded-sm"
        style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
      >
        <span className="font-ui text-xs tracking-widest uppercase">Sin datos aún</span>
      </div>
    );
  }

  // Ordenar alfabéticamente para consistencia visual
  const sorted = entries
    .map(([char, stats]) => ({
      char,
      acc:   charAccuracy(stats) ?? 0,
      total: stats.total,
    }))
    .sort((a, b) => a.char.localeCompare(b.char));

  return (
    <div className="flex flex-wrap gap-1">
      {sorted.map(({ char, acc, total }) => {
        // Color del heatmap: rojo (0%) → ámbar (70%) → verde (100%)
        let bg, textColor;
        if (acc >= 90) {
          bg        = `rgba(34,197,94,${0.1 + (acc - 90) / 100})`;
          textColor = 'var(--color-correct)';
        } else if (acc >= 70) {
          bg        = `rgba(245,158,11,${0.1 + (acc - 70) / 100})`;
          textColor = 'var(--color-accent)';
        } else {
          bg        = `rgba(239,68,68,${0.1 + (100 - acc) / 200})`;
          textColor = 'var(--color-error)';
        }

        return (
          <div
            key={char}
            className="flex flex-col items-center px-2.5 py-1.5 rounded-sm border"
            style={{
              background:  bg,
              borderColor: 'rgba(255,255,255,0.05)',
              minWidth:    '3rem',
            }}
            title={`${char}: ${acc.toFixed(0)}% (${total} veces)`}
          >
            <span className="morse-text text-base" style={{ color: textColor }}>
              {char}
            </span>
            <span className="font-ui text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {acc.toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * @param {object}   props
 * @param {Function} props.onClose - Volver al home
 */
export function ProgressScreen({ onClose }) {
  const {
    progress,
    getRecentSessions,
    getRecentAccuracy,
    formattedTotalTime,
    resetProgress,
  } = useProgress();

  const recentSessions  = getRecentSessions(20);
  const recentAccuracy  = getRecentAccuracy(5);
  const allSessions     = [...progress.sessionHistory]; // todas, para el gráfico

  // Calcular el mejor nivel Koch alcanzado
  const maxKochLevel = allSessions.length > 0
    ? Math.max(...allSessions.map(s => s.kochLevel))
    : 0;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
        style={{
          borderColor: 'var(--color-border)',
          background:  'var(--color-surface)',
        }}
      >
        <h1
          className="font-ui text-xl font-bold tracking-widest uppercase"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Progreso
        </h1>
        <button className="btn-secondary" onClick={onClose}>← Volver</button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 max-w-2xl mx-auto w-full space-y-8">

        {/* ── 1. Stats globales ────────────────────────────── */}
        <div
          className="grid grid-cols-2 gap-px"
          style={{ background: 'var(--color-border)' }}
        >
          {[
            { label: 'Sesiones',           value: progress.totalSessions },
            { label: 'Tiempo total',        value: formattedTotalTime || '0m' },
            { label: 'Mejor nivel Koch',    value: maxKochLevel > 0 ? `L${maxKochLevel}` : '—' },
            { label: 'Accuracy reciente',   value: recentAccuracy != null ? `${recentAccuracy.toFixed(0)}%` : '—' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center py-5"
              style={{ background: 'var(--color-surface)' }}
            >
              <span
                className="font-mono text-2xl font-bold"
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

        {/* ── 2. Gráfico de accuracy ───────────────────────── */}
        <div>
          <h2
            className="font-ui text-xs tracking-widest uppercase mb-3"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Accuracy por sesión
          </h2>
          <AccuracyChart sessions={allSessions} />
        </div>

        {/* ── 3. Heatmap de caracteres ─────────────────────── */}
        <div>
          <h2
            className="font-ui text-xs tracking-widest uppercase mb-3"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Precisión por carácter (acumulada)
          </h2>
          <CharacterHeatmap characterStats={progress.characterStats} />
        </div>

        {/* ── 4. Últimas sesiones ──────────────────────────── */}
        {recentSessions.length > 0 && (
          <div>
            <h2
              className="font-ui text-xs tracking-widest uppercase mb-3"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Últimas sesiones
            </h2>
            <div className="space-y-1">
              {recentSessions.map((session) => {
                const date = new Date(session.date);
                const dateStr = date.toLocaleDateString('es-AR', {
                  day: '2-digit', month: '2-digit',
                });
                const timeStr = date.toLocaleTimeString('es-AR', {
                  hour: '2-digit', minute: '2-digit',
                });
                const accColor = session.accuracy >= 90
                  ? 'var(--color-correct)'
                  : session.accuracy >= 70
                    ? 'var(--color-accent)'
                    : 'var(--color-error)';

                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between px-4 py-3 rounded-sm"
                    style={{ background: 'var(--color-surface)' }}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className="font-mono text-lg font-bold w-12"
                        style={{ color: accColor }}
                      >
                        {session.accuracy.toFixed(0)}%
                      </span>
                      <div>
                        <span
                          className="font-ui text-xs tracking-widest uppercase"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          Koch L{session.kochLevel}
                        </span>
                        <span
                          className="font-ui text-xs ml-3"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {session.speedValue} {session.speedUnit.toUpperCase()}
                          {session.durationSeconds
                            ? ` · ${Math.floor(session.durationSeconds / 60)}m`
                            : ''}
                        </span>
                      </div>
                    </div>
                    <span
                      className="font-ui text-xs"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {dateStr} {timeStr}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 5. Resetear progreso ─────────────────────────── */}
        <div
          className="px-4 py-4 border rounded-sm"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <p
            className="font-ui text-xs tracking-wide mb-3"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Resetear borra todo el historial de sesiones y las estadísticas por carácter. Esta acción no se puede deshacer.
          </p>
          <button
            className="btn-ghost text-xs"
            style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)', border: '1px solid' }}
            onClick={() => {
              if (window.confirm('¿Borrar todo el historial de progreso? Esta acción es irreversible.')) {
                resetProgress();
              }
            }}
          >
            Resetear progreso
          </button>
        </div>
      </div>
    </div>
  );
}
