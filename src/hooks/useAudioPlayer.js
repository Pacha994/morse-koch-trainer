/**
 * useAudioPlayer.js
 * ─────────────────────────────────────────────────────────────────
 * Hook que encapsula la clase MorsePlayer para uso desde componentes React.
 * 
 * ── Por qué un hook y no usar la clase directamente ─────────────
 * La clase MorsePlayer maneja AudioContext, que requiere:
 *   1. Crearse solo tras interacción del usuario (política autoplay)
 *   2. Destruirse al desmontar el componente (cleanup de recursos)
 *   3. Estado de "reproduciendo" que React necesita conocer para la UI
 * 
 * El hook centraliza todo esto y expone una API simple y reactiva.
 * 
 * ── Estado de reproducción ───────────────────────────────────────
 * El hook trackea si hay audio reproduciéndose para que la UI pueda:
 *   - Mostrar indicador visual de audio activo
 *   - Deshabilitar el botón de "siguiente" mientras suena
 *   - Actualizar la barra de progreso
 * ─────────────────────────────────────────────────────────────────
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { MorsePlayer } from '../audio/MorsePlayer.js';

/**
 * @returns {{
 *   isPlaying:   boolean,      ¿Está reproduciéndose audio en este momento?
 *   playGroup:   Function,     Reproduce un grupo y retorna Promise
 *   stop:        Function,     Detiene la reproducción inmediatamente
 *   initAudio:   Function,     Inicializa el AudioContext (requiere evento de usuario)
 *   isReady:     boolean,      ¿El AudioContext está inicializado?
 * }}
 */
export function useAudioPlayer() {
  // Referencia estable al player (no se recrea en cada render)
  const playerRef = useRef(null);

  // Estado reactivo para que la UI se actualice cuando cambia
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady,   setIsReady]   = useState(false);

  // ── Inicialización y cleanup ───────────────────────────────

  // Crear el player una sola vez al montar el hook
  useEffect(() => {
    playerRef.current = new MorsePlayer();

    // Cleanup al desmontar: liberar AudioContext para evitar memory leaks
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  // ── API pública ────────────────────────────────────────────

  /**
   * Inicializa el AudioContext.
   * DEBE llamarse desde un event handler de usuario (click, keydown, etc.)
   * Los browsers bloquean AudioContext creados sin interacción del usuario.
   */
  const initAudio = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.init();
      setIsReady(true);
    }
  }, []);

  /**
   * Reproduce un grupo de caracteres Morse.
   * 
   * @param {string} group    - Grupo de caracteres (ej: "KMRS")
   * @param {object} settings - Settings completos de la sesión
   * @returns {Promise<void>}   Se resuelve cuando termina el audio
   */
  const playGroup = useCallback(async (group, settings) => {
    const player = playerRef.current;
    if (!player) return;

    // Asegurar que el AudioContext esté activo
    player.init();
    setIsReady(true);
    setIsPlaying(true);

    try {
      const { promise } = player.playGroup(group, settings);
      await promise;
    } finally {
      // Siempre marcar como no-reproduciendo, incluso si hubo un error
      setIsPlaying(false);
    }
  }, []);

  /**
   * Detiene toda reproducción inmediatamente.
   */
  const stop = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.stop();
    }
    setIsPlaying(false);
  }, []);

  return {
    isPlaying,
    isReady,
    playGroup,
    stop,
    initAudio,
  };
}
