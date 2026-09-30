import React, { useEffect, useState } from 'react';
import { Clock, FileText, Link2, Image as ImageIcon, File as FileIcon, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';

const SOURCE_ICONS = { text: FileText, url: Link2, image: ImageIcon, pdf: FileIcon, docx: FileIcon, txt: FileIcon };

const STATUS_STYLES = {
  completed: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  failed: 'text-red-300 bg-red-500/10 border-red-500/30',
  processing: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  analyzing: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  generating: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  idle: 'text-slate-400 bg-ink-800 border-ink-600',
};

export default function HistoryPage({ onOpen }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.listTransformations().then(setItems).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-50 mb-1">History</h1>
      <p className="text-slate-400 text-sm mb-6">Every past transformation, most recent first.</p>

      {error && (
        <div className="flex items-center gap-2 bg-red-950/40 border border-red-800 text-red-200 rounded-lg px-4 py-3 text-sm mb-4">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {!items && !error && (
        <div className="flex items-center gap-2 text-slate-500 text-sm py-12 justify-center">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      )}

      {items && items.length === 0 && (
        <div className="text-center py-16 text-slate-500 text-sm">
          No transformations yet. Head to the Transform tab to create your first one.
        </div>
      )}

      {items && items.length > 0 && (
        <div className="border border-ink-700 rounded-xl overflow-hidden divide-y divide-ink-700">
          {items.map((t) => {
            const Icon = SOURCE_ICONS[t.sourceType] || FileText;
            return (
              <button
                key={t.id}
                onClick={() => onOpen(t.id)}
                className="w-full flex items-center gap-4 px-5 py-4 bg-ink-900 hover:bg-ink-800 transition-colors text-left focus-ring"
              >
                <div className="w-9 h-9 rounded-lg bg-ink-800 border border-ink-600 flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-slate-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-100 truncate">{t.title}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-slate-500 uppercase tracking-wide">{t.sourceType}</span>
                    <span className="text-xs text-slate-600">·</span>
                    <span className="text-xs text-slate-500">{t.selectedOutputs.join(', ')}</span>
                  </div>
                </div>
                <span className={`text-xs rounded-full px-2.5 py-1 border shrink-0 ${STATUS_STYLES[t.status] || STATUS_STYLES.idle}`}>
                  {t.status}
                </span>
                <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0 w-32 justify-end">
                  <Clock size={12} />
                  {new Date(t.createdAt + 'Z').toLocaleString()}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
