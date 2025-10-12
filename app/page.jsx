'use client';

import { useState, useRef } from 'react';
import EnhancedEditor from '../components/EnhancedEditor';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { FiCopy, FiDownload, FiShare2, FiChevronDown, FiChevronUp } from 'react-icons/fi';

export default function Page() {
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const answerRef = useRef(null);

  // Clean & extract readable text from Ollama/Qwen
  const extractAnswerText = (response) => {
    if (!response) return '';
    if (response.answer) {
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
      console.log(j);
      setAnswer(j);
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

  // 🔧 Utility functions for Copy / Export / Share
  const getAnswerText = () => extractAnswerText(answer) || '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getAnswerText());
      alert('✅ Answer copied to clipboard');
    } catch {
      alert('❌ Copy failed');
    }
  };

  const downloadFile = (name, data, mime = 'text/plain') => {
    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportTxt = () => downloadFile('answer.txt', getAnswerText(), 'text/plain;charset=utf-8');
  const exportMd = () => downloadFile('answer.md', getAnswerText(), 'text/markdown;charset=utf-8');
  const exportPdf = () => {
    const win = window.open('', '_blank');
    const html = `
      <html>
      <head>
        <title>Answer Export</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 2rem; color: #111; }
          pre { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h2>Ollama Doc Assistant - Answer</h2>
        <div>${marked.parse(getAnswerText())}</div>
        <script>window.onload = function(){ window.print(); }</script>
      </body>
      </html>`;
    win.document.write(html);
    win.document.close();
  };

  const handleShare = async () => {
    const text = getAnswerText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Ollama Doc Assistant Answer',
          text,
        });
      } catch {
        alert('❌ Share canceled or not supported');
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert('📋 Answer copied to clipboard (share not supported)');
    }
  };

  // Format duration in human readable format
  const formatDuration = (nanoseconds) => {
    if (!nanoseconds) return 'N/A';
    const seconds = nanoseconds / 1_000_000_000;
    if (seconds < 1) return `${(seconds * 1000).toFixed(2)}ms`;
    return `${seconds.toFixed(2)}s`;
  };

  // Get raw data from answer.raw or fallback to answer
  const getRawData = () => {
    if (answer && answer.raw) {
      return answer.raw;
    }
    return answer || {};
  };

  const rawData = getRawData();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        <EnhancedEditor
          initialText={'# Ask your docs\n\nType a question then press Ctrl/Cmd + Enter.'}
          onAsk={onAsk}
        />

        {/* 🧠 Answer Section */}
        {answer && (
          <section
            ref={answerRef}
            className="mt-6 p-6 bg-white rounded-lg border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Answer</h3>
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={handleCopy}
                  title="Copy Answer"
                  className="px-3 py-1 rounded-md border border-slate-300 hover:bg-slate-100 flex items-center gap-2"
                >
                  <FiCopy size={14} /> Copy
                </button>
                <button
                  onClick={exportTxt}
                  title="Export as Text"
                  className="px-3 py-1 rounded-md border border-slate-300 hover:bg-slate-100"
                >
                  .txt
                </button>
                <button
                  onClick={exportMd}
                  title="Export as Markdown"
                  className="px-3 py-1 rounded-md border border-slate-300 hover:bg-slate-100"
                >
                  .md
                </button>
                <button
                  onClick={exportPdf}
                  title="Export as PDF"
                  className="px-3 py-1 rounded-md border border-slate-300 hover:bg-slate-100"
                >
                  .pdf
                </button>
                <button
                  onClick={handleShare}
                  title="Share Answer"
                  className="px-3 py-1 rounded-md border border-slate-300 hover:bg-slate-100 flex items-center gap-2"
                >
                  <FiShare2 size={14} /> Share
                </button>
              </div>
            </div>

            {/* 🧩 Answer Body */}
            <div
              className="prose max-w-none text-slate-800 leading-relaxed mt-3"
              dangerouslySetInnerHTML={renderMarkdown(getAnswerText())}
            />

            {/* 📚 Sources */}
            {answer.contexts && (
              <div className="mt-6 border-t pt-3">
                <h4 className="text-sm font-medium text-slate-600 mb-2">
                  Sources
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

            {/* 🔍 Raw Data Section */}
            <div className="mt-6 border-t pt-4">
              <button
                onClick={() => setShowRawData(!showRawData)}
                className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 font-medium"
              >
                {showRawData ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
                {showRawData ? 'Hide Raw Response Data' : 'Show Raw Response Data'}
              </button>
              
              {showRawData && (
                <div className="mt-3 text-xs text-slate-600 bg-slate-50 p-4 rounded-md border border-slate-200 overflow-x-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><span className="font-medium">created_at:</span> {rawData.created_at || 'N/A'}</div>
                    <div><span className="font-medium">done:</span> {rawData.done ? 'true' : 'false'}</div>
                    <div><span className="font-medium">done_reason:</span> {rawData.done_reason || 'N/A'}</div>
                    <div><span className="font-medium">eval_count:</span> {rawData.eval_count || 'N/A'}</div>
                    <div><span className="font-medium">eval_duration:</span> {formatDuration(rawData.eval_duration)}</div>
                    <div><span className="font-medium">load_duration:</span> {formatDuration(rawData.load_duration)}</div>
                    <div><span className="font-medium">model:</span> {rawData.model || 'N/A'}</div>
                    <div><span className="font-medium">prompt_eval_count:</span> {rawData.prompt_eval_count || 'N/A'}</div>
                    <div><span className="font-medium">prompt_eval_duration:</span> {formatDuration(rawData.prompt_eval_duration)}</div>
                    <div><span className="font-medium">total_duration:</span> {formatDuration(rawData.total_duration)}</div>
                  </div>
                  
                  {/* Message object */}
                  {rawData.message && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="font-medium mb-2">message:</div>
                      <div className="pl-4">
                        <div><span className="font-medium">role:</span> {rawData.message.role || 'N/A'}</div>
                        <div><span className="font-medium">content:</span> {rawData.message.content || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        <div className="mt-6 text-sm text-slate-500">
          {loading ? 'Thinking…' : 'Ready'}
        </div>
      </div>
    </main>
  );
}