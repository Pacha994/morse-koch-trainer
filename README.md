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

## Modos de entrenamiento

### Koch (secuencia G4FON)
Método Koch estándar usando la secuencia de 40 caracteres de G4FON. El entrenamiento comienza con K y M y va agregando un carácter a la vez a medida que el usuario avanza de nivel. En cada sesión se reproducen grupos de caracteres aleatorios del set activo (hasta el nivel configurado), el usuario escribe lo que escucha, y al final del grupo recibe feedback de aciertos y errores. El avance de nivel es siempre decisión del usuario; la app solo sugiere subir cuando la precisión supera el 90%.

### Koch (secuencia LCWO)
Igual que el modo anterior pero usando la secuencia de 41 caracteres de LCWO (Learn CW Online), que difiere en el orden de introducción de los caracteres. Útil para usuarios que siguen cursos basados en esa plataforma.

### Koch (caracteres de cadena personalizada)
Usa el método Koch pero toma como pool de caracteres solo los que están definidos en el campo "Cadena personalizada". El nivel Koch controla cuántos de esos caracteres están activos. Útil para practicar subsets específicos con la estructura progresiva del método Koch.

### Cadena personalizada
Reproduce texto libre ingresado por el usuario en el campo "Cadena personalizada". El texto se divide en grupos del tamaño configurado y se reproduce en orden. Acepta letras, números, puntuación y prosigns con corchetes: `<AR>` `<SK>` `<BT>` `<KN>`. Los comentarios entre llaves `{texto}` son ignorados. Ideal para practicar textos específicos, abreviaturas de radioaficionado o procedimientos operativos.

### Palabras de cadena personalizada
Similar a "Cadena personalizada" pero el generador arma palabras con los caracteres del pool ingresado, en lugar de reproducir el texto literalmente. Los grupos suenan como palabras separadas por silencios de palabra (configurable con Farnsworth).

### Palabras de cadena personalizada y G4FON
Combina los caracteres de la cadena personalizada con los del nivel Koch activo en G4FON para generar palabras. Útil para integrar caracteres nuevos con los ya dominados.

### Palabras de cadena personalizada y LCWO
Igual que el modo anterior pero usando la secuencia LCWO como base de caracteres Koch.

### Single Char
Modo de reconocimiento individual, carácter a carácter. Diseñado para aprender a identificar caracteres nuevos o reforzar los más débiles.

**Cómo funciona:**
1. El usuario configura un set libre de caracteres en Configuración → Ejercicio → Set de caracteres (ej: `KMRSU`).
2. Al iniciar la sesión, suena un carácter aleatorio del set a la velocidad WPM configurada.
3. El usuario presiona la tecla correspondiente — sin confirmar con Enter, la primera tecla es la respuesta.
4. Aparece feedback inmediato: el carácter correcto en grande, su nombre en el alfabeto fonético internacional (Alpha, Bravo, Kilo...) y su código Morse. Si la respuesta fue incorrecta también se muestra qué tecla se presionó.
5. Automáticamente suena el siguiente carácter.
6. La sesión dura el tiempo configurado (mismo setting de duración que los demás modos).

**Características:**
- Sin timeout de input: el usuario se toma el tiempo que necesita.
- Distribución pareja: todos los caracteres del set tienen igual probabilidad.
- El set se guarda entre sesiones (localStorage).
- Al terminar, los datos de accuracy por carácter se registran en Progreso, igual que los demás modos.
- Respeta el WPM general de la configuración.

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
- Timeout de input configurable con cuenta regresiva visual (modos Koch/cadena)
- Sin timeout en Single Char — el usuario responde a su ritmo
- Group print mode (head copy): el texto aparece solo al final del grupo
- Accuracy por carácter calculada en tiempo real

### Settings (26 configurables, persistidos en localStorage)
- Tipo de ejercicio: Koch G4FON, Koch LCWO, cadena personalizada, palabras, Single Char
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
- Set de caracteres Single Char (guardado en localStorage)

### Progreso
- Historial de las últimas 100 sesiones (todos los modos)
- Stats por carácter: accuracy de vida, hits, errores
- Heatmap visual de fortalezas/debilidades por letra

---

## Arquitectura

```
src/
├── constants/       # morseCodes, kochSequences, defaults, ituPhonetic
├── audio/           # MorsePlayer (Web Audio API, scheduled, envelope)
├── engine/          # GroupGenerator, SingleCharGenerator, AccuracyCalculator
├── context/         # SettingsContext (localStorage), ProgressContext
├── hooks/           # useAudioPlayer, useTrainingSession, useSingleCharSession, useKeyboardInput
├── components/
│   ├── screens/     # HomeScreen, TrainingScreen, SingleCharScreen, SettingsScreen, ProgressScreen, SessionSummary
│   └── training/    # AudioIndicator, GroupFeedback
└── utils/           # storage (localStorage wrapper)
```

## Notas de implementación

- **Stale closures en timers**: los callbacks de audio usan refs paralelos para acceder al estado actual sin re-registrar los handlers.
- **Scheduled audio**: todos los tonos se planifican con `AudioContext.currentTime` antes de empezar el grupo — garantiza timing exacto independientemente del event loop.
- **Single Char sin timeout de input**: a diferencia del modo Koch, Single Char no tiene countdown de respuesta. La primera tecla alfanumérica que presiona el usuario es tomada como respuesta inmediatamente, sin necesidad de confirmar con Enter.
- **GitHub Actions + `workflow` scope**: el archivo `.github/workflows/deploy.yml` requiere un token con scope `workflow` para pushearse vía API. Sin ese scope, la API de contenidos de GitHub lo rechaza silenciosamente.

## Limitaciones conocidas

- **No responsive**: diseñado para desktop y tablet landscape. En mobile portrait hay problemas de layout, especialmente en Training y Settings.
- **Input por teclado físico**: el modo de entrenamiento asume teclado. Sin soporte táctil en pantalla para responder.
