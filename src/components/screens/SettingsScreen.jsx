/**
 * SettingsScreen.jsx
 * ─────────────────────────────────────────────────────────────────
 * Pantalla de configuración completa.
 * Paridad funcional con IZ2UUF Morse Koch CW (Android).
 *
 * Controles según el PDF del Radio Club Córdoba:
 *  - Tipo de ejercicio: lista de opciones
 *  - WPM: slider con valor visible
 *  - Unidad de velocidad: WPM / CPM
 *  - Duración: opciones discretas (no slider continuo)
 *  - Longitud de grupo: Variable + opciones discretas
 *  - Koch level: lista de caracteres con código Morse
 *  - Hard letters: campo de texto libre + grilla de caracteres
 *  - Espaciado / Timing: opciones discretas
 *  - Audio: opciones discretas donde IZ2UUF las usa
 *  - Impresión del grupo + delay
 *  - Speech / TTS completo
 *  - Cadena personalizada
 * ─────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef } from 'react';
import { useSettings } from '../../context/SettingsContext.jsx';
import { G4FON_ORDER, LCWO_ORDER } from '../../constants/kochSequences.js';
import { MORSE_CODE } from '../../constants/morseCodes.js';
import {
  EXERCISE_TYPES,
  DURATION_OPTIONS,
  WORD_LENGTH_OPTIONS,
  START_PAUSE_OPTIONS,
  DOT_PITCH_OPTIONS,
  GROUP_PRINT_DELAY_OPTIONS,
  CHAR_SPACING_OPTIONS,
  WORD_SPACING_OPTIONS,
  DASH_DOT_RATIO_OPTIONS,
  SIDETONE_OPTIONS,
  TONE_ENVELOPE_OPTIONS,
  SPEECH_MODES,
  SPEECH_LANGS,
  SPEECH_TIMING_OPTIONS,
  FONT_SIZE_OPTIONS,
} from '../../constants/defaults.js';

// ─────────────────────────────────────────────────────────────────
// Componentes internos de UI
// ─────────────────────────────────────────────────────────────────

/**
 * Sección colapsable con título y línea separadora.
 */
