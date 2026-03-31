/**
 * HomeScreen.jsx — Pantalla de inicio rediseñada.
 * Estética: panel de radio de precisión.
 */
import React from 'react';
import { useSettings }  from '../../context/SettingsContext.jsx';
import { useProgress }  from '../../context/ProgressContext.jsx';
import { G4FON_ORDER, LCWO_ORDER } from '../../constants/kochSequences.js';
import { MORSE_CODE } from '../../constants/morseCodes.js';
import logoRCC from '/logo-rcc.png';

const S = {
  root: {
    minHeight: '100dvh',
    background: 'var(--bg)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },

  // Header horizontal: logo + navegación
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    height: '52px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--surface)',
    flexShrink: 0,
  },
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoBadge: {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    background: 'transparent',
    borderRadius: '50%',
    overflow: 'hidden',
  },
  logoImg: {
    width: '36px',
    height: '36px',
    objectFit: 'cover',
    display: 'block',
  },
  appName: {
    fontFamily: 'var(--font-ui)',
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--text-1)',
    lineHeight: 1,
  },
  clubName: {
    fontFamily: 'var(--font-ui)',
    fontSize: '11px',
    color: 'var(--text-3)',
    letterSpacing: '0.06em',
  },
  navGroup: {
    display: 'flex',
    gap: '4px',
  },

  // Contenido central
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 32px',
    gap: '32px',
  },

  // Panel de estado: 2 columnas
  statusPanel: {
    width: '100%',
    maxWidth: '520px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
  },

  // Fila superior: nivel + velocidad
  panelTop: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    borderBottom: '1px solid var(--border)',
  },
  panelCell: {
    padding: '20px 24px',
  },
  panelCellRight: {
    padding: '20px 24px',
    borderLeft: '1px solid var(--border)',
    textAlign: 'right',
  },
  cellLabel: {
    fontFamily: 'var(--font-ui)',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'var(--text-3)',
    marginBottom: '6px',
  },
  levelNumber: {
    fontFamily: 'var(--font-mono)',
    fontSize: '52px',
    fontWeight: 700,
    color: 'var(--text-1)',
    lineHeight: 1,
  },
  speedNumber: {
    fontFamily: 'var(--font-mono)',
    fontSize: '44px',
    fontWeight: 700,
    color: 'var(--amber-text)',
    lineHeight: 1,
  },
  speedUnit: {
    fontFamily: 'var(--font-mono)',
    fontSize: '14px',
    fontWeight: 500,
    color: 'var(--text-3)',
    marginLeft: '4px',
  },

  // Caracteres activos
  charsRow: {
    padding: '16px 24px',
    borderBottom: '1px solid var(--border)',
  },
  charsLabel: {
    fontFamily: 'var(--font-ui)',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: 'var(--text-3)',
    marginBottom: '10px',
  },
  charsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  charChip: (isHard, isNew) => ({
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '5px 8px',
    border: `1px solid ${isHard ? 'rgba(3,58,112,0.4)' : 'var(--border)'}`,
    background: isHard ? 'var(--amber-dim)' : 'var(--surface-2)',
    borderRadius: '2px',
    gap: '2px',
  }),
  charLetter: (isHard) => ({
    fontFamily: 'var(--font-mono)',
    fontSize: '14px',
    fontWeight: 700,
    color: isHard ? 'var(--amber-text)' : 'var(--text-2)',
    lineHeight: 1,
  }),
  charCode: {
    fontFamily: 'var(--font-mono)',
    fontSize: '8px',
    color: 'var(--text-3)',
    letterSpacing: '0.1em',
    lineHeight: 1,
  },

  // Stats rápidas
  statsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
  },
  statCell: (idx) => ({
    padding: '14px 16px',
    textAlign: 'center',
    borderLeft: idx > 0 ? '1px solid var(--border)' : 'none',
  }),
  statValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-1)',
    lineHeight: 1,
  },
  statLabel: {
    fontFamily: 'var(--font-ui)',
    fontSize: '11px',
    color: 'var(--text-3)',
    marginTop: '4px',
  },

  // Botón empezar
  startBtn: {
    width: '100%',
    maxWidth: '520px',
  },

  // Atajos
  hints: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  hint: {
    fontFamily: 'var(--font-ui)',
    fontSize: '12px',
    color: 'var(--text-3)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  hintKey: {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    color: 'var(--text-2)',
    background: 'var(--surface-2)',
    border: '1px solid var(--border-2)',
    borderRadius: '2px',
    padding: '2px 6px',
  },

  // Stats globales (si hay historial)
  globalStats: {
    display: 'flex',
    gap: '24px',
    padding: '12px 20px',
    border: '1px solid var(--border)',
    background: 'var(--surface)',
  },
  globalStat: {
    textAlign: 'center',
  },
  globalValue: {
    fontFamily: 'var(--font-mono)',
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text-2)',
    lineHeight: 1,
  },
  globalLabel: {
    fontFamily: 'var(--font-ui)',
    fontSize: '10px',
    color: 'var(--text-3)',
    marginTop: '3px',
    letterSpacing: '0.06em',
  },

  // Footer
  footer: {
    padding: '12px 32px',
    borderTop: '1px solid var(--border)',
    background: 'var(--surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontFamily: 'var(--font-ui)',
    fontSize: '11px',
    color: 'var(--text-3)',
    letterSpacing: '0.06em',
  },
};

