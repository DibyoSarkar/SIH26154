import React from 'react';

function humanize(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

// Generic, schema-free edit form: walks the top-level keys of the content
// object and renders the right control per value type. Arrays of strings
// become one-item-per-line textareas; arrays of objects (scenes, slides,
// thread entries, etc.) become a repeated JSON block editor per item so
// every field stays editable without a bespoke form per output type.
export default function GenericEditForm({ content, onChange }) {
  const update = (key, value) => onChange({ ...content, [key]: value });

  return (
    <div className="space-y-4">
      {Object.entries(content).map(([key, value]) => {
        if (key.startsWith('_')) return null;

        if (typeof value === 'string' || value === null) {
          const isLong = (value || '').length > 80 || key.toLowerCase().includes('body') || key.toLowerCase().includes('narration');
          return (
            <Field key={key} label={humanize(key)}>
              {isLong ? (
                <textarea
                  value={value || ''}
                  onChange={(e) => update(key, e.target.value)}
                  rows={4}
                  className={inputClass}
                />
              ) : (
                <input
                  type="text"
                  value={value || ''}
                  onChange={(e) => update(key, e.target.value)}
                  className={inputClass}
                />
              )}
            </Field>
          );
        }

        if (Array.isArray(value) && (value.length === 0 || typeof value[0] === 'string')) {
          return (
            <Field key={key} label={humanize(key)} hint="One per line">
              <textarea
                value={(value || []).join('\n')}
                onChange={(e) => update(key, e.target.value.split('\n').filter((l) => l.trim() !== ''))}
                rows={Math.max(3, (value || []).length + 1)}
                className={inputClass}
              />
            </Field>
          );
        }

        if (Array.isArray(value)) {
          // array of objects (scenes, slides, thread, sections, key stats...)
          return (
            <Field key={key} label={humanize(key)} hint={`${value.length} item(s) — edit as structured JSON`}>
              <textarea
                value={JSON.stringify(value, null, 2)}
                onChange={(e) => {
                  try {
                    update(key, JSON.parse(e.target.value));
                  } catch {
                    /* ignore until valid JSON is typed */
                  }
                }}
                rows={10}
                className={`${inputClass} font-mono text-xs`}
              />
            </Field>
          );
        }

        if (typeof value === 'object') {
          return (
            <Field key={key} label={humanize(key)} hint="Edit as structured JSON">
              <textarea
                value={JSON.stringify(value, null, 2)}
                onChange={(e) => {
                  try {
                    update(key, JSON.parse(e.target.value));
                  } catch {
                    /* ignore until valid JSON is typed */
                  }
                }}
                rows={6}
                className={`${inputClass} font-mono text-xs`}
              />
            </Field>
          );
        }

        return null;
      })}
    </div>
  );
}

const inputClass = 'w-full bg-ink-800 border border-ink-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus-ring focus:border-accent-500';

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-300">{label}</span>
        {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
