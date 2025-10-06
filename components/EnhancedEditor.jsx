// app/components/EnhancedEditor.jsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-markdown.js';
import 'prismjs/components/prism-bash.js';
import 'prismjs/themes/prism-tomorrow.css'; // light/dark friendly
import { FiCopy, FiDownload, FiShare2, FiAlertCircle, FiMoon, FiSun, FiTrash2 } from 'react-icons/fi';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * EnhancedEditor
 * Props:
 * - initialText (string)
 * - onAsk (fn) optional, e.g. send to /api/answer
 */
export default function EnhancedEditor({ initialText = '', onAsk = null }) {
  const [text, setText] = useState(initialText);
  const [language, setLanguage] = useState('markdown'); // markdown, javascript, python, bash, text
  const [showPreview, setShowPreview] = useState(true);
  const [themeDark, setThemeDark] = useState(true);
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);
  const editorRef = useRef(null);

  const languageOptions = [
    { id: 'markdown', label: 'Markdown' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'python', label: 'Python' },
    { id: 'bash', label: 'Bash' },
    { id: 'text', label: 'Plain text' },
  ];

  // real-time lint / heuristic checks
  useEffect(() => {
    const newErrors = [];
    // bracket/paren balance check
    const pairs = { '()': 0, '{}': 0, '[]': 0 };
    for (const ch of text) {
      if (ch === '(') pairs['()']++;
      if (ch === ')') pairs['()']--;
      if (ch === '{') pairs['{}']++;
      if (ch === '}') pairs['{}']--;
      if (ch === '[') pairs['[]']++;
      if (ch === ']') pairs['[]']--;
    }
    Object.entries(pairs).forEach(([k, v]) => {
      if (v !== 0) newErrors.push({ type: 'brackets', message: `Unbalanced ${k.split('')[0]}${k.split('')[1]}.` });
    });

    // basic JS hint (if language is javascript)
    if (language === 'javascript') {
      // missing semicolons heuristic: lines that look like statements but don't end with ;, }, or ):
      const lines = text.split(/\r?\n/).slice(-50); // check last 50 lines for perf
      lines.forEach((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        if (/^[\w$.].*/.test(trimmed) && !/[\{\};:]$/.test(trimmed) && !trimmed.startsWith('//') && !trimmed.startsWith('return') && trimmed.includes(' ')) {
          newErrors.push({ type: 'js-semicolon', message: `Line ${i + 1}: possible missing semicolon.` });
        }
      });
    }

    // TODO / FIXME markers
    const todoMatches = [...text.matchAll(/\b(TODO|FIXME)\b[:\s-]?(.+)?/gi)];
    todoMatches.forEach(m => newErrors.push({ type: 'todo', message: `Note: ${m[0]}` }));

    // very long lines
    const longLine = text.split(/\r?\n/).find(l => l.length > 400);
    if (longLine) newErrors.push({ type: 'wrap', message: 'There is a very long line (>400 chars) — consider wrapping.' });

    // dedupe messages by message text
    const dedup = Array.from(new Map(newErrors.map(e => [e.message, e])).values());
    setErrors(dedup);
  }, [text, language]);

  // syntax highlighted preview for code (non-markdown)
  const highlightedCode = useMemo(() => {
    try {
      if (['javascript', 'python', 'bash'].includes(language)) {
        return Prism.highlight(text, Prism.languages[language], language);
      } else if (language === 'markdown') {
        // render markdown preview separately
        return null;
      } else {
        return Prism.highlight(text, Prism.languages.javascript, 'javascript');
      }
    } catch (e) {
      return null;
    }
  }, [text, language]);

  // HTML preview when markdown
  const markdownPreviewHtml = useMemo(() => {
    if (language !== 'markdown') return '';
    try {
      const raw = marked.parse(text || '');
      return DOMPurify.sanitize(raw);
    } catch (e) {
      return '';
    }
  }, [text, language]);

  // copy text to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard');
    } catch (e) {
      toast('Copy failed — fallback: select and Ctrl+C');
    }
  };

  // small ephemeral toast
  const toastRef = useRef(null);
  const toast = (msg, ms = 1800) => {
    if (!toastRef.current) {
      const div = document.createElement('div');
      div.id = 'ephemeral-toast';
      document.body.appendChild(div);
      toastRef.current = div;
    }
    const el = toastRef.current;
    el.textContent = msg;
    Object.assign(el.style, {
      position: 'fixed',
      right: '16px',
      bottom: '24px',
      background: 'rgba(17, 24, 39, 0.9)',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '8px',
      zIndex: 9999,
      fontSize: '13px',
      boxShadow: '0 6px 18px rgba(2,6,23,0.35)'
    });
    setTimeout(() => (el.textContent = ''), ms);
  };

  // download content helper
  const downloadFile = (name, data, mime = 'text/plain') => {
    const blob = new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // export handlers
  const exportText = () => downloadFile('snippet.txt', text, 'text/plain;charset=utf-8');
  const exportMarkdown = () => downloadFile('snippet.md', text, 'text/markdown;charset=utf-8');

  // export PDF via print (cross-browser friendly)
  const exportPDF = () => {
    const win = window.open('', '_blank');
    const content = language === 'markdown' ? markdownPreviewHtml : `<pre style="white-space:pre-wrap;font-family:monospace;">${escapeHtml(text)}</pre>`;
    const doc = `
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Export</title>
        <style>
          body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; padding:24px; color:#0f172a}
          pre{white-space:pre-wrap; font-family:monospace; font-size:13px}
          .container{max-width:900px; margin:0 auto}
        </style>
      </head>
      <body>
        <div class="container">${content}</div>
        <script>window.onload = function(){ window.print(); setTimeout(()=>window.close(), 500); }</script>
      </body>
      </html>
    `;
    win.document.open();
    win.document.write(doc);
    win.document.close();
  };

  // share content (Web Share API fallback to copy)
  const handleShare = async () => {
    const payload = { title: 'Code Snippet', text: text.slice(0, 200) + (text.length > 200 ? '...' : '') };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        toast('Shared successfully');
        return;
      } catch (e) {
        // fall through to fallback
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast('Share not available — snippet copied to clipboard');
    } catch (e) {
      toast('Share failed');
    }
  };

  // escape HTML for plain pre
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (m) { return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m]; });
  }

  // clear editor
  const handleClear = () => {
    // if (!confirm('Clear editor content?')) return;
    setText('');
    setErrors([]);
  };

  // run ask (if provided)
  const handleAsk = async () => {
    if (!onAsk) {
      toast('No ask handler configured (server required).');
      return;
    }
    setBusy(true);
    try {
      await onAsk(text);
    } catch (e) {
      console.error(e);
      toast('Error while sending request');
    } finally {
      setBusy(false);
    }
  };

  // keyboard shortcuts: Ctrl/Cmd + Enter = Ask, Ctrl/Cmd + S = export markdown
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleAsk();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        exportMarkdown();
        toast('Downloaded snippet.md');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // small responsive layout
  return (
    <div className={themeDark ? 'min-h-screen py-8 bg-slate-900 text-slate-100' : 'min-h-screen0 py-8 bg-slate-50 text-slate-900'}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <header className="flex items-start gap-4 md:items-center flex-col md:flex-row justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold leading-tight"> Ollama Doc Assistant</h1>
            <p className="mt-1 text-sm opacity-80 max-w-xl">
              A local, privacy-first AI Q&A app powered by Next.js, Qwen3:4b, and BM25 retrieval.*
              A fast, accessible editor for code & docs — real-time preview, syntax highlighting, export, share, and smart suggestions.
            </p>
          </div>

          <div className="flex gap-2 items-center mt-4 md:mt-0">
            <div className="flex items-center gap-2 bg-transparent p-1 rounded-md">
              <select
                aria-label="Language"
                className="bg-transparent border border-slate-700/40 text-sm rounded-md px-2 py-1 focus:outline-none"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {languageOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
              </select>
            </div>

            <button
              type="button"
              title="Toggle preview"
              onClick={() => setShowPreview(p => !p)}
              className="px-3 py-1 rounded-md border border-slate-700/40 text-sm hover:bg-slate-700/10 hidden"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>

            <button title="Copy" onClick={handleCopy} className=" hidden flex items-center gap-2 px-3 py-1 rounded-md border border-slate-700/40 hover:bg-slate-700/10 text-sm">
              <FiCopy /> Copy
            </button>

            <div className="relative hidden">
              <button title="Export" className="flex items-center gap-2 px-3 py-1 rounded-md border border-slate-700/40 hover:bg-slate-700/10 text-sm">
                <FiDownload /> Export
              </button>
              <div className="hidden absolute right-0 mt-2 w-44 bg-white/5 backdrop-blur-sm border border-slate-700/20 rounded-md p-2 shadow-md hidden group-hover:block">
                {/* a11y: below we'll display direct buttons (we also provide onClick on outside buttons) */}
              </div>
            </div>

            <div className="flex items-center gap-2 hidden" >
              <button title="Export as .txt" onClick={exportText} className="px-3 py-1 rounded-md border border-slate-700/40 text-sm hover:bg-slate-700/10">TXT</button>
              <button title="Export as Markdown" onClick={exportMarkdown} className="px-3 py-1 rounded-md border border-slate-700/40 text-sm hover:bg-slate-700/10">MD</button>
              <button title="Export as PDF" onClick={exportPDF} className="px-3 py-1 rounded-md border border-slate-700/40 text-sm hover:bg-slate-700/10">PDF</button>
            </div>

            <button title="Share" onClick={handleShare} className=" hidden px-3 py-1 rounded-md border border-slate-700/40 text-sm hover:bg-slate-700/10">
              <FiShare2 /> Share
            </button>

            <button title="Theme" onClick={() => setThemeDark(d => !d)} className="px-2 py-1 rounded-md border border-slate-700/40 text-sm hover:bg-slate-700/10">
              {themeDark ? <FiSun /> : <FiMoon />}
            </button>
          </div>
        </header>

        {/* Main grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Editor */}
          <section className="bg-white/5 p-4 rounded-lg border border-slate-700/30 min-h-[360px] flex flex-col">
            <label className="text-sm font-medium mb-2">Editor</label>
            <textarea
              aria-label="Code editor"
              ref={editorRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste code or write markdown here..."
              className="flex-1 resize-none w-full bg-transparent border border-slate-700/20 rounded-md p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs opacity-80">
                <span className="inline-flex items-center gap-2 px-2 py-1 bg-slate-800/30 rounded-md">Lines: {text.split(/\r?\n/).length}</span>
                <span className="inline-flex items-center gap-2 px-2 py-1 bg-slate-800/30 rounded-md">Chars: {text.length}</span>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={handleClear} className="px-3 py-1 rounded-md border border-slate-700/40 text-sm hover:bg-slate-700/10">
                  <FiTrash2 /> Clear
                </button>
                <button onClick={handleAsk} disabled={!onAsk || busy} className="px-4 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm">
                  {busy ? 'Working...' : 'Ask'}
                </button>
              </div>
            </div>
          </section>

          {/* Preview + errors */}
          <aside className="flex flex-col gap-4">
            <div className="bg-white/5 p-4 rounded-lg border border-slate-700/30 min-h-[240px]">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium">Preview</h2>
                <div className="text-xs opacity-80">{language.toUpperCase()}</div>
              </div>

              <div className="mt-3 prose dark:prose-invert max-h-[520px] overflow-auto">
                {language === 'markdown' ? (
                  <div dangerouslySetInnerHTML={{ __html: markdownPreviewHtml || ('<p class="opacity-60">Nothing to preview</p>') }} />
                ) : (
                  <pre className="rounded-md p-3 bg-slate-800/40 overflow-auto"><code dangerouslySetInnerHTML={{ __html: highlightedCode || escapeHtml(text || 'Nothing to preview') }} /></pre>
                )}
              </div>
            </div>

            {/* Suggestions / Errors */}
            <div className="bg-white/5 p-3 rounded-lg border border-slate-700/30">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2"><FiAlertCircle /> Suggestions</h3>
                <span className="text-xs opacity-80">{errors.length} found</span>
              </div>

              <ul className="mt-3 space-y-2 text-sm">
                {errors.length === 0 && <li className="text-sm opacity-70">No issues detected — good job! ✅</li>}
                {errors.map((err, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="inline-block mt-0.5 text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">{err.type}</span>
                    <div>
                      <div className="font-medium">{err.message}</div>
                      <div className="text-xs opacity-70">Suggestion: {suggestionFor(err)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick tips */}
            <div className="bg-white/5 p-3 rounded-lg border border-slate-700/30 text-sm">
              <strong>Quick Tips:</strong>
              <ul className="mt-2 list-disc ml-5 opacity-85">
                <li>Use Markdown for rich preview (headings, lists, code blocks).</li>
                <li>Press <kbd className="px-1 bg-slate-700/30 rounded">Ctrl/Cmd + Enter</kbd> to run Ask.</li>
                <li>Export using the buttons above (MD/TXT/PDF).</li>
              </ul>
            </div>
          </aside>
        </div>

        {/* Footer small */}
        <footer className="mt-6 text-xs text-slate-400 opacity-80">
          Built for speed · accessible · lightweight · <span className="opacity-90">Smart Snippet Studio</span>
        </footer>
      </div>
    </div>
  );

  // suggestion helper
  function suggestionFor(err) {
    if (!err) return '';
    if (err.type === 'brackets') return 'Check matching pairs, or split long expressions across lines.';
    if (err.type === 'js-semicolon') return 'Consider adding semicolons or verify expression end.';
    if (err.type === 'todo') return 'Resolve or move TODOs; they may indicate incomplete logic.';
    if (err.type === 'wrap') return 'Break long lines into smaller statements or markdown paragraphs.';
    return 'Consider reviewing this section.';
  }
}
