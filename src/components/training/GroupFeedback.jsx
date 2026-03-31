/**
 * GroupFeedback.jsx — Comparación sent vs received con diseño limpio.
 *
 * - Layout: label centrado arriba, letras grandes centradas debajo.
 * - Deletreo fonético ITU automático via Web Speech API (si phoneticReadout=true).
 *   Lee el grupo COMPLETO: "KMMKM" → "Kilo. Mike. Mike. Kilo. Mike."
 */
import React, { useEffect, useRef } from 'react';
import { ITU_PHONETIC } from '../../constants/ituPhonetic.js';
import { useSettings }  from '../../context/SettingsContext.jsx';

/**
 * Convierte un string a fonético ITU separado por pausas.
 * "KM" → "Kilo. Mike."  (con punto final para una pausa natural al terminar)
 */
function toPhoneticSpeech(text) {
  return text
    .toUpperCase()
    .split('')
    .map(ch => ITU_PHONETIC[ch] ?? ch)
    .join('. ') + '.';
}

export function GroupFeedback({ feedback, fontSize = 'medium' }) {
  if (!feedback) return null;

  const { settings } = useSettings();
  const { sent, result } = feedback;
  const sentUp = sent.toUpperCase();

  const sizeClass =
    { small: 'mono-sm', medium: 'mono-md', large: 'mono-lg', xlarge: 'mono-xl' }[fontSize] ??
    'mono-md';

  const badgeColor =
    result.accuracy === 100
      ? { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)',   text: 'var(--green)' }
      : result.accuracy >= 80
        ? { bg: 'rgba(3,58,112,0.15)',   border: 'rgba(3,58,112,0.35)',   text: 'var(--amber)' }
        : { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)',  text: 'var(--red)'   };

  // ── Deletreo fonético ─────────────────────────────────────────────────────
  // spokenRef evita re-lectura si el componente re-renderiza con el mismo grupo.
  // La utteranceRef retiene la referencia para que el GC no destruya el objeto
  // antes de que Chrome termine de hablar (bug conocido en Chrome/Android).
  const spokenRef    = useRef(null);
  const utteranceRef = useRef(null);
  const timerRef     = useRef(null);

  useEffect(() => {
    // Cancelar TTS anterior al desmontar o al cambiar de grupo
    return () => {
      clearTimeout(timerRef.current);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [sentUp]);

  useEffect(() => {
    if (!settings.phoneticReadout) return;
    if (!window.speechSynthesis)   return;

    // No releer si ya leímos este mismo grupo (previene dobles re-renders)
    if (spokenRef.current === sentUp) return;
    spokenRef.current = sentUp;

    // Cancelar cualquier utterance en curso
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(toPhoneticSpeech(sentUp));
    utterance.lang   = 'en-US'; // pronunciación correcta de nombres ITU
    utterance.rate   = 0.85;
    utterance.pitch  = 1.0;
    utterance.volume = 1.0;

    // Guardamos en ref para que el GC no destruya el objeto prematuramente
    utteranceRef.current = utterance;

    // Pequeño delay para separar el audio Morse del TTS
    timerRef.current = setTimeout(() => {
      window.speechSynthesis.speak(utteranceRef.current);
    }, 350);
  }, [sentUp, settings.phoneticReadout]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="slide-up"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      {/* Badge de accuracy */}
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

      {/* Comparación: label centrado arriba, letras centradas abajo */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        width: '100%',
      }}>
        {/* Fila ENVIADO */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.22em',
            color: 'var(--text-3)',
            textTransform: 'uppercase',
          }}>
            ENVIADO
          </span>
          <div className={sizeClass} style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {sentUp.split('').map((char, i) => (
              <span key={i} className={result.details[i]?.isCorrect ? 'char-ok' : 'char-err'}>{char}</span>
            ))}
          </div>
        </div>

        {/* Separador */}
        <div style={{ width: '40px', height: '1px', background: 'var(--border)' }} />

        {/* Fila TU RESPUESTA */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.22em',
            color: 'var(--text-3)',
            textTransform: 'uppercase',
          }}>
            TU RESPUESTA
          </span>
          <div className={sizeClass} style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {sentUp.split('').map((_, i) => {
              const d = result.details[i];
              if (!d?.receivedChar) return <span key={i} className="char-miss">_</span>;
              return <span key={i} className={d.isCorrect ? 'char-ok' : 'char-err'}>{d.receivedChar}</span>;
            })}
          </div>
        </div>
      </div>

      {/* Mini stats */}
      <div style={{
        fontFamily: 'var(--font-ui)',
        fontSize: '12px',
        color: 'var(--text-3)',
      }}>
        <span>
          <span style={{ color: 'var(--green)' }}>{result.correctChars}</span>/{result.totalChars} correctos
        </span>
      </div>
    </div>
  );
}