export function HomeScreen({ onStartTraining, onOpenSettings, onOpenProgress }) {
  const { settings }   = useSettings();
  const { progress, getRecentAccuracy, formattedTotalTime } = useProgress();

  const sequence    = settings.exerciseType === 'koch_lcwo' ? LCWO_ORDER : G4FON_ORDER;
  const activeChars = sequence.slice(0, settings.kochLevel);
  const seqName     = settings.exerciseType === 'koch_lcwo' ? 'LCWO' : 'G4FON';
  const recentAcc   = getRecentAccuracy(5);

  // Los últimos 2 = auto-hard si está activado
  const autoHardSet = settings.autoHardLetters
    ? new Set([activeChars[activeChars.length - 1], activeChars[activeChars.length - 2]].filter(Boolean))
    : new Set();
  const hardSet = new Set([...settings.hardLetters, ...autoHardSet]);

  // Formato de duración
  const durSec = settings.exerciseDuration;
  const durLabel = durSec < 60 ? `${durSec}s` : `${durSec / 60}m`;

  // Formato de grupo
  const groupLabel = settings.wordLength === 0 ? 'Variable' : `${settings.wordLength}`;

  // Accuracy reciente con color
  const accColor = recentAcc == null
    ? 'var(--text-3)'
    : recentAcc >= 90
      ? 'var(--green)'
      : recentAcc >= 70
        ? 'var(--amber)'
        : 'var(--red)';

  return (
    <div style={S.root}>

      {/* Dot pattern de fondo — muy sutil */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
      }} />

      {/* Header */}
      <header style={{ ...S.header, position: 'relative', zIndex: 1 }}>
        <div style={S.logoGroup}>
          <div style={S.logoBadge}>
            <img src={logoRCC} alt="Radio Club Córdoba" style={S.logoImg} />
          </div>
          <div>
            <div style={S.appName}>Koch Trainer</div>
            <div style={S.clubName}>LU4HH - Radio Club Córdoba</div>
          </div>
        </div>
        <nav style={S.navGroup}>
          <button className="btn btn-ghost" onClick={onOpenProgress}>Progreso</button>
          <button className="btn btn-ghost" onClick={onOpenSettings}>Configuración</button>
        </nav>
      </header>

      {/* Main */}
      <main style={{ ...S.main, position: 'relative', zIndex: 1 }}>

        {/* Panel de estado */}
        <div style={S.statusPanel}>

          {/* Nivel + Velocidad */}
          <div style={S.panelTop}>
            <div style={S.panelCell}>
              <div style={S.cellLabel}>Nivel Koch · {seqName}</div>
              <div style={S.levelNumber}>{settings.kochLevel}</div>
            </div>
            <div style={S.panelCellRight}>
              <div style={S.cellLabel}>Velocidad</div>
              <div>
                <span style={S.speedNumber}>{settings.speedValue}</span>
                <span style={S.speedUnit}>{settings.speedUnit.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Caracteres activos */}
          <div style={S.charsRow}>
            <div style={S.charsLabel}>Caracteres activos ({activeChars.length})</div>
            <div style={S.charsGrid}>
              {activeChars.map(char => {
                const isHard = hardSet.has(char);
                const code   = MORSE_CODE[char] ?? '';
                return (
                  <div key={char} style={S.charChip(isHard)} title={isHard ? 'Hard letter' : ''}>
                    <span style={S.charLetter(isHard)}>{char}</span>
                    <span style={S.charCode}>{code}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats rápidas */}
          <div style={S.statsRow}>
            {[
              { label: 'Duración',    value: durLabel },
              { label: 'Grupo',       value: groupLabel },
              { label: 'Acc reciente', value: recentAcc != null ? `${recentAcc.toFixed(0)}%` : '—', color: accColor },
            ].map(({ label, value, color }, idx) => (
              <div key={label} style={S.statCell(idx)}>
                <div style={{ ...S.statValue, color: color ?? 'var(--text-1)' }}>{value}</div>
                <div style={S.statLabel}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Botón EMPEZAR */}
        <div style={S.startBtn}>
          <button className="btn btn-primary" style={{ width: '100%', fontSize: '16px', padding: '16px' }} onClick={onStartTraining}>
            EMPEZAR
          </button>
        </div>

        {/* Atajos */}
        <div style={S.hints}>
          {[
            ['Enter', 'confirmar'],
            ['Esc', 'pausa'],
            ['Backspace', 'borrar'],
          ].map(([key, desc]) => (
            <div key={key} style={S.hint}>
              <span style={S.hintKey}>{key}</span>
              <span>{desc}</span>
            </div>
          ))}
        </div>

        {/* Stats globales */}
        {progress.totalSessions > 0 && (
          <div style={S.globalStats}>
            {[
              { label: 'Sesiones',  value: progress.totalSessions },
              { label: 'Tiempo',    value: formattedTotalTime || '0m' },
              { label: 'Koch max',  value: `L${Math.max(...progress.sessionHistory.map(s => s.kochLevel))}` },
            ].map(({ label, value }) => (
              <div key={label} style={S.globalStat}>
                <div style={S.globalValue}>{value}</div>
                <div style={S.globalLabel}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ ...S.footer, position: 'relative', zIndex: 1 }}>
        <span style={S.footerText}>
          Método Koch · Secuencia {seqName} · {settings.charSpacing !== 1.0 ? `Farnsworth ${settings.charSpacing}×` : 'Spacing estándar'}
        </span>
      </footer>
    </div>
  );
}
