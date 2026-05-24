import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

const VALID_INPUT_CHARS = new Set('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,?/=');

const MobileInputCapture = forwardRef(function MobileInputCapture(
  { enabled, onChar, onBackspace, onConfirm, onPause },
  ref
) {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
  }));

  useEffect(() => { inputRef.current?.blur(); }, []);

  useEffect(() => {
    if (!enabled && inputRef.current) {
      inputRef.current.blur();
    }
  }, [enabled]);

  const handleChange = (e) => {
    const raw = e.target.value.replace('​', '');
    const lastChar = raw.slice(-1).toUpperCase();
    if (lastChar && VALID_INPUT_CHARS.has(lastChar)) {
      onChar(lastChar);
    }
    e.target.value = '​';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); onConfirm(); }
    else if (e.key === 'Backspace') { e.preventDefault(); onBackspace(); }
    else if (e.key === 'Escape') { e.preventDefault(); onPause(); }
  };

  const handleBlur = () => {
    if (enabled) setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue="​"
      autoCapitalize="characters"
      autoCorrect="off"
      autoComplete="off"
      spellCheck="false"
      inputMode="text"
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    />
  );
});

export default MobileInputCapture;
