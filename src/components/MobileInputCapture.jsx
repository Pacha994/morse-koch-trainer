import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

const VALID_INPUT_CHARS = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?/=');
const SENTINEL = '​';

const MobileInputCapture = forwardRef(function MobileInputCapture(
  { enabled, onChar, onBackspace, onConfirm, onPause },
  ref
) {
  const inputRef = useRef(null);
  const enabledRef = useRef(enabled);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (!inputRef.current) return;
      inputRef.current.value = SENTINEL;
      inputRef.current.focus();
    },
    blur: () => inputRef.current?.blur(),
  }));

  const handleChange = (e) => {
    const raw = e.target.value.replace(/​/g, '');
    const lastChar = raw.slice(-1).toUpperCase();
    if (lastChar && VALID_INPUT_CHARS.has(lastChar)) {
      onChar(lastChar);
    }
    e.target.value = SENTINEL;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); onConfirm(); }
    else if (e.key === 'Backspace') { e.preventDefault(); onBackspace(); }
    else if (e.key === 'Escape') { e.preventDefault(); onPause(); }
  };

  const handleBlur = () => {
    if (enabledRef.current) {
      setTimeout(() => {
        if (enabledRef.current && inputRef.current) {
          inputRef.current.value = SENTINEL;
          inputRef.current.focus();
        }
      }, 150);
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      autoCapitalize="characters"
      autoCorrect="off"
      autoComplete="off"
      spellCheck="false"
      inputMode="text"
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      style={{
        position: 'absolute',
        left: '-9999px',
        opacity: 0,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    />
  );
});

export default MobileInputCapture;
