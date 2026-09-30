import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, Pencil, Save, X as XIcon, RotateCcw, RefreshCw, Copy, Download,
  ShieldCheck, ShieldAlert, ChevronDown, Loader2, Check,
} from 'lucide-react';
import OutputReadView from '../components/outputs/OutputReadView.jsx';
import GenericEditForm from '../components/outputs/GenericEditForm.jsx';
import { api } from '../services/api.js';

const TYPE_LABELS = {
  linkedin: 'LinkedIn', x: 'X / Twitter', advisory: 'Advisory', infographic: 'Infographic',
  exec_summary: 'Exec Summary', presentation: 'Presentation', video: 'Video',
};

const EXPORT_FORMATS = {
  linkedin: ['txt', 'md', 'docx'], x: ['txt', 'md'], advisory: ['txt', 'md', 'docx'],
  infographic: ['md', 'docx'], exec_summary: ['txt', 'md', 'docx'], presentation: ['md', 'docx', 'pptx'], video: ['txt', 'md', 'docx'],
};

export default function ResultsWorkspace({ transformation, onTransformationUpdate, onBack }) {
  const outputs = transformation.outputs || [];
  const [activeId, setActiveId] = useState(outputs[0]?.id);
  const active = outputs.find((o) => o.id === activeId) || outputs[0];

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const displayedContent = useMemo(() => {
    if (!active) return null;
    return active.editedContent || active.content;
  }, [active]);

  const updateOutputInState = (updated) => {
    onTransformationUpdate({
      ...transformation,
      outputs: outputs.map((o) => (o.id === updated.id ? updated : o)),
    });
  };

  const startEdit = () => { setDraft(displayedContent); setEditing(true); };
  const cancelEdit = () => { setEditing(false); setDraft(null); };

  const saveEdit = async () => {
    setBusy(true);
    try {
      const updated = await api.updateOutput(active.id, draft);
      updateOutputInState(updated);
      setEditing(false);
      setDraft(null);
    } catch (e) {
      alert(`Could not save: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const resetEdits = async () => {
    if (!confirm('Discard your edits and revert to the generated version?')) return;
    setBusy(true);
    try {
      const updated = await api.resetOutput(active.id);
      updateOutputInState(updated);
    } catch (e) {
      alert(`Could not reset: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const regenerate = async () => {
    if (!confirm('Regenerate this output? This creates a new version from the original source.')) return;
    setBusy(true);
    try {
      const updated = await api.regenerateOutput(active.id);
      updateOutputInState(updated);
      setEditing(false);
    } catch (e) {
      alert(`Could not regenerate: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const copyContent = async () => {
    await navigator.clipboard.writeText(JSON.stringify(displayedContent, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = (format) => {
    window.open(api.exportUrl(active.id, format), '_blank');
    setExportOpen(false);
  };

  if (!active) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12 text-center text-slate-400">
        No outputs were generated for this transformation.
        <div className="mt-4">
          <button onClick={onBack} className="text-accent-400 hover:underline">Back to Transform</button>
        </div>
      </div>
    );
  }

  const validation = active.validation;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-4 focus-ring rounded-md">
        <ArrowLeft size={16} /> Back to Transform
      </button>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-50 truncate max-w-lg">{transformation.title}</h1>
        {transformation.structured_model?._chunked && (
          <span className="text-xs text-slate-500 bg-ink-800 border border-ink-700 rounded-full px-2.5 py-1">
            Long document · processed in {transformation.structured_model._chunkCount} chunks
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-ink-700 mb-6 overflow-x-auto">
        {outputs.map((o) => (
          <button
            key={o.id}
            onClick={() => { setActiveId(o.id); setEditing(false); }}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors focus-ring ${
              o.id === active.id ? 'border-accent-500 text-slate-50' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {TYPE_LABELS[o.outputType] || o.outputType}
            {o.status === 'failed' && <span className="ml-1.5 text-red-400">⚠</span>}
            {o.editedContent && <span className="ml-1.5 text-accent-400">●</span>}
          </button>
        ))}
      </div>

      {active.status === 'failed' ? (
        <div className="bg-red-950/40 border border-red-800 text-red-200 rounded-lg px-4 py-4 text-sm">
          Generation failed for this output: {active.error}
        </div>
      ) : (
        <>
          {/* Action bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-2">
              {validation && (
                <ValidationBadge validation={validation} />
              )}
              {active.editedContent && !editing && (
                <span className="text-xs text-accent-400 bg-accent-500/10 border border-accent-500/30 rounded-full px-2.5 py-1">
                  Edited version shown
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!editing ? (
                <>
                  <ActionButton onClick={startEdit} icon={<Pencil size={14} />} label="Edit" />
                  <ActionButton onClick={copyContent} icon={copied ? <Check size={14} /> : <Copy size={14} />} label={copied ? 'Copied' : 'Copy'} />
                  <div className="relative">
                    <ActionButton onClick={() => setExportOpen((v) => !v)} icon={<Download size={14} />} label="Download" trailing={<ChevronDown size={12} />} />
                    {exportOpen && (
                      <div className="absolute right-0 mt-1 bg-ink-800 border border-ink-600 rounded-lg shadow-xl overflow-hidden z-10 min-w-[8rem]">
                        {(EXPORT_FORMATS[active.outputType] || ['txt', 'md']).map((f) => (
                          <button key={f} onClick={() => download(f)} className="block w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-ink-700">
                            .{f}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <ActionButton onClick={regenerate} icon={busy ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} label="Regenerate" disabled={busy} />
                  {active.editedContent && <ActionButton onClick={resetEdits} icon={<RotateCcw size={14} />} label="Reset" disabled={busy} />}
                </>
              ) : (
                <>
                  <ActionButton onClick={saveEdit} icon={busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} label="Save" primary disabled={busy} />
                  <ActionButton onClick={cancelEdit} icon={<XIcon size={14} />} label="Cancel" disabled={busy} />
                </>
              )}
            </div>
          </div>

          <div className="bg-ink-900 border border-ink-700 rounded-xl p-6">
            {editing ? (
              <GenericEditForm content={draft} onChange={setDraft} />
            ) : (
              <OutputReadView outputType={active.outputType} content={displayedContent} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ValidationBadge({ validation }) {
  const issues = (validation.structuralIssues?.length || 0) + (validation.aiIssues?.length || 0);
  const ok = validation.passed && issues === 0;
  return (
    <div className="relative group">
      <span className={`flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 border ${
        ok ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' : 'text-amber-300 bg-amber-500/10 border-amber-500/30'
      }`}>
        {ok ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
        {ok ? 'Source-grounded' : `${issues} validation note${issues === 1 ? '' : 's'}`}
      </span>
      {!ok && issues > 0 && (
        <div className="absolute left-0 top-full mt-1 w-72 bg-ink-800 border border-ink-600 rounded-lg p-3 text-xs text-slate-300 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
          <ul className="list-disc list-inside space-y-1">
            {[...(validation.structuralIssues || []), ...(validation.aiIssues || [])].map((iss, i) => <li key={i}>{iss}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function ActionButton({ onClick, icon, label, primary, trailing, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors focus-ring disabled:opacity-50 ${
        primary ? 'bg-accent-500 hover:bg-accent-600 text-white' : 'bg-ink-800 hover:bg-ink-700 text-slate-200 border border-ink-600'
      }`}
    >
      {icon}
      {label}
      {trailing}
    </button>
  );
}
