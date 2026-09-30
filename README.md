# ContentForge

**One source. Every communication artefact.**

ContentForge is an AI-powered content transformation platform. Give it a piece
of source material — pasted text, a PDF, a DOCX, an image, or an article URL —
and it analyzes it once into a structured content model, then generates any
combination of LinkedIn posts, X/Twitter posts, advisory documents, executive
summaries, presentation outlines, infographic specs, and video production
packages from that *same* underlying interpretation.

```
SOURCE → AI ANALYSIS → STRUCTURED CONTENT MODEL → SPECIALIZED GENERATORS → VALIDATED OUTPUTS
```

---

## 1. Documented deviations from the original spec

Two decisions were made to keep this a genuinely working, locally-runnable
product rather than a design document:

1. **SQLite instead of PostgreSQL.** The schema (`server/db/init.js`) is
   plain, portable SQL with no SQLite-only features. All data access goes
   through that one file. To move to Postgres: swap `better-sqlite3` for
   `pg` (or an ORM like Prisma/Knex), keep the same table shapes, and update
   `db.prepare(...).run/get/all` call sites — nothing else in the app touches
   the database directly.
2. **Video *input* (upload + transcription) is not implemented.** Doing this
   properly requires an audio-extraction (ffmpeg) + speech-to-text pipeline
   that isn't reliable to stand up as a demo dependency. Rather than fake it,
   the UI does not offer video upload, and the extraction service throws a
   clear, honest error if a video source type is requested. **Video as an
   *output*** (a full script/storyboard/production package generated from
   text/PDF/DOCX/image/URL source) **is fully implemented.** If you need real
   video transcription, paste the transcript as text, or add a
   `ffmpeg + whisper` extraction step to `services/extraction/extractionService.js`
   — the pipeline is structured so that's a self-contained addition.

Everything else in the spec — file extraction, image OCR, URL scraping, the
structured content model, all 7 output generators, quality validation,
editing, regeneration, versioning, exports, and history — is real, working
code, not a mock.

---

## 2. Architecture

```
client/           React + Vite + Tailwind — the dashboard & results workspace
server/
  db/              SQLite connection + schema
  middleware/      upload (multer), error handling
  routes/, controllers/   REST API
  services/
    ai/            provider abstraction (Gemini implemented) + core AI service
    extraction/    PDF / DOCX / TXT / image OCR / URL article extraction
    transformation/  the orchestrator — the pipeline itself
    validation/    deterministic structural checks
    export/        TXT / Markdown / DOCX / PPTX generation
  prompts/         analyzer prompt, one prompt module per output type, validator prompt
```

**Cost-efficiency by design:** the orchestrator makes exactly **one** analysis
call per transformation, regardless of how many outputs you select. Every
generator prompt receives the same structured content model as its single
source of truth (`prompts/shared.js` has the grounding rules every generator
prompt shares). One additional lightweight validation call runs per
generated output.

**Progress is real, not simulated.** `POST /api/transformations` returns
immediately with the transformation's id; the pipeline runs in the
background and writes its actual stage (`processing` → `analyzing` →
`generating` → `completed`/`failed`) to the database as it goes. The
frontend polls `GET /api/transformations/:id` and reflects whatever stage
the backend is really in.

---

## 3. Setup

### Prerequisites
- Node.js 18+
- A Google Gemini API key (Google AI Studio)

### Backend

```bash
cd server
npm install
cp .env.example .env
# edit .env and set GEMINI_API_KEY=your_gemini_api_key
npm run dev
```

The API server starts on `http://localhost:4000`. SQLite database and
`uploads/` are created automatically on first run — no separate migration
step needed.

### Frontend

```bash
cd client
npm install
npm run dev
```

The app opens on `http://localhost:5173` (Vite proxies `/api` to the backend
on port 4000 — see `client/vite.config.js`).

### Try it

1. Paste in an article, incident report, or announcement (or upload a
   PDF/DOCX/TXT/image, or paste a URL).
2. Select one or more output types (LinkedIn, X, Advisory, Executive
   Summary, Presentation, Infographic, Video).
3. Set audience / tone / language / detail level / objective / style.
4. Click **Transform Content** and watch it move through the real pipeline
   stages.
5. In the results workspace: switch between generated artefacts by tab,
   **Edit** and **Save** any output, **Regenerate** it from the same source,
   **Copy**, or **Download** (TXT/MD always available; DOCX for most types;
   PPTX for presentations).
6. **History** tab lists every past transformation — click one to reopen it.

---

## 4. Switching the AI provider

`server/services/ai/providerInterface.js` defines the contract
(`complete()` for text/JSON, `completeWithImage()` for vision/OCR).
`server/services/ai/geminiProvider.js` implements the provider contract.
The rest of the application talks only to the provider interface, so the
AI vendor integration remains isolated in one file.

---

## 5. Grounding & validation

Every generator prompt is instructed to draw *only* from the structured
content model (never invent people, dates, numbers, quotes, or events), and
to explicitly omit or flag information that isn't supported by the source
rather than fabricate it (`prompts/shared.js#GROUNDING_RULES`).

After generation, each output goes through:
1. **Structural checks** (`services/validation/validator.js`) — required
   fields present, not empty, format-appropriate — no AI call needed.
2. **AI quality validation** — a dedicated call compares the generated
   output against the structured model and configuration, flagging any
   unsupported claims, tone/language/detail mismatches, or contradictions.

Results surface in the UI as a **"Source-grounded"** badge, or a **"N
validation notes"** badge you can hover for specifics.

---

## 6. Known limitations (honesty over polish)

- Single local user, no auth — this is a local/demo build, not multi-tenant SaaS.
- PDF extraction requires a text-layer PDF (scanned/image-only PDFs will
  surface a clear error rather than silently returning nothing — route
  those through the image/OCR path instead).
- JS-rendered pages may not extract well via URL input (no headless browser).
- Rate limiting is basic (60 req/min/IP) — fine for local/demo use, not
  tuned for production traffic.
