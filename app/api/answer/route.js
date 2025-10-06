// app/api/answer/route.js
import { NextResponse } from 'next/server';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const FETCH_TIMEOUT_MS = Number(process.env.OLLAMA_FETCH_TIMEOUT_MS || 50000);
const start = Date.now();

export async function POST(req) {
  try {
    const { question } = await req.json();
    if (!question) {
      return NextResponse.json({ error: 'question required' }, { status: 400 });
    }

    // Build retrieval and prompt here (or accept contexts from client)
    // For now, we assume simple direct question -> model.
    const system = 'You are a concise assistant. Provide a helpful answer.';
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: question }
    ];

    // Abort / timeout support
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let resp;
    try {
      resp = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'qwen3:4b', messages, stream: false }),
        signal: controller.signal
      });
    } catch (fetchErr) {
      // Network-level error (connect refused, DNS, aborted)
      const duration = Date.now() - start;
      console.error('Fetch to Ollama failed after', duration, 'ms', fetchErr);
      const reason = fetchErr.name === 'AbortError'
        ? `timeout after ${FETCH_TIMEOUT_MS}ms`
        : fetchErr.message || String(fetchErr);
      return NextResponse.json({ error: `Failed to contact Ollama: ${reason}` }, { status: 502 });
    } finally {
      clearTimeout(id);
    }

    // Non-2xx handling
    if (!resp.ok) {
      const text = await resp.text().catch(() => '<no body>');
      console.error('Ollama returned non-OK:', resp.status, text);
      return NextResponse.json({ error: `Ollama responded ${resp.status}`, body: text }, { status: 502 });
    }

    // Parse JSON safely
    let j;
    try {
      j = await resp.json();
    } catch (err) {
      const txt = await resp.text().catch(() => '');
      console.error('Failed parsing Ollama JSON:', err, txt);
      return NextResponse.json({ error: 'Invalid JSON from Ollama', body: txt }, { status: 502 });
    }

    // Extract assistant content (defensive)
    let answerText = '';
    if (j?.message?.content) answerText = j.message.content;
    else if (j?.choices?.[0]?.message?.content) answerText = j.choices[0].message.content;
    else answerText = JSON.stringify(j);

    return NextResponse.json({ answer: answerText, raw: j });
  } catch (err) {
    console.error('Error in /api/answer:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
