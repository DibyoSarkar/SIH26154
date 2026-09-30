// Rough character-based chunker. ~4 chars per token is a safe conservative
// estimate for English text, so a 12,000-char chunk is comfortably inside
// context limits even after prompt overhead.
const CHUNK_CHARS = 12000;
const CHUNK_OVERLAP = 500;

export function needsChunking(text) {
  return text.length > CHUNK_CHARS * 1.15; // small headroom before bothering
}

export function chunkText(text) {
  if (!needsChunking(text)) return [text];

  const chunks = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + CHUNK_CHARS, text.length);
    // try to break on a paragraph boundary near the end
    let breakPoint = text.lastIndexOf('\n\n', end);
    if (breakPoint <= i + CHUNK_CHARS * 0.5) breakPoint = end;
    chunks.push(text.slice(i, breakPoint));
    i = breakPoint - CHUNK_OVERLAP;
    if (i < 0) i = breakPoint;
    if (breakPoint >= text.length) break;
  }
  return chunks;
}
