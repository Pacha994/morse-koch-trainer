/**
 * GroupFeedback.jsx — Comparación sent vs received con diseño limpio.
 *
 * - Layout: label centrado arriba, letras grandes centradas debajo.
 * - Deletreo fonético ITU automático via Web Speech API (si phoneticReadout=true).
 *   Lee el grupo COMPLETO: "KMMKM" → "Kilo. Mike. Mike. Kilo. Mike."
 */
import React, { useEffect, useRef } from 'react';
import { ITU_PHONETIC } from '../../constants/ituPhonetic.js';
import { useSettings } from '../../context/SettingsContext.jsx';

/**
 * Convierte un string a fonético ITU separado por pausas.
 * "KM" → "Kilo. Mike."
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

  const sizeClass = { small: 'mono-sm', medium: 'mono-md', large: 'mono-lg', xlarge: 'mono-xl' }[fontSize] ?? 'mono-md';

  const badgeColor = result.accuracy === 100
    ? { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', text: 'var(--green)' }
    : result.accuracy >= 80
      ? { bg: 'rgba(3,58,112,0.15)', border: 'rgba(3,58,112,0.35)', text: 'var(--amber)' }
      : { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: 'var(--red)' };

  // ── Deletreo fonético ─────────────────────────────────────────
  // Guardamos la utterance en una ref para que el GC no la destruya
  // antes de que termine de hablar (bug conocido en Chrome/Android).
  const utteranceRef = useRef(null);
  const timerRef     = useRef(null);

  useEffect(() => {
    // Limpiar al desmontar o al cambiar grupo
    return () => {
      clearTimeout(timerRef.current);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [sentUp]);

  useEffect(() => {
    if (!settings.phoneticReadout) return;
    if (!window.speechSynthesis) return;

    // Cancelar cualquier lectura anterior
    window.speechSynthesis.cancel();

    const text = toPhoneticSpeech(sentUp);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang   = 'en-US';
    utterance.rate   = 0.85;
    utterance.pitch  = 1.0;
    utterance.volume = 1.0;

    // Guardamos en ref para evitar que el GC destruya el objeto
    utteranceRef.current = utterance;

    // Pequeño delay para separar el audio Morse del TTS
    timerRef.current = setTimeout(() => {
      window.speechSynthesis.speak(utteranceRef.current);
    }, 350);
  }, [sentUp, settings.phoneticReadout]);

  // ── Render ────────────────────────────────────────────────────
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


/**
 * Convierte un string a fonético ITU para TTS.
 * "KM" → "Kilo. Mike."
 */
function toPhoneticSpeech(text) {
  return text
    .toUpperCase()
    .split('')
    .map(ch => ITU_PHONETIC[ch] ?? ch)
    .join('. ');  // punto = pausa natural en TTS
}

export function GroupFeedback({ feedback, fontSize = 'medium' }) {
  if (!feedback) return null;
  const { sent, received, result } = feedback;
  const sentUp = sent.toUpperCase();

  const sizeClass = { small: 'mono-sm', medium: 'mono-md', large: 'mono-lg', xlarge: 'mono-xl' }[fontSize] ?? 'mono-md';

  const badgeColor = result.accuracy === 100
    ? { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', text: 'var(--green)' }
    : result.accuracy >= 80
      ? { bg: 'rgba(3,58,112,0.15)', border: 'rgba(3,58,112,0.35)', text: 'var(--amber)' }
      : { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: 'var(--red)' };

  // ── Deletreo fonético automático ─────────────────────────────────
  // Se dispara una sola vez al montar (= cada vez que aparece feedback).
  const spokenRef = useRef(null);

  useEffect(() => {
    // Evitar repetir si el mismo grupo ya fue leído
    if (spokenRef.current === sentUp) return;
    spokenRef.current = sentUp;

    if (!window.speechSynthesis) return;

    // Cancelar cualquier utterance anterior
    window.speechSynthesis.cancel();

    const text = toPhoneticSpeech(sentUp);
    const utterance = new SpeechSynthesisUtterance(text);

    // Inglés para que pronuncie los nombres fonéticos correctamente
    utterance.lang = 'en-US';
    utterance.rate = 0.88;   // un poco más lento para mayor claridad
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Pequeño delay para que el oído se separe del audio Morse
    const timer = setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 300);

    return () => clearTimeout(timer);
  }, [sentUp]);

  // ── Render ────────────────────────────────────────────────────────
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

      {/* ── Comparación: label encima, letras centradas ─────────── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
        width: '100%',
      }}>
        {/* Fila ENV */}
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

        {/* Separador sutil */}
        <div style={{ width: '40px', height: '1px', background: 'var(--border)' }} />

        {/* Fila TU */}
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
        display: 'flex',
        gap: '16px',
      }}>
        <span>
          <span style={{ color: 'var(--green)' }}>{result.correctChars}</span>/{result.totalChars} correctos
        </span>
      </div>
    </div>
  );
}
