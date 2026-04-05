/**
 * useKeyboardInput.js
 * ─────────────────────────────────────────────────────────────────
 * Hook que captura el input del teclado durante una sesión de entrenamiento.
 * 
 * ── Diseño ────────────────────────────────────────────────────────
 * Durante la sesión, la pantalla de entrenamiento NO usa un <input> HTML
 * estándar porque:
 *   1. El <input> puede perder el foco fácilmente
 *   2. Queremos capturar teclas globalmente (desde cualquier parte de la pantalla)
 *   3. Necesitamos shortcuts especiales (Escape = pausa, R = repetir, etc.)
 * 
 * En su lugar, escuchamos eventos de teclado a nivel de ventana y
 * construimos el string de respuesta manualmente.
 * 
 * ── Caracteres válidos ────────────────────────────────────────────
 * Solo se capturan caracteres que son parte del alfabeto Morse:
 *   A-Z, 0-9, puntuación válida (.,?/=)
 * El resto se ignora silenciosamente.
 * ─────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Caracteres válidos que el usuario puede tipear como respuesta
const VALID_INPUT_CHARS = new Set(
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?/='
);

/**
 * Hook de captura de teclado para sesiones de entrenamiento.
 * 
 * @param {object} options
 * @param {boolean} options.enabled         - ¿Está activa la captura? (false cuando está pausado, etc.)
 * @param {Function} options.onConfirm      - Callback cuando el usuario confirma (Enter/Space)
 * @param {Function} options.onPause        - Callback cuando el usuario pausa (Escape)
 * @param {Function} options.onRepeat       - Callback cuando el usuario quiere repetir (R)
 * 
 * @returns {{
 *   inputText:  string,    Texto tipeado hasta ahora
 *   clearInput: Function,  Limpiar el input (llamar después de confirmar)
 *   setInput:   Function,  Setear el input programáticamente
 * }}
 */
export function useKeyboardInput({ enabled = true, onConfirm, onPause, onRepeat }) {
  const [inputText, setInputText] = useState('');

  // Ref paralela para leer el valor actual desde dentro de los event listeners
  // sin stale closure (el listener no se recrea cuando inputText cambia).
  const inputTextRef = useRef('');
  useEffect(() => { inputTextRef.current = inputText; }, [inputText]);

  const clearInput = useCallback(() => {
    setInputText('');
    inputTextRef.current = '';
  }, []);

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
        setInputText(prev => prev.slice(0, -1));
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
      // Usamos inputTextRef para evitar stale closure — el listener no se
      // recrea cuando inputText cambia, así que no podemos leer el estado
      // directamente desde aquí.
      if (key === 'r' || key === 'R') {
        if (inputTextRef.current === '') {
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
          setInputText(prev => prev + upper);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onConfirm, onPause, onRepeat]);

  return { inputText, clearInput, setInput: setInputText };
}
