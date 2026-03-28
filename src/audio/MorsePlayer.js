/**
 * MorsePlayer.js
 * ─────────────────────────────────────────────────────────────────
 * Motor de audio Morse usando la Web Audio API.
 * 
 * ── Diseño de audio: "scheduled audio" ─────────────────────────
 * NO usamos setTimeout/setInterval para el timing — tienen jitter de
 * hasta 10-20ms que hace el Morse incorrecto a alta velocidad.
 * 
 * En su lugar, usamos la API de scheduling de AudioContext:
 *   osc.start(audioContext.currentTime + offset)
 * 
 * Esto programa todos los tonos de un grupo DE ANTEMANO en el timeline
 * del AudioContext, que tiene resolución de microsegundos y no se
 * ve afectado por el event loop de JavaScript.
 * 
 * ── Envelope del tono ────────────────────────────────────────────
 * Para evitar clicks audibles al activar/desactivar el oscilador,
 * aplicamos un envelope de volumen:
 * 
 *   ──── silencio ──[attack]──── sonido ────[release]── silencio ────
 *   0   0   0   0  /        1   1   1   1  \        0   0   0   0
 * 
 * El tiempo de attack/release es configurable (default 5ms).
 * 
 * ── Dot pitch ────────────────────────────────────────────────────
 * Cuando dotPitch > 0, los dots y los dashes suenan a frecuencias
 * diferentes, lo que facilita distinguirlos auditivamente.
 * ─────────────────────────────────────────────────────────────────
 */

import { MORSE_CODE }           from '../constants/morseCodes.js';
import { calculateTimings, normalizeToWpm } from './timings.js';

export class MorsePlayer {
  constructor() {
    /** @type {AudioContext|null} */
    this.audioContext = null;

    /** Referencia al nodo GainNode maestro de volumen */
    this.masterGain = null;

    /**
     * Lista de osciladores activos para poder detenerlos todos de golpe.
     * Se vacía tras cada grupo completado.
     * @type {OscillatorNode[]}
     */
    this._activeOscillators = [];

    /**
     * Tiempo (en segundos del AudioContext) en que terminará el grupo actual.
     * Permite saber cuándo esperar antes de reproducir el siguiente grupo.
     * @type {number}
     */
    this._groupEndTime = 0;
  }

  // ────────────────────────────────────────────────────────────────
  // Inicialización
  // ────────────────────────────────────────────────────────────────

