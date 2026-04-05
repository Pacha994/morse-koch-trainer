/**
 * useKeyboardInput.js
 * Hook stateless — solo dispara callbacks por tecla. No acumula estado.
 * El estado del input vive exclusivamente en useTrainingSession.
 */

import { useEffect } from 'react';

const VALID_INPUT_CHARS = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?/=');

export function useKeyboardInput({ enabled = true, onChar, onBackspace, onConfirm, onPause, onRepeat, getInputText }) {
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

      // R dispara "repetir" SOLO si el input está vacío
      if (key === 'r' || key === 'R') {
        const currentText = getInputText?.() ?? '';
        if (currentText === '') {
          onRepeat?.();
          return;
        }
        // Si hay texto, cae al handler normal (se agrega al input)
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
  }, [enabled, onChar, onBackspace, onConfirm, onPause, onRepeat, getInputText]);
}
