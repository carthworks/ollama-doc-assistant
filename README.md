# Nextjs-qna-ollama-starter

Minimal Next.js (App Router) + Ollama (qwen3:4b) Q&A starter.

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Add your docs to `./docs` (markdown or txt).
3. Build index:
   ```bash
   npm run ingest
   ```
4. Start Ollama & model:
   ```bash
   ollama run qwen3:4b
   ```
5. Run dev server:
   ```bash
   npm run dev
   ```
6. Open http://localhost:3000

## Notes
- The project uses a simple BM25 index for retrieval (wink-bm25-text-search). Replace with Chroma/PGVector for semantic retrieval.
- Ensure Ollama is accessible at http://localhost:11434.
