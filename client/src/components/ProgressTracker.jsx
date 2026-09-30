import React from 'react';
import { Check, Loader2 } from 'lucide-react';

const STAGES = [
  { key: 'processing', label: 'Processing source' },
  { key: 'analyzing', label: 'Understanding content' },
  { key: 'generating', label: 'Generating outputs' },
  { key: 'completed', label: 'Finalizing' },
];

export default function ProgressTracker({ currentStage }) {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="bg-ink-900 border border-ink-700 rounded-xl p-6">
      <div className="flex items-center justify-between">
        {STAGES.map((stage, i) => {
          const done = currentIndex > i || currentStage === 'completed';
          const active = i === currentIndex && currentStage !== 'completed';
          return (
            <React.Fragment key={stage.key}>
              <div className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                    done
                      ? 'bg-accent-500 border-accent-500'
                      : active
                      ? 'border-accent-500 bg-accent-500/10'
                      : 'border-ink-600 bg-ink-800'
                  }`}
                >
                  {done ? (
                    <Check size={16} className="text-white" />
                  ) : active ? (
                    <Loader2 size={16} className="text-accent-400 animate-spin" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-ink-600" />
                  )}
                </div>
                <span className={`text-xs text-center ${done || active ? 'text-slate-200' : 'text-slate-500'}`}>
                  {stage.label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div className={`h-0.5 flex-1 -mt-6 ${currentIndex > i ? 'bg-accent-500' : 'bg-ink-700'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
