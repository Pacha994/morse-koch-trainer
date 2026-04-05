/**
 * useKeyboardInput.js
 * ─────────────────────────────────────────────────────────────────
 * Hook que captura el input del teclado durante una sesión de entrenamiento.
 *
 * ── Diseño ────────────────────────────────────────────────────────
 * Este hook es STATELESS: no acumula texto propio. Solo dispara callbacks
 * por cada tecla relevante. El estado del input vive exclusivamente en
 * useTrainingSession, que lo resetea a '' al inicio de cada grupo.
 *
 * Esto evita la race condition que existía cuando dos estados paralelos
 * (uno en este hook, otro en useTrainingSession) se desincronizaban al
 * cambiar de grupo: el sync kbText→setInputText sobreescribía el reset.
 *
 * Durante la sesión NO se usa un <input> HTML estándar porque:
 *   1. El <input> puede perder el foco fácilmente
 *   2. Queremos capturar teclas globalmente (desde cualquier parte de la pantalla)
 *   3. Necesitamos shortcuts especiales (Escape = pausa, R = repetir, etc.)
 *
 * ── Caracteres válidos ────────────────────────────────────────────
 * Solo se capturan caracteres que son parte del alfabeto Morse:
 *   A-Z, 0-9, puntuación válida (.,?/=)
 * El resto se ignora silenciosamente.
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect } from 'react';

// Caracteres válidos que el usuario puede tipear como respuesta
const VALID_INPUT_CHARS = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?/=');

/**
 * Hook de captura de teclado para sesiones de entrenamiento.
 *
 * @param {object}   options
 * @param {boolean}  options.enabled       - ¿Está activa la captura? (false cuando está pausado, etc.)
 * @param {Function} options.getInputText  - Getter que devuelve el inputText actual (evita stale closure)
 * @param {Function} options.onChar        - Callback cuando el usuario tipea un carácter válido: (char) => void
 * @param {Function} options.onBackspace   - Callback cuando el usuario presiona Backspace
 * @param {Function} options.onConfirm     - Callback cuando el usuario confirma (Enter/Space)
 * @param {Function} options.onPause       - Callback cuando el usuario pausa (Escape)
 * @param {Function} options.onRepeat      - Callback cuando el usuario quiere repetir (R con input vacío)
 */
export function useKeyboardInput({ enabled = true, getInputText, onChar, onBackspace, onConfirm, onPause, onRepeat }) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e) {
      // Ignorar eventos con modificadores (Ctrl+C, Alt+Tab, etc.)
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // Ignorar eventos que vienen de inputs/textareas (settings screen, etc.)
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) return;

      const key = e.key;

      // ── Confirmar respuesta ──────────────────────────────────
      if (key === 'Enter' || key === ' ') {
        e.preventDefault(); // Evitar scroll en Space
        onConfirm?.();
        return;
      }

      // ── Borrar último carácter ───────────────────────────────
      if (key === 'Backspace') {
        e.preventDefault();
        onBackspace?.();
        return;
      }

      // ── Pausar / Resumir ─────────────────────────────────────
      if (key === 'Escape') {
        e.preventDefault();
        onPause?.();
        return;
      }

      // ── Repetir grupo ────────────────────────────────────────
      // Convención IZ2UUF: R dispara "repetir" SOLO si el input está vacío.
      // Si el usuario ya empezó a tipear, R se agrega al input normalmente.
      // Usamos getInputText() para leer el valor actual sin stale closure.
      if (key === 'r' || key === 'R') {
        if ((getInputText?.() ?? '') === '') {
          onRepeat?.();
          return; // R como shortcut: no agregar al input
        }
        // Si hay texto, R cae al handler normal de abajo (se agrega al input)
      }

      // ── Input de respuesta ───────────────────────────────────
      // Agregar el carácter si es un char válido de Morse
      if (key.length === 1) {
        const upper = key.toUpperCase();
        if (VALID_INPUT_CHARS.has(upper)) {
          onChar?.(upper);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, getInputText, onChar, onBackspace, onConfirm, onPause, onRepeat]);
}
