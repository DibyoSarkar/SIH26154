const BASE = '/api';

async function handle(res) {
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : await res.blob();
  if (!res.ok) {
    const message = isJson && body?.error ? body.error : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body;
}

export const api = {
  getConfig: () => fetch(`${BASE}/config`).then(handle),

  listTransformations: () => fetch(`${BASE}/transformations`).then(handle),

  getTransformation: (id) => fetch(`${BASE}/transformations/${id}`).then(handle),

  runTransformation: ({ sourceMode, text, url, file, title, selectedOutputs, config }) => {
    const form = new FormData();
    if (sourceMode === 'text') form.append('text', text);
    if (sourceMode === 'url') form.append('url', url);
    if (sourceMode === 'file' && file) form.append('file', file);
    if (title) form.append('title', title);
    form.append('selectedOutputs', JSON.stringify(selectedOutputs));
    form.append('config', JSON.stringify(config));

    return fetch(`${BASE}/transformations`, { method: 'POST', body: form }).then(handle);
  },

  updateOutput: (outputId, content) =>
    fetch(`${BASE}/outputs/${outputId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }).then(handle),

  resetOutput: (outputId) => fetch(`${BASE}/outputs/${outputId}/reset`, { method: 'POST' }).then(handle),

  regenerateOutput: (outputId, configOverride) =>
    fetch(`${BASE}/outputs/${outputId}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configOverride }),
    }).then(handle),

  exportUrl: (outputId, format) => `${BASE}/outputs/${outputId}/export?format=${format}`,
};
