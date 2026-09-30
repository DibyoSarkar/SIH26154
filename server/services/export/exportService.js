import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';
import PptxGenJS from 'pptxgenjs';

// --- Markdown rendering per output type -------------------------------------------------

function renderMarkdown(outputType, content) {
  const lines = [];
  const push = (s = '') => lines.push(s);

  switch (outputType) {
    case 'linkedin':
      push(`# LinkedIn Post\n`);
      push(`**${content.hook || ''}**\n`);
      push(content.body || '');
      if (content.keyInsights?.length) { push('\n## Key Insights'); content.keyInsights.forEach((i) => push(`- ${i}`)); }
      if (content.takeaways?.length) { push('\n## Takeaways'); content.takeaways.forEach((i) => push(`- ${i}`)); }
      if (content.callToAction) push(`\n**Call to action:** ${content.callToAction}`);
      if (content.hashtags?.length) push(`\n${content.hashtags.map((h) => `#${h}`).join(' ')}`);
      break;

    case 'x':
      push(`# X / Twitter\n`);
      if (content.format === 'single') {
        push(content.singlePost || '');
      } else {
        (content.thread || []).forEach((t) => push(`**${t.order}.** ${t.text}\n`));
        if (content.conclusion) push(`\n${content.conclusion}`);
      }
      break;

    case 'advisory':
      push(`# ${content.title || 'Advisory'}\n`);
      if (content.advisoryId) push(`*ID: ${content.advisoryId}*`);
      if (content.dateIssued) push(`*Date: ${content.dateIssued}*`);
      push(`\n## Executive Summary\n${content.executiveSummary || ''}`);
      if (content.background) push(`\n## Background\n${content.background}`);
      if (content.currentSituation) push(`\n## Current Situation\n${content.currentSituation}`);
      if (content.keyFindings?.length) { push('\n## Key Findings'); content.keyFindings.forEach((i) => push(`- ${i}`)); }
      if (content.threatOrIssueOverview) push(`\n## Threat / Issue Overview\n${content.threatOrIssueOverview}`);
      if (content.impact) push(`\n## Impact\n${content.impact}`);
      if (content.riskAssessment) push(`\n## Risk Assessment\n${content.riskAssessment}`);
      if (content.recommendedActions?.length) { push('\n## Recommended Actions'); content.recommendedActions.forEach((i) => push(`- ${i}`)); }
      if (content.preventiveMeasures?.length) { push('\n## Preventive Measures'); content.preventiveMeasures.forEach((i) => push(`- ${i}`)); }
      if (content.operationalConsiderations) push(`\n## Operational Considerations\n${content.operationalConsiderations}`);
      if (content.conclusion) push(`\n## Conclusion\n${content.conclusion}`);
      break;

    case 'infographic':
      push(`# ${content.title || 'Infographic'}\n`);
      push(`**Core message:** ${content.coreMessage || ''}\n`);
      if (content.keyStatistics?.length) { push('## Key Statistics'); content.keyStatistics.forEach((s) => push(`- **${s.value}** — ${s.label}`)); }
      if (content.keyFacts?.length) { push('\n## Key Facts'); content.keyFacts.forEach((i) => push(`- ${i}`)); }
      (content.sections || []).forEach((s) => {
        push(`\n## ${s.heading}`);
        push(s.content || '');
        if (s.highlightedNumber) push(`*Highlighted number: ${s.highlightedNumber}*`);
        push(`*Visual: ${s.visualSuggestion || ''}*`);
      });
      push(`\n**Recommended layout:** ${content.recommendedLayout || ''}`);
      if (content.footerSourceInfo) push(`\n*${content.footerSourceInfo}*`);
      break;

    case 'exec_summary':
      push(`# Executive Summary\n`);
      push(`## Situation\n${content.situation || ''}`);
      if (content.mainFindings?.length) { push('\n## Main Findings'); content.mainFindings.forEach((i) => push(`- ${i}`)); }
      if (content.criticalFacts?.length) { push('\n## Critical Facts'); content.criticalFacts.forEach((i) => push(`- ${i}`)); }
      if (content.businessOperationalImpact) push(`\n## Business / Operational Impact\n${content.businessOperationalImpact}`);
      if (content.risks?.length) { push('\n## Risks'); content.risks.forEach((i) => push(`- ${i}`)); }
      if (content.keyImplications?.length) { push('\n## Key Implications'); content.keyImplications.forEach((i) => push(`- ${i}`)); }
      if (content.recommendedActions?.length) { push('\n## Recommended Actions'); content.recommendedActions.forEach((i) => push(`- ${i}`)); }
      if (content.decisionPoints?.length) { push('\n## Decision Points'); content.decisionPoints.forEach((i) => push(`- ${i}`)); }
      break;

    case 'presentation':
      push(`# ${content.title || 'Presentation'}\n`);
      if (content.subtitle) push(`*${content.subtitle}*\n`);
      (content.slides || []).forEach((s) => {
        push(`\n## Slide ${s.slideNumber}: ${s.slideTitle}`);
        push(s.mainContent || '');
        (s.bulletPoints || []).forEach((b) => push(`- ${b}`));
        push(`*Visual: ${s.suggestedVisual || ''}*`);
        push(`> Speaker notes: ${s.speakerNotes || ''}`);
      });
      break;

    case 'video':
      push(`# ${content.videoTitle || 'Video Package'}\n`);
      push(`**Objective:** ${content.objective || ''}  `);
      push(`**Audience:** ${content.targetAudience || ''}  `);
      push(`**Duration:** ${content.estimatedDuration || ''}`);
      if (content.backgroundMusicStyle) push(`**Music style:** ${content.backgroundMusicStyle}`);
      (content.scenes || []).forEach((s) => {
        push(`\n## Scene ${s.sceneNumber}`);
        push(`**Visual:** ${s.description || ''}`);
        push(`**Shot suggestion:** ${s.visualRecommendation || ''}`);
        push(`**Narration:** ${s.narration || ''}`);
        if (s.onScreenText) push(`**On-screen text:** ${s.onScreenText}`);
        if (s.transitionToNext) push(`*Transition: ${s.transitionToNext}*`);
      });
      if (content.closingCallToAction) push(`\n**Closing CTA:** ${content.closingCallToAction}`);
      break;

    default:
      push('```json');
      push(JSON.stringify(content, null, 2));
      push('```');
  }

  return lines.join('\n');
}

function markdownToPlainText(md) {
  return md.replace(/^#+\s*/gm, '').replace(/\*\*/g, '').replace(/^-\s/gm, '• ').replace(/^>\s/gm, '');
}

export async function exportOutput({ outputType, content, format }) {
  const markdown = renderMarkdown(outputType, content);

  switch (format) {
    case 'md':
      return { buffer: Buffer.from(markdown, 'utf-8'), mime: 'text/markdown', ext: 'md' };

    case 'txt':
      return { buffer: Buffer.from(markdownToPlainText(markdown), 'utf-8'), mime: 'text/plain', ext: 'txt' };

    case 'docx':
      return { buffer: await buildDocx(outputType, content, markdown), mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' };

    case 'pptx':
      if (outputType !== 'presentation') throw new Error('PPTX export is only available for the Presentation output type.');
      return { buffer: await buildPptx(content), mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', ext: 'pptx' };

    default:
      throw new Error(`Unsupported export format: "${format}"`);
  }
}

async function buildDocx(outputType, content, markdown) {
  const paragraphs = [];
  const rawLines = markdown.split('\n');
  for (const line of rawLines) {
    if (line.startsWith('# ')) {
      paragraphs.push(new Paragraph({ text: line.slice(2), heading: HeadingLevel.TITLE }));
    } else if (line.startsWith('## ')) {
      paragraphs.push(new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_1 }));
    } else if (line.startsWith('- ')) {
      paragraphs.push(new Paragraph({ text: line.slice(2), bullet: { level: 0 } }));
    } else if (line.trim().startsWith('**') || line.trim() === '') {
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: line.replace(/\*\*/g, ''), bold: line.includes('**') })] }));
    } else {
      paragraphs.push(new Paragraph({ text: line }));
    }
  }
  const doc = new Document({ sections: [{ children: paragraphs }] });
  return Packer.toBuffer(doc);
}

async function buildPptx(content) {
  const pptx = new PptxGenJS();

  const title = pptx.addSlide();
  title.addText(content.title || 'Presentation', { x: 0.5, y: 2, w: 9, h: 1.2, fontSize: 32, bold: true });
  if (content.subtitle) title.addText(content.subtitle, { x: 0.5, y: 3.1, w: 9, h: 0.8, fontSize: 18, color: '666666' });

  for (const slide of content.slides || []) {
    const s = pptx.addSlide();
    s.addText(slide.slideTitle || `Slide ${slide.slideNumber}`, { x: 0.4, y: 0.3, w: 9.2, h: 0.8, fontSize: 24, bold: true });
    if (slide.mainContent) s.addText(slide.mainContent, { x: 0.4, y: 1.1, w: 9.2, h: 0.6, fontSize: 14, italic: true, color: '444444' });
    const bullets = (slide.bulletPoints || []).map((b) => ({ text: b, options: { bullet: true, fontSize: 16 } }));
    if (bullets.length) s.addText(bullets, { x: 0.4, y: 1.8, w: 9.2, h: 3.5 });
    if (slide.speakerNotes) s.addNotes(slide.speakerNotes);
  }

  return pptx.write({ outputType: 'nodebuffer' });
}
