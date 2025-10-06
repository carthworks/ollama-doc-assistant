// app/api/answer/route.js
import { NextResponse } from 'next/server';
import { query as retrieve } from '../../../lib/search';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

export async function POST(req) {
  try {
    const { question } = await req.json();
    if (!question) return NextResponse.json({ error: 'question required' }, { status: 400 });

    const contexts = await retrieve(question, 4);

    const contextText = contexts.map((c, i) => `[[${c.id}]]\n${c.text}`).join('\n\n');
    const system = `You are a concise assistant. Use the provided CONTEXT chunks to answer. If the answer is not in the context, say 'I don't know'. Always end with a SOURCES section listing the chunk IDs used.`;
    const userMsg = `CONTEXT:\n${contextText}\n\nQUESTION: ${question}`;

    const resp = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen3:4b',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userMsg }
        ],
        stream: false
      }),
    });

    const j = await resp.json();

    let answer = '';
    if (j && j.choices && j.choices[0] && j.choices[0].message) {
      answer = j.choices[0].message.content;
    } else if (j && j.output) {
      answer = j.output[0]?.content?.[0]?.text || JSON.stringify(j);
    } else {
      answer = JSON.stringify(j);
    }

    return NextResponse.json({ answer, contexts });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