  /**
   * Inicializa (o re-inicializa) el AudioContext.
   * 
   * DEBE llamarse desde un evento de usuario (click, keydown, etc.)
   * debido a la política de autoplay de los navegadores.
   * Los browsers bloquean AudioContext creados sin interacción del usuario.
   * 
   * @returns {AudioContext}
   */
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Nodo GainNode maestro para control global de volumen
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
    }

    // Si el contexto fue suspendido (política autoplay del browser), resumirlo
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    return this.audioContext;
  }

  /**
   * Verifica si el player está listo para reproducir.
   * @returns {boolean}
   */
  isReady() {
    return this.audioContext !== null && this.audioContext.state !== 'closed';
  }

  // ────────────────────────────────────────────────────────────────
  // Scheduling de tonos individuales
  // ────────────────────────────────────────────────────────────────

  /**
   * Programa un tono individual en el timeline del AudioContext.
   * 
   * Este método NO produce sonido inmediatamente. Crea un oscilador
   * y lo programa para que empiece y termine en momentos específicos.
   * El AudioContext lo ejecutará con precisión de microsegundos.
   * 
   * @param {number} startTime - Tiempo de inicio (audioContext.currentTime + offset, en segundos)
   * @param {number} durationSec - Duración del tono en SEGUNDOS
   * @param {number} frequency - Frecuencia en Hz
   * @param {number} volume - Volumen 0.0 a 1.0
   * @param {number} attackSec - Tiempo de fade-in en SEGUNDOS
   * @param {number} releaseSec - Tiempo de fade-out en SEGUNDOS
   * @returns {number} El tiempo en que termina este tono (para encadenar el siguiente)
   */
  _scheduleTone(startTime, durationSec, frequency, volume, attackSec, releaseSec) {
    const ctx = this.audioContext;

    // ── Oscilador ──────────────────────────────────────────────
    const osc = ctx.createOscillator();
    osc.type = 'sine';  // Onda sinusoidal = tono CW limpio y puro
    osc.frequency.value = frequency;

    // ── GainNode para el envelope ──────────────────────────────
    // Cada tono tiene su propio GainNode para el envelope,
    // que luego se conecta al masterGain.
    const gain = ctx.createGain();

    // Aplicar el envelope: silencio → attack → sustain → release → silencio
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + attackSec);
    // Mantener el volumen en el sustain
    gain.gain.setValueAtTime(volume, startTime + durationSec - releaseSec);
    // Fade out al final
    gain.gain.linearRampToValueAtTime(0, startTime + durationSec);

    // ── Routing del audio ──────────────────────────────────────
    osc.connect(gain);
    gain.connect(this.masterGain);

    // ── Scheduling ─────────────────────────────────────────────
    osc.start(startTime);
    // Pequeño buffer de 10ms para asegurar que el release termina antes del stop
    osc.stop(startTime + durationSec + 0.01);

    // Limpiar referencia cuando el oscilador termina para evitar memory leaks
    osc.onended = () => {
      const idx = this._activeOscillators.indexOf(osc);
      if (idx !== -1) this._activeOscillators.splice(idx, 1);
    };

    this._activeOscillators.push(osc);

    // Retorna el tiempo de fin para encadenar el siguiente elemento
    return startTime + durationSec;
  }

  // ────────────────────────────────────────────────────────────────
  // Reproducción de grupos
  // ────────────────────────────────────────────────────────────────

  /**
   * Programa y reproduce un grupo completo de caracteres Morse.
   * 
   * Toda la secuencia de tonos se programa de antemano en el AudioContext
   * antes de que suene el primer tono. Esto garantiza timing perfecto.
   * 
   * @param {string} group - Cadena de caracteres a reproducir (ej: "KMRS")
   * @param {object} settings - Configuración completa de la sesión
   * @param {object} settings.speedValue     - Velocidad
   * @param {object} settings.speedUnit      - 'wpm' | 'cpm'
   * @param {object} settings.charSpacing    - Multiplicador inter-carácter
   * @param {object} settings.wordSpacing    - Multiplicador inter-palabra
   * @param {object} settings.dashDotRatio   - Ratio dash/dot
   * @param {object} settings.sidetoneFrequency - Hz del tono principal
   * @param {object} settings.dotPitch       - Hz de los dots (0 = usar sidetoneFrequency)
   * @param {object} settings.toneAttack     - ms de fade-in
   * @param {object} settings.toneRelease    - ms de fade-out
   * @param {object} settings.volume         - Volumen 0-100
   * 
   * @returns {{ promise: Promise<void>, durationMs: number }}
   *   - promise: se resuelve cuando termina el grupo
   *   - durationMs: duración total del grupo en milisegundos
   */
  playGroup(group, settings) {
    const ctx = this.init();

    // ── Calcular timings ───────────────────────────────────────
    const wpm = normalizeToWpm(settings.speedValue, settings.speedUnit);
    const timings = calculateTimings(
      wpm,
      settings.charSpacing,
      settings.wordSpacing,
      settings.dashDotRatio
    );

    // ── Parámetros de audio ────────────────────────────────────
    const volume     = settings.volume / 100;                // % → 0.0-1.0
    const attackSec  = (settings.toneAttack  || 5) / 1000;  // ms → segundos
    const releaseSec = (settings.toneRelease || 5) / 1000;  // ms → segundos
    const mainFreq   = settings.sidetoneFrequency || 600;    // Hz del dah y sidetone
    // Si dotPitch > 0, los dots tienen frecuencia diferente; si no, igual al dah
    const dotFreq    = settings.dotPitch > 0 ? settings.dotPitch : mainFreq;

    // ── Punto de inicio ────────────────────────────────────────
    // Pequeño buffer de 50ms para dar tiempo al runtime a prepararse
    let t = ctx.currentTime + 0.05;
    const startTime = t; // Guardamos el inicio real para calcular duración total

    // ── Programar cada carácter ────────────────────────────────
    for (let ci = 0; ci < group.length; ci++) {
      const char = group[ci].toUpperCase();
      const code = MORSE_CODE[char];

      // Si el carácter no tiene código Morse, lo saltamos silenciosamente
      if (!code) {
        console.warn(`MorsePlayer: carácter sin código Morse: "${char}"`);
        continue;
      }

      // ── Programar cada elemento (dit/dah) del carácter ──────
      for (let ei = 0; ei < code.length; ei++) {
        const isDot      = code[ei] === '.';
        const durationMs = isDot ? timings.dot : timings.dash;
        const durationSec = durationMs / 1000;
        const freq       = isDot ? dotFreq : mainFreq;

        // Programar el tono
        this._scheduleTone(t, durationSec, freq, volume, attackSec, releaseSec);
        t += durationSec;

        // Espacio intra-carácter entre elementos (no después del último)
        if (ei < code.length - 1) {
          t += timings.intraCharGap / 1000;
        }
      }

      // Espacio inter-carácter entre caracteres (no después del último)
      if (ci < group.length - 1) {
        t += timings.interCharGap / 1000;
      }
    }

    // ── Calcular duración total ────────────────────────────────
    const totalDurationMs = (t - startTime) * 1000;
    this._groupEndTime = t;

    // ── Retornar Promise ───────────────────────────────────────
    // La Promise se resuelve cuando el audio del grupo termina.
    // Usamos setTimeout porque no podemos "await" un AudioContext scheduled event.
    // El timing de setTimeout no importa aquí (no afecta el audio),
    // solo usamos para notificar a React que el audio terminó.
    const promise = new Promise(resolve => {
      setTimeout(resolve, totalDurationMs + 100); // +100ms de margen
    });

    return {
      promise,
      durationMs: totalDurationMs,
    };
  }

  /**
   * Detiene inmediatamente toda reproducción en curso.
   * Desconecta todos los osciladores activos.
   */
  stop() {
    // Detener todos los osciladores activos
    this._activeOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignorar errores si el oscilador ya terminó
      }
    });
    this._activeOscillators = [];
  }

  /**
   * Libera completamente el AudioContext.
   * Llamar cuando la sesión termina para liberar recursos del sistema.
   */
  destroy() {
    this.stop();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
    this.audioContext = null;
    this.masterGain   = null;
  }

  /**
   * Actualiza el volumen del masterGain en tiempo real.
   * Permite cambiar el volumen sin interrumpir la reproducción.
   * 
   * @param {number} volumePercent - Volumen de 0 a 100
   */
  setVolume(volumePercent) {
    if (this.masterGain) {
      // Pequeño ramp para evitar clicks al cambiar el volumen
      this.masterGain.gain.linearRampToValueAtTime(
        volumePercent / 100,
        this.audioContext.currentTime + 0.05
      );
    }
  }
}
