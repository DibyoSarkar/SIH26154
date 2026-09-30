import multer from 'multer';

// Maps known error shapes to safe, human-readable messages + status codes.
// Never leaks stack traces to the client.
export function errorHandler(err, req, res, _next) {
  console.error('[error]', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: `File too large. Max upload size is ${process.env.MAX_UPLOAD_MB || 15}MB.` });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  if (err.code === 'AI_INVALID_JSON') {
    return res.status(502).json({ error: 'The AI provider returned an unusable response after multiple attempts. Please try again.' });
  }

  if (err.status === 401 || /api[_-]?key/i.test(err.message || '')) {
    return res.status(500).json({ error: 'AI provider is not configured correctly on the server (check GEMINI_API_KEY).' });
  }

  if (err.status === 429 || /rate.?limit/i.test(err.message || '')) {
    return res.status(429).json({ error: 'The AI provider rate limit was hit. Please wait a moment and try again.' });
  }

  const message = err.expose || err.isSafe ? err.message : (err.message || 'Something went wrong. Please try again.');
  const status = err.statusCode || err.status || 500;
  res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
}

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Not found.' });
}