function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="section-header-btn"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span
          className="section-header-title"
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: open ? 'var(--text-2)' : 'var(--text-3)',
            transition: 'color 0.12s',
          }}
        >
          {title}
        </span>
        <span style={{ color: 'var(--text-3)', fontSize: '10px' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div style={{ paddingBottom: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Fila de campo con label, hint opcional y control.
 */
function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{
        fontFamily: 'var(--font-ui)',
        fontSize: '13px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        color: 'var(--text-2)',
      }}>
        {label}
      </span>
      {hint && (
        <span style={{
          fontSize: '12px',
          color: 'var(--text-3)',
          lineHeight: 1.4,
        }}>
          {hint}
        </span>
      )}
      {children}
    </div>
  );
}

/**
 * Grilla de botones de opción (radio visual).
 * Cada opción tiene value y label.
 */
function OptionGrid({ options, value, onChange, columns = 3 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '6px',
    }}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`settings-opt-btn${active ? ' settings-opt-active' : ''}`}
            style={{
              padding: '10px 4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              fontWeight: active ? 700 : 400,
              // Activo: fondo azul sólido #1a6fc0, texto blanco (5.15:1 ✓ AA)
              // Inactivo: fondo transparente, borde #787878 visible (4.17:1 vs bg ✓)
              border: `1px solid ${active ? 'var(--amber)' : 'var(--border-2)'}`,
              borderRadius: '2px',
              background: active ? 'var(--amber)' : 'transparent',
              color: active ? '#ffffff' : 'var(--text-2)',
              cursor: 'pointer',
              textAlign: 'center',
              lineHeight: 1.3,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Toggle entre dos opciones (WPM / CPM).
 */
function Toggle({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`settings-opt-btn${active ? ' settings-opt-active' : ''}`}
            style={{
              flex: 1,
              padding: '11px 0',
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              border: `1px solid ${active ? 'var(--amber)' : 'var(--border-2)'}`,
              borderRadius: '2px',
              background: active ? 'var(--amber)' : 'transparent',
              color: active ? '#ffffff' : 'var(--text-2)',
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Slider de velocidad con valor visible en tiempo real.
 */
function SpeedSlider({ value, unit, onChange }) {
  const min = unit === 'cpm' ? 25 : 5;
  const max = unit === 'cpm' ? 300 : 60;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-3)', fontFamily: 'var(--font-ui)' }}>
          {min} {unit.toUpperCase()}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, color: 'var(--amber-text)' }}>
          {value} <span style={{ fontSize: '13px', fontWeight: 400 }}>{unit.toUpperCase()}</span>
        </span>
        <span style={{ fontSize: '13px', color: 'var(--text-3)', fontFamily: 'var(--font-ui)' }}>
          {max} {unit.toUpperCase()}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
}

/**
 * Koch level: lista de caracteres de la secuencia activa,
 * cada uno con su código Morse visible.
 * Se selecciona hasta qué carácter querés llegar.
 */
function KochLevelSelector({ sequence, level, onChange }) {
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: '2px',
      maxHeight: '260px',
      overflowY: 'auto',
    }}>
      {sequence.map((char, idx) => {
        const thisLevel = idx + 1;
        // Solo mostrar hasta nivel 2 como mínimo seleccionable
        const selectable = thisLevel >= 2;
        const isSelected = thisLevel === level;
        const isActive   = thisLevel <= level;

        return (
          <button
            key={char}
            onClick={() => selectable && onChange(thisLevel)}
            disabled={!selectable}
            className="koch-level-btn"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '9px 14px',
              background: isSelected
                ? 'var(--amber)'
                : isActive
                  ? 'var(--surface)'
                  : 'var(--bg)',
              borderBottom: '1px solid var(--border)',
              border: 'none',
              borderBottom: idx < sequence.length - 1 ? '1px solid var(--border)' : 'none',
              cursor: selectable ? 'pointer' : 'default',
              textAlign: 'left',
              opacity: selectable ? 1 : 0.35,
            }}
          >
            {/* Indicador visual de seleccionado */}
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              flexShrink: 0,
              background: isSelected
                ? 'rgba(255,255,255,0.9)'
                : isActive
                  ? 'var(--border-2)'
                  : 'transparent',
              border: `1px solid ${isSelected ? 'rgba(255,255,255,0.9)' : isActive ? 'var(--amber)' : 'var(--border-2)'}`,
            }} />

            {/* Número de nivel */}
            <span style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '11px',
              color: isSelected ? 'rgba(255,255,255,0.7)' : 'var(--text-3)',
              width: '18px',
              flexShrink: 0,
            }}>
              {thisLevel}
            </span>

            {/* Carácter */}
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '16px',
              fontWeight: 700,
              color: isSelected
                ? 'rgba(255,255,255,1)'
                : isActive
                  ? 'var(--text-1)'
                  : 'var(--text-3)',
              width: '20px',
              flexShrink: 0,
            }}>
              {char}
            </span>

            {/* Código Morse */}
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '14px',
              letterSpacing: '0.12em',
              color: isSelected
                ? 'rgba(255,255,255,0.85)'
                : 'var(--text-3)',
            }}>
              {MORSE_CODE[char] ?? ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Hard letters:
 *  - Campo de texto libre: escribís las letras que querés marcar
 *  - Grilla de todos los caracteres del nivel activo para seleccionar con click
 * Ambos controles están sincronizados.
 */
function HardLettersEditor({ activeChars, hardLetters, onChange }) {
  const inputRef = useRef(null);

  // Construir string de display desde el array
  const displayText = hardLetters.join('');

  // Cuando el usuario edita el campo de texto, parsear las letras válidas
  function handleTextChange(e) {
    const raw = e.target.value.toUpperCase();
    // Solo conservar caracteres que estén en activeChars, sin duplicados
    const parsed = [...new Set(raw.split('').filter(c => activeChars.includes(c)))];
    onChange(parsed);
  }

  // Toggle individual desde la grilla
  function toggleChar(char) {
    if (hardLetters.includes(char)) {
      onChange(hardLetters.filter(c => c !== char));
    } else {
      onChange([...hardLetters, char]);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Campo de texto libre */}
      <input
        ref={inputRef}
        type="text"
        value={displayText}
        onChange={handleTextChange}
        placeholder="Escribí las letras que querés practicar más (ej: K M R)"
        style={{
          padding: '10px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '18px',
          fontWeight: 600,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          background: 'var(--surface-2)',
          border: '1px solid var(--border-2)',
          borderRadius: '2px',
          color: 'var(--amber-text)',
          outline: 'none',
          width: '100%',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--amber)'}
        onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
      />

      {/* Grilla de todos los caracteres activos */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
        {activeChars.map(char => {
          const isHard = hardLetters.includes(char);
          return (
            <button
              key={char}
              onClick={() => toggleChar(char)}
              title={MORSE_CODE[char] ?? ''}
              className={`hard-letter-btn${isHard ? ' hard-letter-active' : ''}`}
              style={{
                width: '38px',
                height: '38px',
                fontFamily: 'var(--font-mono)',
                fontSize: '15px',
                fontWeight: 700,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '2px',
                border: `1px solid ${isHard ? 'var(--amber)' : 'var(--border)'}`,
                background: isHard ? 'var(--amber)' : 'var(--surface-2)',
                color: isHard ? '#ffffff' : 'var(--btn-inactive-text, #c8c8c8)',
                cursor: 'pointer',
              }}
            >
              {char}
            </button>
          );
        })}
      </div>
      <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>
        Los caracteres marcados aparecen con frecuencia ~3× mayor durante el ejercicio.
      </span>
    </div>
  );
}

/**
 * Checkbox con label y hint inline.
 */
function CheckboxField({ label, hint, checked, onChange }) {
  return (
    <label style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      cursor: 'pointer',
      padding: '10px 12px',
      background: 'var(--surface)',
      borderRadius: '2px',
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ marginTop: '2px', flexShrink: 0 }}
      />
      <div>
        <div style={{ fontSize: '14px', fontFamily: 'var(--font-ui)', color: 'var(--text-1)' }}>
          {label}
        </div>
        {hint && (
          <div style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '2px' }}>
            {hint}
          </div>
        )}
      </div>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────
// Pantalla principal
// ─────────────────────────────────────────────────────────────────

export function SettingsScreen({ onClose }) {
  const { settings, updateSetting, resetToDefaults } = useSettings();

  // Secuencia Koch activa según el tipo de ejercicio
  const activeSequence = settings.exerciseType === 'koch_lcwo' ? LCWO_ORDER : G4FON_ORDER;
  const activeChars    = activeSequence.slice(0, settings.kochLevel);

  // ¿El tipo de ejercicio requiere cadena personalizada?
  const needsCustomString = [
    'koch_custom', 'custom_string', 'words_custom',
    'words_custom_g4fon', 'words_custom_lcwo',
  ].includes(settings.exerciseType);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header — mismo alto y estructura que HomeScreen ─────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        height: '52px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        flexShrink: 0,
      }}>
        {/* Solo título — sin logo en pantallas secundarias */}
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: '14px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-1)', lineHeight: 1 }}>
            Configuración
          </div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--text-3)', letterSpacing: '0.06em' }}>
            LU4HH - Radio Club Córdoba
          </div>
        </div>
        {/* Acciones */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-ghost"
            onClick={() => { if (confirm('¿Restaurar todos los valores por defecto?')) resetToDefaults(); }}
          >
            Resetear
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            ← Volver
          </button>
        </div>
      </header>

      {/* ── Contenido scrolleable con max-width ─────────────────── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0 24px',
        maxWidth: '640px',
        width: '100%',
        margin: '0 auto',
      }}>

        {/* ══ 1. EJERCICIO ══════════════════════════════════════ */}
        <Section title="Ejercicio" defaultOpen>

          <Field label="Tipo de ejercicio">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {EXERCISE_TYPES.map(opt => {
                const active = opt.value === settings.exerciseType;
                return (
                  <button
                    key={opt.value}
                    onClick={() => updateSetting('exerciseType', opt.value)}
                    className={`settings-opt-btn${active ? ' settings-opt-active' : ''}`}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontFamily: 'var(--font-ui)',
                      fontSize: '14px',
                      border: `1px solid ${active ? 'var(--amber)' : 'var(--border)'}`,
                      borderRadius: '2px',
                      background: active ? 'var(--amber)' : 'transparent',
                      color: active ? '#ffffff' : 'var(--text-2)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                      background: active ? 'var(--amber-text)' : 'transparent',
                      border: `1px solid ${active ? 'var(--amber)' : 'var(--border-2)'}`,
                    }} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Cadena personalizada — solo si el ejercicio la requiere */}
          {needsCustomString && (
            <Field
              label="Cadena personalizada"
              hint="Texto libre. Prosigns con corchetes: <AR> <SK> <BT>. Comentarios entre llaves: {ignorado}."
            >
              <textarea
                value={settings.customString}
                onChange={e => updateSetting('customString', e.target.value)}
                rows={5}
                placeholder="A B C D E F G H I J K L M N O P Q R S T U V W X Y Z&#10;1 2 3 4 5 6 7 8 9 0 ? / = . ,&#10;<AR> <SK> <BT> <KN>"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '15px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border-2)',
                  borderRadius: '2px',
                  color: 'var(--text-1)',
                  resize: 'vertical',
                  outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--amber)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
              />
            </Field>
          )}

        </Section>

        {/* ══ 2. VELOCIDAD ══════════════════════════════════════ */}
        <Section title="Velocidad">

          <Field label="Unidad de velocidad">
            <Toggle
              options={[{ value: 'wpm', label: 'WPM' }, { value: 'cpm', label: 'CPM' }]}
              value={settings.speedUnit}
              onChange={v => updateSetting('speedUnit', v)}
            />
          </Field>

          <Field label="Velocidad">
            <SpeedSlider
              value={settings.speedValue}
              unit={settings.speedUnit}
              onChange={v => updateSetting('speedValue', v)}
            />
          </Field>

        </Section>

        {/* ══ 3. SESIÓN ══════════════════════════════════════════ */}
        <Section title="Sesión">

          <Field label="Duración del ejercicio">
            <OptionGrid
              options={DURATION_OPTIONS}
              value={settings.exerciseDuration}
              onChange={v => updateSetting('exerciseDuration', v)}
              columns={4}
            />
          </Field>

          <Field
            label="Longitud de grupo"
            hint="Variable: grupos aleatorios entre 1 y 5 caracteres."
          >
            <OptionGrid
              options={WORD_LENGTH_OPTIONS}
              value={settings.wordLength}
              onChange={v => updateSetting('wordLength', v)}
              columns={3}
            />
          </Field>

          <Field label="Pausa inicial">
            <OptionGrid
              options={START_PAUSE_OPTIONS}
              value={settings.startPause}
              onChange={v => updateSetting('startPause', v)}
              columns={5}
            />
          </Field>

        </Section>

        {/* ══ 4. NIVEL KOCH ══════════════════════════════════════ */}
        <Section title="Nivel Koch">

          <Field
            label={`Nivel ${settings.kochLevel} — ${activeChars.length} carácter${activeChars.length !== 1 ? 'es' : ''} activo${activeChars.length !== 1 ? 's' : ''}`}
            hint="Seleccioná hasta qué carácter de la secuencia querés practicar."
          >
            <KochLevelSelector
              sequence={activeSequence}
              level={settings.kochLevel}
              onChange={v => updateSetting('kochLevel', v)}
            />
          </Field>

          <Field label="Hard letters" hint="Aparecen ~3× más seguido en el ejercicio.">
            <HardLettersEditor
              activeChars={activeChars}
              hardLetters={settings.hardLetters}
              onChange={v => updateSetting('hardLetters', v)}
            />
          </Field>

          <CheckboxField
            label="Auto hard letters"
            hint="Los últimos 2 caracteres del nivel actual siempre son hard."
            checked={settings.autoHardLetters}
            onChange={v => updateSetting('autoHardLetters', v)}
          />

        </Section>

        {/* ══ 5. TIMING / FARNSWORTH ═════════════════════════════ */}
        <Section title="Timing / Farnsworth">

          <Field
            label="Espaciado entre caracteres"
            hint="Multiplica el silencio entre cada carácter. 1.0 = estándar ITU."
          >
            <OptionGrid
              options={CHAR_SPACING_OPTIONS}
              value={settings.charSpacing}
              onChange={v => updateSetting('charSpacing', v)}
              columns={3}
            />
          </Field>

          <Field
            label="Espacio entre palabras"
            hint="Independiente del espaciado entre caracteres."
          >
            <OptionGrid
              options={WORD_SPACING_OPTIONS}
              value={settings.wordSpacing}
              onChange={v => updateSetting('wordSpacing', v)}
              columns={3}
            />
          </Field>

          <Field label="Relación tablero / punto" hint="Duración del dash respecto al dit. Estándar ITU = 3.0.">
            <OptionGrid
              options={DASH_DOT_RATIO_OPTIONS}
              value={settings.dashDotRatio}
              onChange={v => updateSetting('dashDotRatio', v)}
              columns={3}
            />
          </Field>

        </Section>

        {/* ══ 6. AUDIO ═══════════════════════════════════════════ */}
        <Section title="Audio">

          <Field label="Frecuencia sidetone (Hz)">
            <OptionGrid
              options={SIDETONE_OPTIONS}
              value={settings.sidetoneFrequency}
              onChange={v => updateSetting('sidetoneFrequency', v)}
              columns={4}
            />
          </Field>

          <Field
            label="Campo de puntos (dot pitch)"
            hint="Frecuencia relativa de los dots respecto al sidetone."
          >
            <OptionGrid
              options={DOT_PITCH_OPTIONS}
              value={settings.dotPitch}
              onChange={v => updateSetting('dotPitch', v)}
              columns={2}
            />
          </Field>

          <Field label="Ataque de tono (ms)" hint="Fade-in al inicio de cada elemento.">
            <OptionGrid
              options={TONE_ENVELOPE_OPTIONS}
              value={settings.toneAttack}
              onChange={v => updateSetting('toneAttack', v)}
              columns={4}
            />
          </Field>

          <Field label="Liberación de tono (ms)" hint="Fade-out al final de cada elemento.">
            <OptionGrid
              options={TONE_ENVELOPE_OPTIONS}
              value={settings.toneRelease}
              onChange={v => updateSetting('toneRelease', v)}
              columns={4}
            />
          </Field>

          <Field label="Volumen">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={settings.volume}
                onChange={e => updateSetting('volume', parseInt(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--amber-text)',
                minWidth: '42px',
                textAlign: 'right',
              }}>
                {settings.volume}%
              </span>
            </div>
          </Field>

        </Section>

        {/* ══ 7. DISPLAY ═════════════════════════════════════════ */}
        <Section title="Display">

          <CheckboxField
            label="Impresión del grupo"
            hint="Las letras enviadas aparecen solo al final del grupo (head copy)."
            checked={settings.groupPrint}
            onChange={v => updateSetting('groupPrint', v)}
          />

          {settings.groupPrint && (
            <Field
              label="Retraso de impresión grupal"
              hint="Pausa entre el fin del audio y la aparición del texto."
            >
              <OptionGrid
                options={GROUP_PRINT_DELAY_OPTIONS}
                value={settings.groupPrintDelay}
                onChange={v => updateSetting('groupPrintDelay', v)}
                columns={3}
              />
            </Field>
          )}

          <Field label="Tamaño de fuente">
            <OptionGrid
              options={FONT_SIZE_OPTIONS}
              value={settings.fontSize}
              onChange={v => updateSetting('fontSize', v)}
              columns={4}
            />
          </Field>

          <CheckboxField
            label="Mantener pantalla encendida"
            hint="Evita que la pantalla se apague durante el ejercicio."
            checked={settings.keepScreenOn}
            onChange={v => updateSetting('keepScreenOn', v)}
          />

        </Section>

        {/* ══ 8. VOZ (TTS) ═══════════════════════════════════════ */}
        <Section title="Voz / Text-to-Speech">

          {/* Toggle: deletreo fonético ITU al mostrar resultado */}
          <Field label="Deletreo fonético ITU">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: '13px', color: 'var(--text-2)', marginBottom: '2px' }}>
                  Leer resultado en voz
                </div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: '11px', color: 'var(--text-3)' }}>
                  "KMMKM" → Kilo. Mike. Mike. Kilo. Mike.
                </div>
              </div>
              <button
                onClick={() => updateSetting('phoneticReadout', !settings.phoneticReadout)}
                style={{
                  flexShrink: 0,
                  marginLeft: '16px',
                  width: '44px',
                  height: '24px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  background: settings.phoneticReadout ? 'var(--green)' : 'var(--border-2)',
                  position: 'relative',
                  transition: 'background 0.2s',
                }}
                aria-label="Toggle deletreo fonético"
              >
                <span style={{
                  position: 'absolute',
                  top: '3px',
                  left: settings.phoneticReadout ? '23px' : '3px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'white',
                  transition: 'left 0.2s',
                  display: 'block',
                }} />
              </button>
            </div>
          </Field>

          <Field label="Modo de voz">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {SPEECH_MODES.map(opt => {
                const active = opt.value === settings.speechMode;
                return (
                  <button
                    key={opt.value}
                    onClick={() => updateSetting('speechMode', opt.value)}
                    className={`settings-opt-btn${active ? ' settings-opt-active' : ''}`}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontFamily: 'var(--font-ui)',
                      fontSize: '14px',
                      border: `1px solid ${active ? 'var(--amber)' : 'var(--border)'}`,
                      borderRadius: '2px',
                      background: active ? 'var(--amber)' : 'transparent',
                      color: active ? '#ffffff' : 'var(--text-2)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                      background: active ? 'var(--amber-text)' : 'transparent',
                      border: `1px solid ${active ? 'var(--amber)' : 'var(--border-2)'}`,
                    }} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {settings.speechMode !== 'none' && (
            <>
              <Field label="Idioma Text-to-Speech">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {SPEECH_LANGS.map(opt => {
                    const active = opt.value === settings.speechLang;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => updateSetting('speechLang', opt.value)}
                        className={`settings-opt-btn${active ? ' settings-opt-active' : ''}`}
                        style={{
                          padding: '9px 14px',
                          textAlign: 'left',
                          fontFamily: 'var(--font-ui)',
                          fontSize: '14px',
                          border: `1px solid ${active ? 'var(--amber)' : 'var(--border)'}`,
                          borderRadius: '2px',
                          background: active ? 'var(--amber)' : 'transparent',
                          color: active ? '#ffffff' : 'var(--text-2)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <div style={{
                          width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                          background: active ? 'var(--amber-text)' : 'transparent',
                          border: `1px solid ${active ? 'var(--amber)' : 'var(--border-2)'}`,
                        }} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Tiempo antes de hablar" hint="Pausa entre el último tono CW y la voz.">
                <OptionGrid
                  options={SPEECH_TIMING_OPTIONS}
                  value={settings.timeBeforeSpeech}
                  onChange={v => updateSetting('timeBeforeSpeech', v)}
                  columns={3}
                />
              </Field>

              <Field label="Tiempo después de hablar" hint="Pausa después de la voz antes del siguiente grupo.">
                <OptionGrid
                  options={SPEECH_TIMING_OPTIONS}
                  value={settings.timeAfterSpeech}
                  onChange={v => updateSetting('timeAfterSpeech', v)}
                  columns={3}
                />
              </Field>
            </>
          )}

        </Section>

        {/* Footer */}
        <div style={{ padding: '32px 0 24px', textAlign: 'center', color: 'var(--text-3)', fontFamily: 'var(--font-ui)', fontSize: '12px' }}>
          Morse Koch Trainer — LU4HH - Radio Club Córdoba
        </div>

      </div>
    </div>
  );
}
