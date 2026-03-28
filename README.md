# CW Koch Trainer — Radio Club Córdoba

Entrenador de código Morse usando el método Koch. Clon web funcional de la app Android "IZ2UUF Morse Koch CW".

## Stack

- React 18 + Vite
- Tailwind CSS v4
- Web Audio API (audio Morse sin librerías)
- localStorage (persistencia)

## Desarrollo local

```bash
npm install
npm run dev
```

## Build para producción

```bash
npm run build
# El output estático queda en dist/
```

## Deploy

El contenido de `dist/` se puede subir a cualquier hosting estático:
- GitHub Pages
- Vercel (conectar el repo, detecta Vite automáticamente)
- Netlify
- Cualquier web server

## Estado actual: Fase 1 + 2

### ✅ Fase 1 — Motor de audio + loop básico
- Tabla completa de códigos Morse (A-Z, 0-9, puntuación, prosigns)
- Secuencias Koch G4FON (40 chars) y LCWO (41 chars)
- Motor de audio Web Audio API con scheduled audio (timing perfecto)
- Envelope de tono configurable (attack/release)
- Dot pitch (frecuencia separada para dots y dashes)
- Farnsworth spacing con multiplicadores independientes
- Generador de grupos con hard letters y auto-hard
- Comparación sent vs received con accuracy por carácter

### ✅ Fase 2 — Sesión completa + Koch + persistencia
- Máquina de estados completa (idle → countdown → audio → input → feedback → finished)
- Timeout de input con cuenta regresiva visual
- Todos los 25 settings configurables con persistencia en localStorage
- ProgressContext: historial de sesiones, stats por carácter
- Pantalla de Progreso con gráfico de accuracy y heatmap de caracteres
- SessionSummary con registro automático de la sesión
- Hard letters manual + auto con 3x frecuencia

### 🔜 Pendiente (Fase 3)
- Speech / TTS (Web Speech API)
- Group print mode (head copy)
- Modos custom string
- Export/import de datos
- PWA offline

## Arquitectura

```
src/
├── constants/       # Morse codes, secuencias Koch, defaults, ITU phonetic
├── audio/           # MorsePlayer (Web Audio API), timings
├── engine/          # GroupGenerator, AccuracyCalculator
├── context/         # SettingsContext, ProgressContext
├── hooks/           # useAudioPlayer, useTrainingSession, useKeyboardInput
├── components/
│   ├── screens/     # HomeScreen, TrainingScreen, SettingsScreen, ProgressScreen, SessionSummary
│   └── training/    # AudioIndicator, GroupFeedback
└── utils/           # storage (localStorage wrapper)
```
