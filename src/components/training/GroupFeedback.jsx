/**
 * GroupFeedback.jsx — Comparación sent vs received con diseño limpio.
 *
 * - Layout: label centrado arriba, letras grandes centradas debajo.
 * - Deletreo fonético ITU automático via Web Speech API (si phoneticReadout=true).
 *   Lee el grupo COMPLETO: "KMMKM" → "Kilo. Mike. Mike. Kilo. Mike."
 *
 * ── Bug de Chrome con Web Audio API ──────────────────────────────────────────
 * Chrome tiene un bug conocido donde speechSynthesis.speak() se pausa
 * silenciosamente (~1s) cuando la página también usa Web Audio API (como
 * nosotros con el oscillador Morse). El workaround es un setInterval que
 * llama a speechSynthesis.pause() + resume() cada ~250ms mientras la
 * utterance esté activa — esto "ticklea" al sintetizador y evita que se congele.
 * Referencias: https://bugs.chromium.org/p/chromium/issues/detail?id=679437
 */
import React, { useEffect, useRef } from 'react';
import { ITU_PHONETIC } from '../../constants/ituPhonetic.js';
import { useSettings }  from '../../context/SettingsContext.jsx';

/**
 * Convierte un string a fonético ITU separado por pausas.
 * "KM" → "Kilo. Mike."  (con punto final para pausa natural al terminar)
 */
function toPhoneticSpeech(text) {
  return text
    .toUpperCase()
    .split('')
    .map(ch => ITU_PHONETIC[ch] ?? ch)
    .join('. ') + '.';
}

/**
 * Workaround para el bug de Chrome que corta speechSynthesis cuando
 * la página usa Web Audio API simultáneamente.
 *
 * Inicia un interval que pausa+resume el sintetizador cada 250ms
 * mientras la utterance esté activa. Retorna una función de cleanup.
 */
function startSpeechKeepAlive() {
  const synth = window.speechSynthesis;
  // El intervalo "ticklea" al sintetizador para que no se congele
  const intervalId = setInterval(() => {
    if (!synth.speaking) {
      clearInterval(intervalId);
      return;
    }
    synth.pause();
    synth.resume();
  }, 250);

  return () => clearInterval(intervalId);
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
  const spokenRef      = useRef(null); // evita re-lectura si mismo grupo
  const utteranceRef   = useRef(null); // retiene objeto para prevenir GC prematuro
  const timerRef       = useRef(null); // timeout del delay inicial
  const keepAliveRef   = useRef(null); // cleanup del workaround de Chrome

  useEffect(() => {
    // Cleanup al desmontar o al cambiar de grupo: cancelar todo
    return () => {
      clearTimeout(timerRef.current);
      if (keepAliveRef.current) {
        keepAliveRef.current(); // detener el interval del workaround
        keepAliveRef.current = null;
      }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [sentUp]);

  useEffect(() => {
    if (!settings.phoneticReadout) return;
    if (!window.speechSynthesis)   return;

    // No releer si ya leímos este mismo grupo (previene dobles re-renders)
    if (spokenRef.current === sentUp) return;
    spokenRef.current = sentUp;

    // Cancelar cualquier utterance en curso y limpiar keep-alive anterior
    window.speechSynthesis.cancel();
    if (keepAliveRef.current) {
      keepAliveRef.current();
      keepAliveRef.current = null;
    }

    const utterance = new SpeechSynthesisUtterance(toPhoneticSpeech(sentUp));
    utterance.lang   = 'en-US'; // pronunciación correcta de nombres ITU
    utterance.rate   = 0.85;
    utterance.pitch  = 1.0;
    utterance.volume = 1.0;

    // Al terminar, limpiar el keep-alive
    utterance.onend = () => {
      if (keepAliveRef.current) {
        keepAliveRef.current();
        keepAliveRef.current = null;
      }
    };

    // Guardamos en ref para que el GC no destruya el objeto prematuramente
    utteranceRef.current = utterance;

    // Pequeño delay para separar el audio Morse del TTS
    timerRef.current = setTimeout(() => {
      window.speechSynthesis.speak(utteranceRef.current);
      // Iniciar el workaround anti-freeze de Chrome inmediatamente después
      keepAliveRef.current = startSpeechKeepAlive();
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
