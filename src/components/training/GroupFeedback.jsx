/**
 * GroupFeedback.jsx — Comparación sent vs received con diseño limpio.
 */
import React from 'react';

export function GroupFeedback({ feedback, fontSize = 'medium' }) {
  if (!feedback) return null;
  const { sent, received, result } = feedback;
  const sentUp = sent.toUpperCase();

  const sizeClass = { small: 'mono-sm', medium: 'mono-md', large: 'mono-lg', xlarge: 'mono-xl' }[fontSize] ?? 'mono-md';

  const badgeColor = result.accuracy === 100
    ? { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', text: 'var(--green)' }
    : result.accuracy >= 80
      ? { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: 'var(--amber)' }
      : { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: 'var(--red)' };

  return (
    <div className="slide-up" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>

      {/* Badge accuracy */}
      <div style={{
        padding: '4px 14px',
        background: badgeColor.bg,
        border: `1px solid ${badgeColor.border}`,
        borderRadius: '2px',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
        fontWeight: 700,
        letterSpacing: '0.1em',
        color: badgeColor.text,
      }}>
        {result.accuracy === 100 ? '✓ PERFECTO' : `${result.accuracy.toFixed(0)}%`}
      </div>

      {/* Comparación */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '400px' }}>
        {/* Enviado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', color: 'var(--text-3)', textTransform: 'uppercase', width: '36px', textAlign: 'right', flexShrink: 0 }}>ENV</span>
          <div className={sizeClass} style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {sentUp.split('').map((char, i) => (
              <span key={i} className={result.details[i]?.isCorrect ? 'char-ok' : 'char-err'}>{char}</span>
            ))}
          </div>
        </div>

        {/* Recibido */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', color: 'var(--text-3)', textTransform: 'uppercase', width: '36px', textAlign: 'right', flexShrink: 0 }}>TU</span>
          <div className={sizeClass} style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {sentUp.split('').map((_, i) => {
              const d = result.details[i];
              if (!d?.receivedChar) return <span key={i} className="char-miss">_</span>;
              return <span key={i} className={d.isCorrect ? 'char-ok' : 'char-err'}>{d.receivedChar}</span>;
            })}
          </div>
        </div>
      </div>

      {/* Mini stats */}
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: '12px', color: 'var(--text-3)', display: 'flex', gap: '16px' }}>
        <span><span style={{ color: 'var(--green)' }}>{result.correctChars}</span>/{result.totalChars} correctos</span>
      </div>
    </div>
  );
}
