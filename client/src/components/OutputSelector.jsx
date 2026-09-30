import React from 'react';
import { Linkedin, Twitter, ShieldAlert, BarChart2, FileText, Presentation as PresentationIcon, Video, Check } from 'lucide-react';

const ICONS = {
  linkedin: Linkedin,
  twitter: Twitter,
  'shield-alert': ShieldAlert,
  'bar-chart-2': BarChart2,
  'file-text': FileText,
  presentation: PresentationIcon,
  video: Video,
};

export default function OutputSelector({ outputTypes, selected, onToggle }) {
  return (
    <section className="bg-ink-900 border border-ink-700 rounded-xl p-5">
      <h2 className="font-semibold text-slate-100 mb-1">2. Output Types</h2>
      <p className="text-sm text-slate-500 mb-4">Select one or more artefacts to generate from this source.</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {outputTypes.map((o) => {
          const Icon = ICONS[o.icon] || FileText;
          const isSelected = selected.includes(o.key);
          return (
            <button
              key={o.key}
              onClick={() => onToggle(o.key)}
              aria-pressed={isSelected}
              className={`relative text-left p-4 rounded-lg border transition-all focus-ring ${
                isSelected
                  ? 'border-accent-500 bg-accent-500/10'
                  : 'border-ink-600 bg-ink-800 hover:border-ink-500'
              }`}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </span>
              )}
              <Icon size={20} className={isSelected ? 'text-accent-400' : 'text-slate-400'} />
              <p className="mt-2 text-sm font-medium text-slate-100">{o.label}</p>
              <p className="mt-0.5 text-xs text-slate-500 leading-snug">{o.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
