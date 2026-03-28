/**
 * GroupFeedback.jsx
 * Muestra la comparación lado a lado del grupo enviado vs el recibido.
 * Cada carácter se colorea según si fue correcto o no.
 */
import React from 'react';

/**
 * @param {object} props
 * @param {object} props.feedback - { sent, received, result }
 * @param {string} props.fontSize - 'small'|'medium'|'large'|'xlarge'
 */
export function GroupFeedback({ feedback, fontSize = 'medium' }) {
  if (!feedback) return null;

  const { sent, received, result } = feedback;
  const sentUpper     = sent.toUpperCase();
  const receivedUpper = received.toUpperCase();

  // Determinar clase de tamaño de fuente
  const sizeClass = {
    small:  'morse-sm',
    medium: 'morse-md',
    large:  'morse-lg',
    xlarge: 'morse-xl',
  }[fontSize] ?? 'morse-md';

  return (
    <div className="slide-up w-full">
      {/* ── Accuracy badge ─────────────────────────────────────── */}
      <div className="flex items-center justify-center mb-4">
        <span
          className="font-ui text-sm font-bold px-3 py-1 rounded-sm tracking-widest uppercase"
          style={{
            background: result.accuracy === 100
              ? 'rgba(34,197,94,0.15)'
              : result.accuracy >= 80
                ? 'rgba(245,158,11,0.15)'
                : 'rgba(239,68,68,0.15)',
            color: result.accuracy === 100
              ? 'var(--color-correct)'
              : result.accuracy >= 80
                ? 'var(--color-accent)'
                : 'var(--color-error)',
            border: `1px solid ${
              result.accuracy === 100
                ? 'rgba(34,197,94,0.3)'
                : result.accuracy >= 80
                  ? 'rgba(245,158,11,0.3)'
                  : 'rgba(239,68,68,0.3)'
            }`,
          }}
        >
          {result.accuracy === 100 ? '✓ PERFECTO' : `${result.accuracy.toFixed(0)}%`}
        </span>
      </div>

      {/* ── Comparación de caracteres ─────────────────────────── */}
      <div className="space-y-2">
        {/* Enviado */}
        <div className="flex items-center gap-3">
          <span
            className="font-ui text-xs tracking-widest uppercase w-16 text-right flex-shrink-0"
            style={{ color: 'var(--color-text-muted)' }}
          >
            ENV
          </span>
          <div className={`${sizeClass} morse-text flex gap-1 flex-wrap`}>
            {sentUpper.split('').map((char, i) => {
              const detail    = result.details[i];
              const isCorrect = detail?.isCorrect;
              return (
                <span
                  key={i}
                  style={{ color: isCorrect ? 'var(--color-correct)' : 'var(--color-error)' }}
                >
                  {char}
                </span>
              );
            })}
          </div>
        </div>

        {/* Recibido */}
        <div className="flex items-center gap-3">
          <span
            className="font-ui text-xs tracking-widest uppercase w-16 text-right flex-shrink-0"
            style={{ color: 'var(--color-text-muted)' }}
          >
            TU
          </span>
          <div className={`${sizeClass} morse-text flex gap-1 flex-wrap`}>
            {sentUpper.split('').map((_, i) => {
              const detail      = result.details[i];
              const receivedChar = detail?.receivedChar;
              const isCorrect   = detail?.isCorrect;

              if (!receivedChar) {
                // El usuario no tipeo este carácter
                return (
                  <span key={i} style={{ color: 'var(--color-text-muted)' }}>_</span>
                );
              }
              return (
                <span
                  key={i}
                  style={{ color: isCorrect ? 'var(--color-correct)' : 'var(--color-error)' }}
                >
                  {receivedChar}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Stats del grupo ───────────────────────────────────── */}
      <div
        className="mt-4 flex justify-center gap-6 font-ui text-xs tracking-widest uppercase"
        style={{ color: 'var(--color-text-muted)' }}
      >
        <span>
          <span style={{ color: 'var(--color-correct)' }}>{result.correctChars}</span>
          /{result.totalChars} correctos
        </span>
        <span>
          {received.length > 0 ? received.length : '—'} tipeados
        </span>
      </div>
    </div>
  );
}
