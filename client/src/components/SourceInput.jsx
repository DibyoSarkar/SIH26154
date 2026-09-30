import React, { useRef, useState } from 'react';
import { FileText, Upload, Link2, X, File as FileIcon, Image as ImageIcon } from 'lucide-react';

const ACCEPTED = '.pdf,.docx,.txt,.png,.jpg,.jpeg,.webp';

function fileKind(file) {
  if (file.type === 'application/pdf') return { label: 'PDF', icon: FileIcon };
  if (file.type.includes('wordprocessingml')) return { label: 'DOCX', icon: FileIcon };
  if (file.type === 'text/plain') return { label: 'TXT', icon: FileText };
  if (file.type.startsWith('image/')) return { label: 'Image', icon: ImageIcon };
  return { label: 'File', icon: FileIcon };
}

export default function SourceInput({ sourceMode, setSourceMode, text, setText, url, setUrl, file, setFile }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setSourceMode('file');
  };

  const tabs = [
    { key: 'text', label: 'Paste Text' },
    { key: 'file', label: 'Upload File' },
    { key: 'url', label: 'URL' },
  ];

  return (
    <section className="bg-ink-900 border border-ink-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-100">1. Source Material</h2>
        <div className="flex gap-1 bg-ink-800 rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setSourceMode(t.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-ring ${
                sourceMode === t.key ? 'bg-accent-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {sourceMode === 'text' && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste an article, report, advisory, incident notes, or any free-form content here…"
          rows={10}
          className="w-full resize-y bg-ink-800 border border-ink-600 rounded-lg px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus-ring focus:border-accent-500"
        />
      )}

      {sourceMode === 'url' && (
        <div className="flex items-center gap-2">
          <Link2 size={18} className="text-slate-500 shrink-0" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            className="flex-1 bg-ink-800 border border-ink-600 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus-ring focus:border-accent-500"
          />
        </div>
      )}

      {sourceMode === 'file' && (
        <div>
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => inputRef.current?.click()}
              className={`cursor-pointer flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg py-10 transition-colors ${
                dragOver ? 'border-accent-500 bg-accent-500/5' : 'border-ink-600 hover:border-ink-500'
              }`}
            >
              <Upload size={28} className="text-slate-500" />
              <p className="text-sm text-slate-300">Drag & drop, or click to upload</p>
              <p className="text-xs text-slate-500">PDF, DOCX, TXT, PNG, JPEG, WEBP — up to 15MB</p>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          ) : (
            <FilePreview file={file} onRemove={() => setFile(null)} />
          )}
        </div>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Video upload/transcription is not implemented in this build — paste a transcript as text instead, or provide an article URL.
      </p>
    </section>
  );
}

function FilePreview({ file, onRemove }) {
  const { label, icon: Icon } = fileKind(file);
  const sizeKb = (file.size / 1024).toFixed(0);

  return (
    <div className="flex items-center gap-3 bg-ink-800 border border-ink-600 rounded-lg px-4 py-3">
      <div className="w-10 h-10 rounded-md bg-ink-700 flex items-center justify-center shrink-0">
        <Icon size={18} className="text-accent-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-100 truncate">{file.name}</p>
        <p className="text-xs text-slate-500">{label} · {sizeKb} KB · ready to process</p>
      </div>
      <button onClick={onRemove} className="p-1.5 rounded-md hover:bg-ink-700 text-slate-400 hover:text-slate-200 focus-ring">
        <X size={16} />
      </button>
    </div>
  );
}
