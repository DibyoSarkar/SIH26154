import React, { useEffect, useState, useCallback } from 'react';
import { Layers, History as HistoryIcon, Sparkles } from 'lucide-react';
import { api } from './services/api.js';
import Dashboard from './pages/Dashboard.jsx';
import ResultsWorkspace from './pages/ResultsWorkspace.jsx';
import HistoryPage from './pages/HistoryPage.jsx';

export default function App() {
  const [view, setView] = useState('dashboard'); // dashboard | results | history
  const [config, setConfig] = useState(null);
  const [configError, setConfigError] = useState(null);
  const [activeTransformation, setActiveTransformation] = useState(null);

  useEffect(() => {
    api.getConfig().then(setConfig).catch((e) => setConfigError(e.message));
  }, []);

  const openTransformation = useCallback((transformation) => {
    setActiveTransformation(transformation);
    setView('results');
  }, []);

  const openHistoryItem = useCallback(async (id) => {
    try {
      const t = await api.getTransformation(id);
      setActiveTransformation(t);
      setView('results');
    } catch (e) {
      alert(`Could not load transformation: ${e.message}`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-ink-950 text-slate-100 flex flex-col">
      <header className="border-b border-ink-700 bg-ink-900/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => setView('dashboard')}
            className="flex items-center gap-2 focus-ring rounded-md"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">ContentForge</span>
          </button>

          <nav className="flex items-center gap-1">
            <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<Layers size={16} />} label="Transform" />
            <NavButton active={view === 'history'} onClick={() => setView('history')} icon={<HistoryIcon size={16} />} label="History" />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {configError && (
          <div className="max-w-7xl mx-auto px-6 pt-6">
            <div className="bg-red-950/40 border border-red-800 text-red-200 rounded-lg px-4 py-3 text-sm">
              Could not reach the API server ({configError}). Make sure the backend is running on port 4000.
            </div>
          </div>
        )}

        {view === 'dashboard' && config && (
          <Dashboard config={config} onComplete={openTransformation} />
        )}

        {view === 'results' && activeTransformation && (
          <ResultsWorkspace
            transformation={activeTransformation}
            onTransformationUpdate={setActiveTransformation}
            onBack={() => setView('dashboard')}
          />
        )}

        {view === 'history' && (
          <HistoryPage onOpen={openHistoryItem} />
        )}
      </main>

      <footer className="border-t border-ink-800 py-4 text-center text-xs text-slate-500">
        ContentForge — one source, every communication artefact.
      </footer>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-ring ${
        active ? 'bg-ink-700 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-ink-800'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
