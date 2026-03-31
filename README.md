# CW Koch Trainer — Radio Club Córdoba

Entrenador de código Morse web, basado en el método Koch. Clon funcional de la app Android [IZ2UUF Morse Koch CW Trainer](https://iz2uuf.net/wp/index.php/morse-code-trainer-app/).

**→ App en vivo:** https://pacha994.github.io/morse-koch-trainer/

---

## Stack

- React 18 + Vite
- Tailwind CSS v4
- Web Audio API — audio Morse sin librerías externas
- Web Speech API — Text-to-Speech nativo del browser
- localStorage — persistencia de settings e historial

## Desarrollo local

```bash
npm install
npm run dev
```

## Deploy

El deploy es automático vía GitHub Actions en cada push a `main`. El workflow hace `npm run build` y publica el contenido de `dist/` en GitHub Pages.

```bash
npm run build   # output estático en dist/
```

---

## Features implementadas

### Motor de audio
- Tabla completa ITU: A–Z, 0–9, puntuación, prosigns (`<AR>`, `<SK>`, `<BT>`, `<KN>`)
- Web Audio API con scheduled audio — timing de microsegundos, sin drift
- Envelope configurable (attack/release) para evitar clicks en los tonos
- Dot pitch: frecuencia separada para dots y dashes
- Farnsworth spacing: multiplicadores independientes de carácter y palabra

### Método Koch
- Secuencias G4FON (40 chars) y LCWO (41 chars)
- Koch level selector con código Morse visible por carácter
- Hard letters: selección manual + auto (últimos 2 del nivel) con frecuencia 3×
- El avance de nivel es siempre decisión del usuario — la app solo sugiere

### Sesión
- Máquina de estados: `IDLE → COUNTDOWN → PLAYING_AUDIO → WAITING_INPUT → FEEDBACK → PAUSED → FINISHED`
- Timeout de input configurable con cuenta regresiva visual
- Group print mode (head copy): el texto aparece solo al final del grupo
- Accuracy por carácter calculada en tiempo real

### Settings (25 configurables, persistidos en localStorage)
- Tipo de ejercicio: Koch G4FON, Koch LCWO, cadena personalizada, palabras
- Velocidad: slider WPM o CPM
- Duración del ejercicio: 10s a 10min
- Longitud de grupo: variable o fijo (1–8 chars)
- Pausa inicial: 0–5s
- Nivel Koch + hard letters
- Espaciado entre caracteres y palabras (Farnsworth)
- Relación dash/dot
- Frecuencia sidetone
- Ataque y liberación de tono
- Volumen
- Tamaño de fuente
- Group print + delay
- Mantener pantalla encendida (Wake Lock API)
- Voz / TTS: fonética, alfabeto, ninguna — con idioma y timing configurables

### Progreso
- Historial de las últimas 100 sesiones
- Stats por carácter: accuracy de vida, hits, errores
- Heatmap visual de fortalezas/debilidades por letra

---

## Arquitectura

```
src/
├── constants/       # morseCodes, kochSequences, defaults, ituPhonetic
├── audio/           # MorsePlayer (Web Audio API, scheduled, envelope)
├── engine/          # GroupGenerator (Koch + hard letters), AccuracyCalculator
├── context/         # SettingsContext (localStorage), ProgressContext
├── hooks/           # useAudioPlayer, useTrainingSession, useKeyboardInput
├── components/
│   ├── screens/     # HomeScreen, TrainingScreen, SettingsScreen, ProgressScreen, SessionSummary
│   └── training/    # AudioIndicator, GroupFeedback
└── utils/           # storage (localStorage wrapper)
```

## Notas de implementación

- **Stale closures en timers**: los callbacks de audio usan refs paralelos para acceder al estado actual sin re-registrar los handlers.
- **Scheduled audio**: todos los tonos se planifican con `AudioContext.currentTime` antes de empezar el grupo — garantiza timing exacto independientemente del event loop.
- **GitHub Actions + `workflow` scope**: el archivo `.github/workflows/deploy.yml` requiere un token con scope `workflow` para pushearse vía API. Sin ese scope, la API de contenidos de GitHub lo rechaza silenciosamente.

## Limitaciones conocidas

- **No responsive**: diseñado para desktop y tablet landscape. En mobile portrait hay problemas de layout, especialmente en Training y Settings.
- **Input por teclado físico**: el modo de entrenamiento asume teclado. Sin soporte táctil en pantalla para responder.
