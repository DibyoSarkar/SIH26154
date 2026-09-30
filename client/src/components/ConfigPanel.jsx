import React from 'react';

export default function ConfigPanel({ options, config, setConfig }) {
  const set = (key) => (e) => setConfig((c) => ({ ...c, [key]: e.target.value }));

  return (
    <section className="bg-ink-900 border border-ink-700 rounded-xl p-5">
      <h2 className="font-semibold text-slate-100 mb-1">3. Configuration</h2>
      <p className="text-sm text-slate-500 mb-4">Controls apply consistently across every selected output.</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Field label="Audience">
          <select value={config.audience} onChange={set('audience')} className={selectClass}>
            {options.audiences.map((a) => <option key={a}>{a}</option>)}
          </select>
        </Field>

        <Field label="Tone">
          <select value={config.tone} onChange={set('tone')} className={selectClass}>
            {options.tones.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>

        <Field label="Language">
          <select value={config.language} onChange={set('language')} className={selectClass}>
            {options.languages.map((l) => <option key={l}>{l}</option>)}
          </select>
        </Field>

        <Field label="Detail Level">
          <select value={config.detailLevel} onChange={set('detailLevel')} className={selectClass}>
            {options.detailLevels.map((d) => <option key={d}>{d}</option>)}
          </select>
        </Field>

        <Field label="Objective">
          <select value={config.objective} onChange={set('objective')} className={selectClass}>
            {options.objectives.map((o) => <option key={o}>{o}</option>)}
          </select>
        </Field>

        <Field label="Content Style">
          <select value={config.contentStyle} onChange={set('contentStyle')} className={selectClass}>
            {options.contentStyles.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Additional notes (optional)">
          <input
            type="text"
            value={config.customNotes || ''}
            onChange={set('customNotes')}
            placeholder="e.g. emphasize customer trust, avoid technical jargon…"
            className="w-full bg-ink-800 border border-ink-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus-ring focus:border-accent-500"
          />
        </Field>
      </div>
    </section>
  );
}

const selectClass = 'w-full bg-ink-800 border border-ink-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus-ring focus:border-accent-500';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-400 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
