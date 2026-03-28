/**
 * App.jsx
 * ─────────────────────────────────────────────────────────────────
 * Componente raíz. Define los providers de contexto y el sistema
 * de navegación entre pantallas.
 *
 * ── Pantallas ─────────────────────────────────────────────────────
 *   'home'     → HomeScreen
 *   'training' → TrainingScreen
 *   'settings' → SettingsScreen
 *   'progress' → ProgressScreen
 * ─────────────────────────────────────────────────────────────────
 */
import React, { useState } from 'react';
import { SettingsProvider }  from './context/SettingsContext.jsx';
import { ProgressProvider }  from './context/ProgressContext.jsx';
import { HomeScreen }        from './components/screens/HomeScreen.jsx';
import { TrainingScreen }    from './components/screens/TrainingScreen.jsx';
import { SettingsScreen }    from './components/screens/SettingsScreen.jsx';
import { ProgressScreen }    from './components/screens/ProgressScreen.jsx';

function AppContent() {
  const [screen, setScreen] = useState('home');

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      {screen === 'home' && (
        <HomeScreen
          onStartTraining={() => setScreen('training')}
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
