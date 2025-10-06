// lib/search.js
const fs = require('fs-extra');
const path = require('path');
const bm25 = require('wink-bm25-text-search');
const tokenizer = require('wink-tokenizer')();

const indexPath = path.join(process.cwd(), 'data', 'index.json');

function cleanQuery(q) {
  const toks = tokenizer.tokenize(String(q || ''));
  return toks.filter(t => t.tag === 'word').map(t => t.value.toLowerCase()).join(' ');
}

async function query(q, topK = 3) {
  // load docs
  const payload = await fs.readJson(indexPath);
  const docs = payload.docs || [];

  // build engine from docs (cheap for small corpora)
  const engine = bm25();
  engine.defineConfig({
    fldWeights: { title: 2, body: 1 },
    nGramLength: 1
  });
  engine.definePrepTasks([
    (text) => {
      const toks = tokenizer.tokenize(String(text || ''));
      return toks.filter(t => t.tag === 'word').map(t => t.value.toLowerCase());
    }
  ]);

  // add docs back (uniqueId is the docs array index)
  docs.forEach((doc, i) => {
    engine.addDoc({ title: doc.title, body: doc.body }, i);
  });

  engine.consolidate();

  const prepared = cleanQuery(q);
  const results = engine.search(prepared); // returns array of [ docIndex, score ]

  const top = results.slice(0, topK).map(r => {
    const idx = r[0];
    const score = r[1];
    const doc = docs[idx];
    return {
      id: doc?.id || `${idx}`,
      title: doc?.title || '',
      text: doc?.body || '',
      score
    };
  });

  return top;
}

module.exports = { query };
