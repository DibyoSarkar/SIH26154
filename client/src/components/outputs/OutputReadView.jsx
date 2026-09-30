import React from 'react';

const Section = ({ title, children }) =>
  children ? (
    <div className="mb-5">
      {title && <h4 className="text-xs font-semibold uppercase tracking-wide text-accent-400 mb-2">{title}</h4>}
      {children}
    </div>
  ) : null;

const List = ({ items }) =>
  items?.length ? (
    <ul className="list-disc list-inside space-y-1 text-sm text-slate-200">
      {items.map((i, idx) => <li key={idx}>{i}</li>)}
    </ul>
  ) : null;

const Prose = ({ children }) =>
  children ? <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{children}</p> : null;

export default function OutputReadView({ outputType, content }) {
  if (!content) return null;

  switch (outputType) {
    case 'linkedin':
      return (
        <div className="max-w-xl mx-auto bg-white text-slate-900 rounded-xl p-6 shadow-lg">
          <p className="font-semibold mb-2">{content.hook}</p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content.body}</p>
          {content.keyInsights?.length > 0 && (
            <ul className="list-disc list-inside text-sm mt-3 space-y-1">
              {content.keyInsights.map((i, idx) => <li key={idx}>{i}</li>)}
            </ul>
          )}
          {content.callToAction && <p className="mt-3 font-medium text-sm">{content.callToAction}</p>}
          {content.hashtags?.length > 0 && (
            <p className="mt-3 text-sm text-blue-700">{content.hashtags.map((h) => `#${h}`).join(' ')}</p>
          )}
        </div>
      );

    case 'x':
      return (
        <div className="max-w-xl mx-auto space-y-3">
          {content.format === 'single' ? (
            <div className="bg-white text-slate-900 rounded-xl p-4 shadow-lg text-sm">{content.singlePost}</div>
          ) : (
            <>
              {(content.thread || []).map((t) => (
                <div key={t.order} className="bg-white text-slate-900 rounded-xl p-4 shadow-lg text-sm">
                  <span className="text-xs text-slate-400 block mb-1">{t.order}/</span>
                  {t.text}
                </div>
              ))}
              {content.conclusion && (
                <div className="bg-white text-slate-900 rounded-xl p-4 shadow-lg text-sm font-medium">{content.conclusion}</div>
              )}
            </>
          )}
        </div>
      );

    case 'advisory':
      return (
        <div className="bg-white text-slate-900 rounded-xl p-8 shadow-lg max-w-3xl mx-auto font-serif">
          <h2 className="text-2xl font-bold mb-1">{content.title}</h2>
          <p className="text-xs text-slate-500 mb-6">
            {content.advisoryId ? `ID: ${content.advisoryId} · ` : ''}{content.dateIssued || ''}
          </p>
          <DocSection title="Executive Summary" text={content.executiveSummary} />
          <DocSection title="Background" text={content.background} />
          <DocSection title="Current Situation" text={content.currentSituation} />
          <DocSection title="Key Findings" list={content.keyFindings} />
          <DocSection title="Threat / Issue Overview" text={content.threatOrIssueOverview} />
          <DocSection title="Impact" text={content.impact} />
          <DocSection title="Risk Assessment" text={content.riskAssessment} />
          <DocSection title="Recommended Actions" list={content.recommendedActions} />
          <DocSection title="Preventive Measures" list={content.preventiveMeasures} />
          <DocSection title="Operational Considerations" text={content.operationalConsiderations} />
          <DocSection title="Conclusion" text={content.conclusion} />
        </div>
      );

    case 'infographic':
      return (
        <div className="space-y-4">
          <div className="bg-ink-800 border border-ink-600 rounded-xl p-5 text-center">
            <h3 className="text-lg font-bold text-slate-50">{content.title}</h3>
            <p className="text-accent-400 text-sm mt-1">{content.coreMessage}</p>
          </div>
          {content.keyStatistics?.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {content.keyStatistics.map((s, idx) => (
                <div key={idx} className="bg-ink-800 border border-ink-600 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-accent-400">{s.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          )}
          <Section title="Key Facts"><List items={content.keyFacts} /></Section>
          {content.sections?.map((s, idx) => (
            <div key={idx} className="bg-ink-800 border border-ink-600 rounded-lg p-4">
              <h4 className="font-semibold text-slate-100 text-sm">{s.heading}</h4>
              <p className="text-sm text-slate-300 mt-1">{s.content}</p>
              {s.highlightedNumber && <p className="text-accent-400 font-bold text-lg mt-1">{s.highlightedNumber}</p>}
              <p className="text-xs text-slate-500 mt-1 italic">Visual: {s.visualSuggestion}</p>
            </div>
          ))}
          <p className="text-xs text-slate-500">Layout: {content.recommendedLayout}</p>
        </div>
      );

    case 'exec_summary':
      return (
        <div className="bg-white text-slate-900 rounded-xl p-8 shadow-lg max-w-3xl mx-auto">
          <DocSection title="Situation" text={content.situation} />
          <DocSection title="Main Findings" list={content.mainFindings} />
          <DocSection title="Critical Facts" list={content.criticalFacts} />
          <DocSection title="Business / Operational Impact" text={content.businessOperationalImpact} />
          <DocSection title="Risks" list={content.risks} />
          <DocSection title="Key Implications" list={content.keyImplications} />
          <DocSection title="Recommended Actions" list={content.recommendedActions} />
          <DocSection title="Decision Points" list={content.decisionPoints} />
        </div>
      );

    case 'presentation':
      return (
        <div>
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-slate-50">{content.title}</h3>
            {content.subtitle && <p className="text-slate-400 text-sm mt-1">{content.subtitle}</p>}
          </div>
          <div className="space-y-4">
            {(content.slides || []).map((s) => (
              <div key={s.slideNumber} className="bg-white text-slate-900 rounded-xl p-6 shadow-lg aspect-[16/9] flex flex-col">
                <span className="text-xs text-slate-400">Slide {s.slideNumber}</span>
                <h4 className="text-lg font-bold mt-1">{s.slideTitle}</h4>
                <p className="text-sm text-slate-600 mt-1">{s.mainContent}</p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-0.5 flex-1">
                  {(s.bulletPoints || []).map((b, i) => <li key={i}>{b}</li>)}
                </ul>
                <p className="text-xs text-slate-400 italic mt-2">Visual: {s.suggestedVisual}</p>
                {s.speakerNotes && (
                  <p className="text-xs text-slate-500 mt-2 border-t border-slate-200 pt-2">Notes: {s.speakerNotes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case 'video':
      return (
        <div className="space-y-4">
          <div className="bg-ink-800 border border-ink-600 rounded-xl p-5">
            <h3 className="text-lg font-bold text-slate-50">{content.videoTitle}</h3>
            <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
              <div><span className="text-slate-500 block text-xs">Objective</span>{content.objective}</div>
              <div><span className="text-slate-500 block text-xs">Audience</span>{content.targetAudience}</div>
              <div><span className="text-slate-500 block text-xs">Duration</span>{content.estimatedDuration}</div>
            </div>
          </div>
          {(content.scenes || []).map((s) => (
            <div key={s.sceneNumber} className="bg-ink-800 border border-ink-600 rounded-lg p-4">
              <p className="text-xs font-semibold text-accent-400 mb-1.5">SCENE {s.sceneNumber}</p>
              <p className="text-sm text-slate-200"><span className="text-slate-500">Visual: </span>{s.description}</p>
              <p className="text-sm text-slate-200 mt-1"><span className="text-slate-500">Shot: </span>{s.visualRecommendation}</p>
              <p className="text-sm text-slate-200 mt-1"><span className="text-slate-500">Narration: </span>{s.narration}</p>
              {s.onScreenText && <p className="text-sm text-slate-200 mt-1"><span className="text-slate-500">On-screen: </span>{s.onScreenText}</p>}
              {s.transitionToNext && <p className="text-xs text-slate-500 mt-1 italic">→ {s.transitionToNext}</p>}
            </div>
          ))}
          {content.closingCallToAction && (
            <div className="bg-accent-500/10 border border-accent-500/40 rounded-lg p-4 text-sm text-accent-200">
              CTA: {content.closingCallToAction}
            </div>
          )}
        </div>
      );

    default:
      return <pre className="text-xs bg-ink-800 p-4 rounded-lg overflow-auto">{JSON.stringify(content, null, 2)}</pre>;
  }
}

function DocSection({ title, text, list }) {
  if (!text && (!list || list.length === 0)) return null;
  return (
    <div className="mb-5">
      <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-1.5">{title}</h4>
      {text && <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>}
      {list && list.length > 0 && (
        <ul className="list-disc list-inside text-sm space-y-1 mt-1">
          {list.map((i, idx) => <li key={idx}>{i}</li>)}
        </ul>
      )}
    </div>
  );
}
