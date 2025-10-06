'use client';

import { useState } from 'react';
import EnhancedEditor from '../components/EnhancedEditor';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default function Page() {
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🧠 Function to clean & extract readable text from Ollama/Qwen response
  const extractAnswerText = (response) => {
    if (!response) return '';
    // Direct model responses can be nested or plain text
    if (response.answer) {
      // If it's our API wrapper
      try {
        const parsed = JSON.parse(response.answer);
        if (parsed?.message?.content) return parsed.message.content;
      } catch {
        return response.answer;
      }
    }
    if (response.message?.content) return response.message.content;
    if (typeof response === 'string') {
      try {
        const parsed = JSON.parse(response);
        return parsed?.message?.content || response;
      } catch {
        return response;
      }
    }
    return JSON.stringify(response, null, 2);
  };

  const onAsk = async (content) => {
    setLoading(true);
    try {
      const res = await fetch('/api/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: content }),
      });
    const j = await res.json();
if (j?.error) {
  // show friendly message
  setAnswer({ error: j.error });
} else {
  setAnswer(j);
}

    } catch (err) {
      console.error('ask error', err);
      alert('Error contacting server. Check console.');
    } finally {
      setLoading(false);
    }
  };

  const renderMarkdown = (text) => {
    try {
      const html = marked.parse(text);
      return { __html: DOMPurify.sanitize(html) };
    } catch {
      return { __html: DOMPurify.sanitize(text) };
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        <EnhancedEditor
          initialText={'# Ask your docs\n\nType a question and press Ctrl/Cmd + Enter.'}
          onAsk={onAsk}
        />

        {/* 🧩 Answer section */}
        {answer && (
          <section className="mt-6 p-6 bg-white rounded-lg border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Answer</h3>

            {/* 🧠 Clean extracted content */}
            <div
              className="prose max-w-none text-slate-800 leading-relaxed"
              dangerouslySetInnerHTML={renderMarkdown(
                extractAnswerText(answer)
              )}
            />

            {/* 📚 Sources */}
            {answer.contexts && (
              <div className="mt-6 border-t pt-3">
                <h4 className="text-sm font-medium text-slate-600 mb-2">
                  Sources (retrieved chunks)
                </h4>
                <ul className="text-sm space-y-1">
                  {answer.contexts.map((c) => (
                    <li key={c.id} className="text-slate-700">
                      <strong>{c.id}</strong>: {c.text.slice(0, 150)}...
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {answer?.error && <div className="text-red-600">Error: {answer.error}</div>}

          </section>
        )}

        {/* Status line */}
        <div className="mt-6 text-sm text-slate-500">
          {loading ? 'Thinking…' : 'Ready'}
        </div>
      </div>
    </main>
  );
}
