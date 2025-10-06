'use client';
import { useState } from 'react';

export default function Home() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [ans, setAns] = useState(null);

  async function ask(e) {
    e.preventDefault();
    setLoading(true);
    setAns(null);
    try {
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q })
      });
      const j = await res.json();
      setAns(j);
    } catch (err) {
      setAns({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Q&A (qwen3:4b + Ollama)</h1>
      <form onSubmit={ask} style={{ marginBottom: 12 }}>
        <textarea value={q} onChange={e => setQ(e.target.value)} rows={4} cols={60} placeholder="Ask a question..." />
        <br />
        <button type="submit" disabled={loading}> {loading ? 'Thinking...' : 'Ask'} </button>
      </form>

      {ans && ans.error && <div style={{ color: 'crimson' }}>{ans.error}</div>}

      {ans && ans.answer && (
        <section>
          <h2>Answer</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{ans.answer}</pre>

          <h3>Sources (retrieved chunks)</h3>
          <ul>
            {ans.contexts.map(c => (
              <li key={c.id}><strong>{c.id}</strong>: {c.text.slice(0, 200)}...</li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
