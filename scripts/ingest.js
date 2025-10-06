// scripts/ingest.js
const fs = require('fs-extra');
const path = require('path');
const bm25 = require('wink-bm25-text-search');
const tokenizer = require('wink-tokenizer')();

const docsDir = path.join(process.cwd(), 'docs');
const outIndex = path.join(process.cwd(), 'data', 'index.json');

async function loadDocs() {
  await fs.ensureDir(docsDir);
  const files = await fs.readdir(docsDir);
  const docs = [];
  for (const f of files) {
    const full = path.join(docsDir, f);
    const stat = await fs.stat(full);
    if (stat.isFile()) {
      const text = await fs.readFile(full, 'utf8');
      const chunks = text.split(/\n\n+/).filter(Boolean);
      chunks.forEach((c, i) => {
        // keep an id for human display, but the bm25 uniqueId will be the array index
        docs.push({ id: `${f}#${i + 1}`, title: f, body: c.trim() });
      });
    }
  }
  return docs;
}

async function buildIndex() {
  const docs = await loadDocs();
  // create engine
  const engine = bm25();

  // define config (fields and weights)
  engine.defineConfig({
    fldWeights: { title: 2, body: 1 },
    nGramLength: 1
  });

  // prep task using wink-tokenizer to return array of word tokens
  engine.definePrepTasks([
    (text) => {
      const toks = tokenizer.tokenize(String(text || ''));
      return toks.filter(t => t.tag === 'word').map(t => t.value.toLowerCase());
    }
  ]);

  // add docs to engine. uniqueId is the numeric index
  docs.forEach((doc, i) => {
    // document shape must match fldWeights keys
    engine.addDoc({ title: doc.title, body: doc.body }, i);
  });

  // consolidate for searching
  engine.consolidate();

  // save the docs only (we rebuild engine at query time)
  await fs.ensureDir(path.dirname(outIndex));
  await fs.writeJson(outIndex, { docs }, { spaces: 2 });

  console.log(`Indexed ${docs.length} chunks into ${outIndex}`);
}

buildIndex().catch(err => {
  console.error(err);
  process.exit(1);
});
