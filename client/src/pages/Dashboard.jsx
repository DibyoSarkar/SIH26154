import React, { useEffect, useRef, useState } from 'react';
import { Wand2, AlertCircle } from 'lucide-react';
import SourceInput from '../components/SourceInput.jsx';
import OutputSelector from '../components/OutputSelector.jsx';
import ConfigPanel from '../components/ConfigPanel.jsx';
import ProgressTracker from '../components/ProgressTracker.jsx';
import { api } from '../services/api.js';

const DEFAULT_CONFIG = {
  audience: 'General Public',
  tone: 'Professional',
  language: 'English',
  detailLevel: 'Medium',
  objective: 'Inform',
  contentStyle: 'Corporate',
  customNotes: '',
};

export default function Dashboard({ config: options, onComplete }) {
  const [sourceMode, setSourceMode] = useState('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [selectedOutputs, setSelectedOutputs] = useState(['linkedin']);
  const [genConfig, setGenConfig] = useState(DEFAULT_CONFIG);

  const [submitting, setSubmitting] = useState(false);
  const [pollingId, setPollingId] = useState(null);
  const [pollStatus, setPollStatus] = useState(null);
  const [error, setError] = useState(null);
  const pollTimer = useRef(null);

  useEffect(() => () => clearTimeout(pollTimer.current), []);

  const toggleOutput = (key) => {
    setSelectedOutputs((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const hasSource = (sourceMode === 'text' && text.trim()) || (sourceMode === 'url' && url.trim()) || (sourceMode === 'file' && file);
  const canSubmit = hasSource && selectedOutputs.length > 0 && !submitting;

  const startPolling = (id) => {
    setPollingId(id);
    const poll = async () => {
      try {
        const t = await api.getTransformation(id);
        setPollStatus(t.status);
        if (t.status === 'completed') {
          setSubmitting(false);
          setPollingId(null);
          onComplete(t);
          return;
        }
        if (t.status === 'failed') {
          setSubmitting(false);
          setPollingId(null);
          setError(t.error || 'Transformation failed.');
          return;
        }
        pollTimer.current = setTimeout(poll, 1200);
      } catch (e) {
        setSubmitting(false);
        setPollingId(null);
        setError(e.message);
      }
    };
    poll();
  };

  const handleTransform = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const created = await api.runTransformation({
        sourceMode,
        text,
        url,
        file,
        selectedOutputs,
        config: genConfig,
      });
      setPollStatus(created.status);
      startPolling(created.id);
    } catch (e) {
      setSubmitting(false);
      setError(e.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-50">Transform Content</h1>
        <p className="text-slate-400 mt-1 text-sm">Upload / paste → select outputs → configure → transform → review.</p>
      </div>

      <SourceInput
        sourceMode={sourceMode} setSourceMode={setSourceMode}
        text={text} setText={setText}
        url={url} setUrl={setUrl}
        file={file} setFile={setFile}
      />

      <OutputSelector outputTypes={options.outputTypes} selected={selectedOutputs} onToggle={toggleOutput} />

      <ConfigPanel options={options} config={genConfig} setConfig={setGenConfig} />

      {error && (
        <div className="flex items-start gap-2 bg-red-950/40 border border-red-800 text-red-200 rounded-lg px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {submitting ? (
        <ProgressTracker currentStage={pollStatus} />
      ) : (
        <button
          onClick={handleTransform}
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 disabled:bg-ink-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors focus-ring text-base"
        >
          <Wand2 size={18} />
          Transform Content
        </button>
      )}

      {!hasSource && !submitting && (
        <p className="text-center text-xs text-slate-500">Add source material above to enable transformation.</p>
      )}
    </div>
  );
}
