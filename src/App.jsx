/**
 * App.jsx
 * ─────────────────────────────────────────────────────────────────
 * Componente raíz. Define los providers de contexto y el sistema
 * de navegación entre pantallas.
 *
 * ── Pantallas ─────────────────────────────────────────────────────
 *   'home'        → HomeScreen
 *   'training'    → TrainingScreen
 *   'single_char' → SingleCharScreen
 *   'settings'    → SettingsScreen
 *   'progress'    → ProgressScreen
 * ─────────────────────────────────────────────────────────────────
 */
import React, { useState } from 'react';
import { SettingsProvider }    from './context/SettingsContext.jsx';
import { ProgressProvider }    from './context/ProgressContext.jsx';
import { useSettings }         from './context/SettingsContext.jsx';
import { HomeScreen }          from './components/screens/HomeScreen.jsx';
import { TrainingScreen }      from './components/screens/TrainingScreen.jsx';
import { SingleCharScreen }    from './components/screens/SingleCharScreen.jsx';
import { SettingsScreen }      from './components/screens/SettingsScreen.jsx';
import { ProgressScreen }      from './components/screens/ProgressScreen.jsx';

function AppContent() {
  const [screen, setScreen] = useState('home');
  const { settings } = useSettings();

  const handleStartTraining = () => {
    if (settings.exerciseType === 'single_char') {
      setScreen('single_char');
    } else {
      setScreen('training');
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      {screen === 'home' && (
        <HomeScreen
          onStartTraining={handleStartTraining}
          onOpenSettings={() => setScreen('settings')}
          onOpenProgress={() => setScreen('progress')}
        />
      )}
      {screen === 'training' && (
        <TrainingScreen
          onHome={() => setScreen('home')}
          onProgress={() => setScreen('progress')}
        />
      )}
      {screen === 'single_char' && (
        <SingleCharScreen
          onHome={() => setScreen('home')}
          onProgress={() => setScreen('progress')}
        />
      )}
      {screen === 'settings' && (
        <SettingsScreen onClose={() => setScreen('home')} />
      )}
      {screen === 'progress' && (
        <ProgressScreen onClose={() => setScreen('home')} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <ProgressProvider>
        <AppContent />
      </ProgressProvider>
    </SettingsProvider>
  );
}
