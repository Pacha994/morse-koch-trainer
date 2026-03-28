/**
 * HomeScreen.jsx
 * Pantalla de inicio. Muestra el estado actual y el acceso rápido a todo.
 */
import React from 'react';
import { useSettings }  from '../../context/SettingsContext.jsx';
import { useProgress }  from '../../context/ProgressContext.jsx';
import { G4FON_ORDER, LCWO_ORDER } from '../../constants/kochSequences.js';

export function HomeScreen({ onStartTraining, onOpenSettings, onOpenProgress }) {
  const { settings }              = useSettings();
  const { progress, getRecentAccuracy, formattedTotalTime } = useProgress();

  const sequence    = settings.exerciseType === 'koch_lcwo' ? LCWO_ORDER : G4FON_ORDER;
  const activeChars = sequence.slice(0, settings.kochLevel);
  const seqName     = settings.exerciseType === 'koch_lcwo' ? 'LCWO' : 'G4FON';
  const recentAcc   = getRecentAccuracy(5);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-5 py-3.5 border-b"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="font-mono text-xs tracking-widest px-2 py-1 border"
            style={{ color: 'var(--color-accent)', borderColor: 'var(--color-accent)', opacity: 0.9 }}
          >
            CW
          </div>
          <div>
            <h1
              className="font-ui text-lg font-bold tracking-widest uppercase leading-none"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Koch Trainer
            </h1>
            <p className="font-ui text-xs tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
              Radio Club Córdoba
            </p>
          </div>
        </div>

        <div className="flex gap-1">
          <button className="btn-ghost text-xs" onClick={onOpenProgress}>
            📈 Progreso
          </button>
          <button className="btn-ghost text-xs" onClick={onOpenSettings}>
            ⚙ Settings
          </button>
        </div>
      </header>

      {/* ── Cuerpo ───────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10 gap-8">

        {/* ── Card: estado actual ──────────────────────────── */}
        <div
          className="w-full max-w-md border"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          {/* Nivel y velocidad */}
          <div
            className="flex items-center justify-between px-6 py-5 border-b"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div>
              <p className="font-ui text-xs tracking-widest uppercase" style={{ color: 'var(--color-text-muted)' }}>
                Nivel Koch · {seqName}
              </p>
              <p className="font-ui text-5xl font-bold mt-0.5 leading-none" style={{ color: 'var(--color-text-primary)' }}>
                {settings.kochLevel}
              </p>
            </div>
            <div className="text-right">
              <p className="font-ui text-xs tracking-widest uppercase" style={{ color: 'var(--color-text-muted)' }}>
                Velocidad
              </p>
              <p className="font-mono text-3xl font-bold mt-0.5 leading-none" style={{ color: 'var(--color-accent)' }}>
                {settings.speedValue}
                <span className="text-base ml-1 font-normal" style={{ color: 'var(--color-text-muted)' }}>
                  {settings.speedUnit.toUpperCase()}
                </span>
              </p>
            </div>
          </div>

          {/* Caracteres activos */}
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <p className="font-ui text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--color-text-muted)' }}>
              Caracteres activos ({activeChars.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {activeChars.map((char, i) => {
                const isAutoHard = settings.autoHardLetters && i >= activeChars.length - 2;
                return (
                  <div
                    key={char}
                    className="flex items-center justify-center rounded-sm px-2 py-1"
                    style={{
                      background:  isAutoHard ? 'var(--color-accent-dim)' : 'var(--color-surface-2)',
                      border:      `1px solid ${isAutoHard ? 'rgba(245,158,11,0.35)' : 'var(--color-border)'}`,
                      minWidth:    '2rem',
                    }}
                    title={isAutoHard ? 'Auto hard letter' : ''}
                  >
                    <span
                      className="morse-text text-sm"
                      style={{ color: isAutoHard ? 'var(--color-accent)' : 'var(--color-text-primary)' }}
                    >
                      {char}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats rápidas */}
          <div className="px-6 py-3.5 grid grid-cols-3 gap-2">
            {[
              { label: 'Duración', value: `${Math.floor(settings.exerciseDuration / 60)}m` },
              { label: 'Grupos',   value: settings.wordLengthMode === 'variable' ? `≤${settings.wordLength}` : `${settings.wordLength}` },
              {
                label: 'Acc reciente',
                value: recentAcc != null ? `${recentAcc.toFixed(0)}%` : '—',
                color: recentAcc != null
                  ? (recentAcc >= 90 ? 'var(--color-correct)' : recentAcc >= 70 ? 'var(--color-accent)' : 'var(--color-error)')
                  : 'var(--color-text-muted)',
              },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className="font-ui text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
                <p
                  className="font-mono text-sm font-bold mt-0.5"
                  style={{ color: color ?? 'var(--color-text-secondary)' }}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Botón EMPEZAR ────────────────────────────────── */}
        <button
          className="btn-primary"
          style={{ fontSize: '1.25rem', padding: '0.9rem 4rem', letterSpacing: '0.2em' }}
          onClick={onStartTraining}
        >
          EMPEZAR
        </button>

        {/* Atajos de teclado */}
        <p className="font-ui text-xs tracking-wide text-center" style={{ color: 'var(--color-text-muted)', opacity: 0.6 }}>
          Letras/números · Enter confirma · Esc pausa · Backspace borra
        </p>

        {/* ── Stats globales (si hay historial) ─────────────── */}
        {progress.totalSessions > 0 && (
          <div
            className="flex items-center gap-6 px-5 py-3 border rounded-sm"
            style={{
              background:  'var(--color-surface)',
              borderColor: 'var(--color-border)',
              opacity:     0.7,
            }}
          >
            {[
              { label: 'Sesiones',  value: progress.totalSessions },
              { label: 'Tiempo',    value: formattedTotalTime },
              { label: 'Koch max',  value: `L${Math.max(...progress.sessionHistory.map(s => s.kochLevel))}` },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="font-mono text-sm font-bold" style={{ color: 'var(--color-text-secondary)' }}>{value}</p>
                <p className="font-ui text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer
        className="px-5 py-3 border-t text-center"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <p className="font-ui text-xs tracking-wide" style={{ color: 'var(--color-text-muted)' }}>
          Método Koch · Secuencia {seqName} · Fase 2
        </p>
      </footer>
    </div>
  );
}
