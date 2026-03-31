/**
 * ProgressScreen.jsx — Pantalla de progreso rediseñada.
 */
import React from 'react';
import { useProgress } from '../../context/ProgressContext.jsx';
import { charAccuracy } from '../../engine/AccuracyCalculator.js';

function AccuracyChart({ sessions }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: '12px', color: 'var(--text-3)', letterSpacing: '0.1em' }}>Sin datos todavía</span>
      </div>
    );
  }
  const displayed = sessions.slice(-20);
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px 12px 8px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '64px' }}>
        {Array(20 - displayed.length).fill(null).map((_, i) => <div key={`e-${i}`} style={{ flex: 1 }} />)}
        {displayed.map((s, i) => {
          const c = s.accuracy >= 90 ? 'var(--green)' : s.accuracy >= 70 ? 'var(--amber)' : 'var(--red)';
          return (
            <div key={s.id} title={`${s.accuracy.toFixed(0)}% · L${s.kochLevel}`}
              style={{ flex: 1, background: c, opacity: 0.75, borderRadius: '1px 1px 0 0', height: `${Math.max(3, s.accuracy)}%`, transition: 'height 0.3s ease', cursor: 'default' }} />
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: '10px', color: 'var(--text-3)' }}>últimas {displayed.length} sesiones</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-3)' }}>100%</span>
      </div>
    </div>
  );
}

function CharHeatmap({ characterStats }) {
  const entries = Object.entries(characterStats);
  if (entries.length === 0) return (
    <div style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: '12px', color: 'var(--text-3)', letterSpacing: '0.1em' }}>Sin datos todavía</span>
    </div>
  );

  const sorted = entries.map(([char, stats]) => ({ char, acc: charAccuracy(stats) ?? 0, total: stats.total }))
    .sort((a, b) => a.acc - b.acc);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
      {sorted.map(({ char, acc, total }) => {
        const c = acc >= 90 ? 'var(--green)' : acc >= 70 ? 'var(--amber)' : 'var(--red)';
        const bg = acc >= 90 ? 'rgba(34,197,94,0.1)' : acc >= 70 ? 'rgba(3,58,112,0.15)' : 'rgba(239,68,68,0.1)';
        return (
          <div key={char} title={`${char}: ${acc.toFixed(0)}% (${total} veces)`}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 8px', border: `1px solid ${c}33`, background: bg, borderRadius: '2px', minWidth: '40px', gap: '2px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: 'var(--text-1)', lineHeight: 1 }}>{char}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: c, lineHeight: 1 }}>{acc.toFixed(0)}%</span>
          </div>
        );
      })}
    </div>
  );
}

export function ProgressScreen({ onClose }) {
  const { progress, getRecentSessions, getRecentAccuracy, formattedTotalTime, resetProgress } = useProgress();
  const recentSessions = getRecentSessions(20);
  const recentAccuracy = getRecentAccuracy(5);
  const allSessions    = [...progress.sessionHistory];
  const maxKoch = allSessions.length > 0 ? Math.max(...allSessions.map(s => s.kochLevel ?? 0)) : 0;

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: '15px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-1)' }}>Progreso</span>
        <button className="btn btn-secondary" onClick={onClose}>← Volver</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', maxWidth: '600px', width: '100%', margin: '0 auto', padding: '28px 24px 48px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

        {/* Stats globales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: 'var(--border)' }}>
          {[
            { l: 'Sesiones',         v: progress.totalSessions },
            { l: 'Tiempo total',     v: formattedTotalTime || '0m' },
            { l: 'Mejor nivel Koch', v: maxKoch > 0 ? `L${maxKoch}` : '—' },
            { l: 'Acc reciente',     v: recentAccuracy != null ? `${recentAccuracy.toFixed(0)}%` : '—',
              c: recentAccuracy != null ? (recentAccuracy >= 90 ? 'var(--green)' : recentAccuracy >= 70 ? 'var(--amber)' : 'var(--red)') : undefined },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ padding: '18px 20px', background: 'var(--surface)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: c ?? 'var(--text-1)', lineHeight: 1 }}>{v}</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--text-3)', marginTop: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Gráfico */}
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '10px' }}>
            Accuracy por sesión
          </div>
          <AccuracyChart sessions={allSessions} />
        </div>

        {/* Heatmap */}
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '10px' }}>
            Precisión por carácter
          </div>
          <CharHeatmap characterStats={progress.characterStats} />
        </div>

        {/* Historial */}
        {recentSessions.length > 0 && (
          <div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '10px' }}>
              Últimas sesiones
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {recentSessions.map(s => {
                const c = s.accuracy >= 90 ? 'var(--green)' : s.accuracy >= 70 ? 'var(--amber)' : 'var(--red)';
                const d = new Date(s.date);
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: c, minWidth: '50px' }}>{s.accuracy.toFixed(0)}%</span>
                      <div>
                        <span style={{ fontFamily: 'var(--font-ui)', fontSize: '13px', color: 'var(--text-2)' }}>Koch L{s.kochLevel}</span>
                        <span style={{ fontFamily: 'var(--font-ui)', fontSize: '12px', color: 'var(--text-3)', marginLeft: '10px' }}>{s.speedValue} {s.speedUnit.toUpperCase()}</span>
                        {s.durationSeconds && <span style={{ fontFamily: 'var(--font-ui)', fontSize: '12px', color: 'var(--text-3)', marginLeft: '6px' }}>· {Math.floor(s.durationSeconds / 60)}m</span>}
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-3)' }}>
                      {d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} {d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reset */}
        <div style={{ padding: '16px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: '13px', color: 'var(--text-3)', marginBottom: '12px', lineHeight: 1.5 }}>
            Resetear borra todo el historial y estadísticas. No se puede deshacer.
          </p>
          <button
            onClick={() => { if (confirm('¿Borrar todo el historial de progreso?')) resetProgress(); }}
            style={{ fontFamily: 'var(--font-ui)', fontSize: '13px', color: 'var(--red)', background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '2px', padding: '7px 14px', cursor: 'pointer' }}
          >
            Resetear progreso
          </button>
        </div>
      </div>
    </div>
  );
}
