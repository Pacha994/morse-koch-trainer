/**
 * useKeyboardInput.js
 * ─────────────────────────────────────────────────────────────────
 * Hook que captura el input del teclado durante una sesión de entrenamiento.
 * 
 * DISEÑO: este hook NO mantiene estado de input. Solo dispara callbacks
 * por cada tecla relevante. El estado del input vive en useTrainingSession.
 * Esto evita la race condition de tener dos estados paralelos sincronizados.
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from 'react';

const VALID_INPUT_CHARS = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?/=');

export function useKeyboardInput({ enabled = true, onChar, onBackspace, onConfirm, onPause, onRepeat, inputTextRef }) {
  // Ref para saber si el input está vacío (para la lógica de R)
  // Usamos inputTextRef del caller para evitar stale closure.

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e) {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) return;

      const key = e.key;

      if (key === 'Enter' || key === ' ') {
        e.preventDefault();
        onConfirm?.();
        return;
      }

      if (key === 'Backspace') {
        e.preventDefault();
        onBackspace?.();
        return;
      }

      if (key === 'Escape') {
        e.preventDefault();
        onPause?.();
        return;
      }

      if (key === 'r' || key === 'R') {
        // R dispara "repetir" SOLO si el input está vacío
        const currentText = inputTextRef?.current ?? '';
        if (currentText === '') {
          onRepeat?.();
          return;
        }
        // Si hay texto, cae al handler normal
      }

      if (key.length === 1) {
        const upper = key.toUpperCase();
        if (VALID_INPUT_CHARS.has(upper)) {
          onChar?.(upper);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onChar, onBackspace, onConfirm, onPause, onRepeat, inputTextRef]);
}
