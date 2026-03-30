/**
 * AudioIndicator.jsx
 * Indicador visual de que el audio Morse está reproduciéndose.
 * Diseño minimalista: un punto que pulsa con la actividad.
 */
import React from 'react';
import { SESSION_STATE } from '../../hooks/useTrainingSession.js';

/**
 * @param {object} props
 * @param {string}  props.sessionState  - Estado actual de la sesión
 * @param {string}  props.currentGroup  - Grupo siendo reproducido (para mostrar si groupPrint=false)
 * @param {boolean} props.groupPrint    - Si true, ocultar texto hasta el final
 * @param {number}  props.inputTimeout  - Segundos restantes para responder
 */
export function AudioIndicator({ sessionState, currentGroup, groupPrint, inputTimeout }) {
  const isPlaying = sessionState === SESSION_STATE.PLAYING_AUDIO;
  const isWaiting = sessionState === SESSION_STATE.WAITING_INPUT;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* ── Indicador de estado ─────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Dot de actividad */}
        <div
          className={`rounded-full flex-shrink-0 ${isPlaying ? 'transmit-pulse' : ''}`}
          style={{
            width:      10,
            height:     10,
            background: isPlaying
              ? 'var(--amber)'
              : isWaiting
                ? 'var(--text-3)'
                : 'var(--border-2)',
            transition: 'background 0.3s',
          }}
        />

        {/* Label de estado */}
        <span
          className="font-ui text-xs tracking-widest uppercase"
          style={{
            color: isPlaying
              ? 'var(--amber)'
              : isWaiting
                ? 'var(--text-2)'
                : 'var(--text-3)',
          }}
        >
          {isPlaying ? 'Transmitiendo'
            : isWaiting ? `Esperando respuesta ${inputTimeout > 0 ? `(${inputTimeout}s)` : ''}`
            : 'Listo'}
        </span>
      </div>

      {/* ── Grupo enviado (solo visible si groupPrint=false y ya terminó el audio) ── */}
      {!groupPrint && (isWaiting) && currentGroup && (
        <div
          className="morse-text morse-sm slide-up"
          style={{ color: 'var(--text-3)', opacity: 0.4 }}
          title="Grupo enviado (visible solo en modo debug)"
        >
          {/* Oculto por defecto: solo durante el feedback se muestra claramente */}
        </div>
      )}
    </div>
  );
}
