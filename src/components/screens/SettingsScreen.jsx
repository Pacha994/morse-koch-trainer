/**
 * SettingsScreen.jsx
 * Panel de configuración con todos los parámetros de la app.
 * Organizado en secciones colapsables para no abrumar al usuario.
 */
import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext.jsx';
import { G4FON_ORDER, LCWO_ORDER } from '../../constants/kochSequences.js';

// ── Sección colapsable ─────────────────────────────────────────────
function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className="border-b"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <button
        className="w-full flex items-center justify-between px-6 py-4 text-left"
        onClick={() => setOpen(o => !o)}
        style={{ background: 'var(--color-surface)' }}
      >
        <span
          className="font-ui text-sm font-semibold tracking-widest uppercase"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {title}
        </span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div
          className="px-6 pb-6 pt-4 space-y-5"
          style={{ background: 'var(--color-bg)' }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ── Fila de setting individual ─────────────────────────────────────
function SettingRow({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="font-ui text-sm font-medium"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {label}
      </label>
      {hint && (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

// ── Slider con valor numérico mostrado ─────────────────────────────
function SliderSetting({ value, min, max, step = 1, onChange, unit = '' }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
        className="flex-1"
      />
      <span
        className="font-mono text-sm w-16 text-right flex-shrink-0"
        style={{ color: 'var(--color-accent)' }}
      >
        {value}{unit}
      </span>
    </div>
  );
}

/**
 * @param {object}   props
 * @param {Function} props.onClose - Cerrar settings y volver a home
 */
export function SettingsScreen({ onClose }) {
  const { settings, updateSetting, resetToDefaults } = useSettings();

  // Secuencia activa según el tipo de ejercicio
  const activeSequence = settings.exerciseType === 'koch_lcwo' ? LCWO_ORDER : G4FON_ORDER;
  const maxLevel       = activeSequence.length;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--color-bg)' }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10"
        style={{
          borderColor: 'var(--color-border)',
          background:  'var(--color-surface)',
        }}
      >
        <h1
          className="font-ui text-xl font-bold tracking-widest uppercase"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Configuración
        </h1>
        <div className="flex gap-2">
          <button
            className="btn-ghost text-xs"
            onClick={() => { if (confirm('¿Restaurar todos los valores por defecto?')) resetToDefaults(); }}
          >
            Resetear
          </button>
          <button className="btn-secondary" onClick={onClose}>
            ← Volver
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── 1. Ejercicio ────────────────────────────────── */}
        <Section title="Ejercicio" defaultOpen>

          <SettingRow label="Tipo de ejercicio">
            <select
              value={settings.exerciseType}
              onChange={e => updateSetting('exerciseType', e.target.value)}
              className="w-full"
              style={{
                background: 'var(--color-surface-2)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-2)',
                padding: '0.5rem',
                fontFamily: 'var(--font-ui)',
                fontSize: '0.95rem',
              }}
            >
              <option value="koch_g4fon">Koch — Secuencia G4FON</option>
              <option value="koch_lcwo">Koch — Secuencia LCWO</option>
            </select>
          </SettingRow>

          <SettingRow
            label={`Nivel Koch: ${settings.kochLevel} caracteres`}
            hint={`Caracteres activos: ${activeSequence.slice(0, settings.kochLevel).join(' ')}`}
          >
            <SliderSetting
              value={settings.kochLevel}
              min={2}
              max={maxLevel}
              onChange={v => updateSetting('kochLevel', v)}
            />
          </SettingRow>

          {/* Hard letters selector */}
          <SettingRow label="Hard letters manuales" hint="Aparecen ~3x más frecuente">
            <div className="flex flex-wrap gap-1.5 mt-1">
              {activeSequence.slice(0, settings.kochLevel).map(char => {
                const isHard = settings.hardLetters.includes(char);
                return (
                  <button
                    key={char}
                    onClick={() => {
                      const current = settings.hardLetters;
                      updateSetting(
                        'hardLetters',
                        isHard ? current.filter(c => c !== char) : [...current, char]
                      );
                    }}
                    className="morse-text font-mono text-sm px-2 py-1 rounded-sm border transition-all"
                    style={{
                      background:  isHard ? 'var(--color-accent-dim)' : 'var(--color-surface-2)',
                      borderColor: isHard ? 'var(--color-accent)' : 'var(--color-border)',
                      color:       isHard ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    }}
                  >
                    {char}
                  </button>
                );
              })}
            </div>
          </SettingRow>

          <SettingRow label="Auto hard letters" hint="Los últimos 2 del nivel actual siempre son hard">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoHardLetters}
                onChange={e => updateSetting('autoHardLetters', e.target.checked)}
              />
              <span className="font-ui text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Activado
              </span>
            </label>
          </SettingRow>
        </Section>

        {/* ── 2. Velocidad ─────────────────────────────────── */}
        <Section title="Velocidad">
          <SettingRow label="Unidad de velocidad">
            <div className="flex gap-2">
              {['wpm', 'cpm'].map(unit => (
                <button
                  key={unit}
                  onClick={() => updateSetting('speedUnit', unit)}
                  className="flex-1 py-2 font-ui text-sm font-bold tracking-widest uppercase rounded-sm border transition-all"
                  style={{
                    background:  settings.speedUnit === unit ? 'var(--color-accent)' : 'var(--color-surface-2)',
                    borderColor: settings.speedUnit === unit ? 'var(--color-accent)' : 'var(--color-border)',
                    color:       settings.speedUnit === unit ? '#000' : 'var(--color-text-muted)',
                  }}
                >
                  {unit.toUpperCase()}
                </button>
              ))}
            </div>
          </SettingRow>

          <SettingRow label={`Velocidad: ${settings.speedValue} ${settings.speedUnit.toUpperCase()}`}>
            <SliderSetting
              value={settings.speedValue}
              min={5}
              max={settings.speedUnit === 'cpm' ? 300 : 60}
              onChange={v => updateSetting('speedValue', v)}
              unit={` ${settings.speedUnit.toUpperCase()}`}
            />
          </SettingRow>
        </Section>

        {/* ── 3. Timing (Farnsworth) ───────────────────────── */}
        <Section title="Timing / Farnsworth">
          <SettingRow
            label={`Espacio entre caracteres: ${settings.charSpacing.toFixed(1)}×`}
            hint="1.0 = estándar. 2.0 = el doble de pausa entre caracteres"
          >
            <SliderSetting
              value={settings.charSpacing}
              min={0.5}
              max={5.0}
              step={0.1}
              onChange={v => updateSetting('charSpacing', v)}
              unit="×"
            />
          </SettingRow>

          <SettingRow
            label={`Espacio entre palabras: ${settings.wordSpacing.toFixed(1)}×`}
            hint="Independiente del espacio entre caracteres"
          >
            <SliderSetting
              value={settings.wordSpacing}
              min={0.5}
              max={5.0}
              step={0.1}
              onChange={v => updateSetting('wordSpacing', v)}
              unit="×"
            />
          </SettingRow>

          <SettingRow label={`Ratio dash/dot: ${settings.dashDotRatio.toFixed(1)}`} hint="Estándar ITU = 3.0">
            <SliderSetting
              value={settings.dashDotRatio}
              min={2.0}
              max={5.0}
              step={0.1}
              onChange={v => updateSetting('dashDotRatio', v)}
            />
          </SettingRow>
        </Section>

        {/* ── 4. Audio ─────────────────────────────────────── */}
        <Section title="Audio">
          <SettingRow label={`Frecuencia: ${settings.sidetoneFrequency} Hz`}>
            <SliderSetting
              value={settings.sidetoneFrequency}
              min={300}
              max={1200}
              step={10}
              onChange={v => updateSetting('sidetoneFrequency', v)}
              unit=" Hz"
            />
          </SettingRow>

          <SettingRow
            label={`Dot pitch: ${settings.dotPitch === 0 ? 'Desactivado' : `${settings.dotPitch} Hz`}`}
            hint="Si > 0, los dots suenan a esta frecuencia (separada de los dashes)"
          >
            <SliderSetting
              value={settings.dotPitch}
              min={0}
              max={1200}
              step={10}
              onChange={v => updateSetting('dotPitch', v)}
              unit={settings.dotPitch === 0 ? '' : ' Hz'}
            />
          </SettingRow>

          <SettingRow label={`Volumen: ${settings.volume}%`}>
            <SliderSetting
              value={settings.volume}
              min={0}
              max={100}
              onChange={v => updateSetting('volume', v)}
              unit="%"
            />
          </SettingRow>

          <div className="grid grid-cols-2 gap-4">
            <SettingRow label={`Attack: ${settings.toneAttack} ms`} hint="Fade-in del tono">
              <SliderSetting
                value={settings.toneAttack}
                min={1}
                max={50}
                onChange={v => updateSetting('toneAttack', v)}
                unit=" ms"
              />
            </SettingRow>
            <SettingRow label={`Release: ${settings.toneRelease} ms`} hint="Fade-out del tono">
              <SliderSetting
                value={settings.toneRelease}
                min={1}
                max={50}
                onChange={v => updateSetting('toneRelease', v)}
                unit=" ms"
              />
            </SettingRow>
          </div>
        </Section>

        {/* ── 5. Sesión ─────────────────────────────────────── */}
        <Section title="Sesión">
          <SettingRow
            label={`Duración: ${Math.floor(settings.exerciseDuration / 60)}:${String(settings.exerciseDuration % 60).padStart(2, '0')} min`}
          >
            <SliderSetting
              value={settings.exerciseDuration}
              min={30}
              max={1800}
              step={30}
              onChange={v => updateSetting('exerciseDuration', v)}
            />
          </SettingRow>

          <SettingRow label="Largo del grupo" hint="Caracteres por grupo Koch">
            <div className="flex items-center gap-3">
              <SliderSetting
                value={settings.wordLength}
                min={1}
                max={15}
                onChange={v => updateSetting('wordLength', v)}
              />
            </div>
          </SettingRow>

          <SettingRow label="Modo de largo">
            <div className="flex gap-2">
              {[
                { id: 'fixed',    label: 'Fijo' },
                { id: 'variable', label: 'Variable' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => updateSetting('wordLengthMode', opt.id)}
                  className="flex-1 py-2 font-ui text-sm font-bold tracking-widest uppercase rounded-sm border transition-all"
                  style={{
                    background:  settings.wordLengthMode === opt.id ? 'var(--color-accent)' : 'var(--color-surface-2)',
                    borderColor: settings.wordLengthMode === opt.id ? 'var(--color-accent)' : 'var(--color-border)',
                    color:       settings.wordLengthMode === opt.id ? '#000' : 'var(--color-text-muted)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </SettingRow>

          <SettingRow label={`Pausa inicial: ${settings.startPause}s`} hint="Segundos antes de empezar a transmitir">
            <SliderSetting
              value={settings.startPause}
              min={0}
              max={30}
              onChange={v => updateSetting('startPause', v)}
              unit="s"
            />
          </SettingRow>
        </Section>

        {/* ── 6. Display ─────────────────────────────────────── */}
        <Section title="Display">
          <SettingRow
            label="Group print"
            hint="Si está activo, los caracteres enviados aparecen solo al final del grupo (no uno a uno)"
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.groupPrint}
                onChange={e => updateSetting('groupPrint', e.target.checked)}
              />
              <span className="font-ui text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Mostrar al final del grupo
              </span>
            </label>
          </SettingRow>

          {settings.groupPrint && (
            <SettingRow
              label={`Delay de group print: ${settings.groupPrintDelay}s`}
              hint="Pausa entre fin del audio y la aparición del texto (head copy)"
            >
              <SliderSetting
                value={settings.groupPrintDelay}
                min={0}
                max={10}
                step={0.5}
                onChange={v => updateSetting('groupPrintDelay', v)}
                unit="s"
              />
            </SettingRow>
          )}

          <SettingRow label="Tamaño de fuente">
            <div className="flex gap-2">
              {[
                { id: 'small', label: 'S' },
                { id: 'medium', label: 'M' },
                { id: 'large', label: 'L' },
                { id: 'xlarge', label: 'XL' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => updateSetting('fontSize', opt.id)}
                  className="flex-1 py-2 font-ui text-sm font-bold rounded-sm border transition-all"
                  style={{
                    background:  settings.fontSize === opt.id ? 'var(--color-accent)' : 'var(--color-surface-2)',
                    borderColor: settings.fontSize === opt.id ? 'var(--color-accent)' : 'var(--color-border)',
                    color:       settings.fontSize === opt.id ? '#000' : 'var(--color-text-muted)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </SettingRow>
        </Section>

        {/* Footer con info */}
        <div
          className="px-6 py-8 text-center"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <p className="font-ui text-xs tracking-wide">
            Morse Koch Trainer — Radio Club Córdoba
          </p>
          <p className="font-ui text-xs mt-1 opacity-50">
            Fase 1 · Motor de audio + loop básico
          </p>
        </div>
      </div>
    </div>
  );
}
