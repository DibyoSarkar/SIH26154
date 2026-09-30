import fs from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { getAIProvider } from '../ai/providerFactory.js';

// pdf-parse has a quirky CJS default export; import lazily to avoid its
// debug-mode self-test running on import in some environments.
async function extractPdf(filePath) {
  const pdfParse = (await import('pdf-parse')).default;
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  if (!data.text || !data.text.trim()) {
    throw new Error('PDF appears to contain no extractable text (it may be a scanned/image-only PDF).');
  }
  return data.text.trim();
}

async function extractDocx(filePath) {
  const mammoth = (await import('mammoth')).default;
  const result = await mammoth.extractRawText({ path: filePath });
  if (!result.value || !result.value.trim()) {
    throw new Error('DOCX appears to contain no extractable text.');
  }
  return result.value.trim();
}

async function extractTxt(filePath) {
  const text = fs.readFileSync(filePath, 'utf-8');
  if (!text.trim()) throw new Error('Text file is empty.');
  return text.trim();
}

async function extractImage(filePath, mediaType) {
  const provider = getAIProvider();
  const base64Image = fs.readFileSync(filePath).toString('base64');
  const text = await provider.completeWithImage({
    system: 'You transcribe and describe the visual/textual content of images for a downstream content-analysis pipeline. Be literal and complete. Do not add opinions or invent text that is not visible.',
    prompt: 'Transcribe all readable text in this image verbatim (OCR). Then, on a new line starting with "VISUAL CONTEXT:", briefly and factually describe what the image depicts (charts, photos, diagrams, people, setting) so a text-only analysis step can use it. Do not invent facts not visible in the image.',
    base64Image,
    mediaType,
  });
  if (!text || !text.trim()) throw new Error('Could not extract any content from the image.');
  return text.trim();
}

const BLOCKED_URL_PATTERNS = [/^https?:\/\/(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|169\.254\.|\[::1\])/i];

async function extractUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('The URL provided is not valid.');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http/https URLs are supported.');
  }
  if (BLOCKED_URL_PATTERNS.some((re) => re.test(url))) {
    throw new Error('This URL points to a private/internal address and cannot be fetched.');
  }

  let html;
  try {
    const resp = await axios.get(url, {
      timeout: 10000,
      maxContentLength: 5 * 1024 * 1024,
      headers: { 'User-Agent': 'ContentForge/1.0 (article extractor)' },
      validateStatus: (s) => s < 400,
    });
    html = resp.data;
  } catch (e) {
    throw new Error(`Could not fetch the URL (${e.response?.status || e.code || 'network error'}).`);
  }

  const $ = cheerio.load(html);
  $('script, style, nav, footer, header, aside, form, noscript, iframe, .advertisement, .ad, .cookie-banner').remove();

  // Prefer <article>, then main, then body — grab the largest text block.
  const candidates = ['article', 'main', '[role="main"]', 'body'];
  let bestText = '';
  for (const sel of candidates) {
    const t = $(sel).text().replace(/\s+/g, ' ').trim();
    if (t.length > bestText.length) bestText = t;
  }

  const title = $('title').first().text().trim() || $('h1').first().text().trim() || '';

  if (!bestText || bestText.length < 100) {
    throw new Error('Could not extract meaningful article content from this URL (page may be JS-rendered or paywalled).');
  }

  return { title, text: bestText };
}

/**
 * Normalizes any supported source input into plain text ready for AI analysis.
 * @param {object} input
 * @param {'text'|'pdf'|'docx'|'txt'|'image'|'url'} input.sourceType
 * @param {string} [input.rawText]
 * @param {string} [input.filePath]
 * @param {string} [input.mediaType]
 * @param {string} [input.url]
 */
export async function extractContent(input) {
  const { sourceType } = input;

  switch (sourceType) {
    case 'text':
      if (!input.rawText || !input.rawText.trim()) throw new Error('No text was provided.');
      return { text: input.rawText.trim(), meta: {} };

    case 'pdf':
      return { text: await extractPdf(input.filePath), meta: { filename: input.filename } };

    case 'docx':
      return { text: await extractDocx(input.filePath), meta: { filename: input.filename } };

    case 'txt':
      return { text: await extractTxt(input.filePath), meta: { filename: input.filename } };

    case 'image': {
      const text = await extractImage(input.filePath, input.mediaType);
      return { text, meta: { filename: input.filename, extractionMethod: 'vision-ocr' } };
    }

    case 'url': {
      const { title, text } = await extractUrl(input.url);
      return { text, meta: { url: input.url, title } };
    }

    default:
      throw new Error(`Unsupported source type: "${sourceType}". Video upload/transcription is not implemented in this build — see README.`);
  }
}
