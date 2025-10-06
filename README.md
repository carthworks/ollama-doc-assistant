t’s concise yet detailed, professional, and includes everything from overview to setup, usage, and roadmap.

# 🧠 Ollama Doc Assistant  
*A local, privacy-first AI Q&A app built with Next.js, Ollama (Qwen3:4b), and BM25 document retrieval.*

![Tech Stack](https://img.shields.io/badge/Next.js-13%2B-black?logo=next.js) ![Tailwind](https://img.shields.io/badge/TailwindCSS-3-blue?logo=tailwindcss) ![Ollama](https://img.shields.io/badge/Ollama-Qwen3%3A4b-green) ![License](https://img.shields.io/badge/License-MIT-orange)

---

## 🚀 Overview  
**Ollama Doc Assistant** lets you chat with your own documents — **entirely offline**.  
It combines a **Next.js frontend**, a **Node.js backend**, **BM25 search** for context retrieval, and **Ollama’s Qwen3:4b** model for intelligent, local answers.

---

## ✨ Features  
- 🤖 **Local AI Assistant** — powered by Ollama + Qwen3:4b  
- 🧩 **Document Q&A** — ask questions directly from your `/docs`  
- ⚙️ **BM25 Retrieval** — finds the most relevant context for answers  
- 🧾 **Clean Markdown UI** — formatted answers, code highlighting & sources  
- 🚀 **Next.js 13 + Tailwind UI** — fast, responsive, and extendable  
- 🔒 **100% Private** — runs fully on your machine, no external APIs  

---

## 🧠 How It Works  
1. You type a question in the web UI.  
2. The app retrieves related text chunks from `/docs` using BM25.  
3. It sends your question + context to **Ollama (Qwen3:4b)** locally.  
4. Ollama generates a context-aware, formatted answer.  
5. The answer is displayed beautifully with markdown & sources.

---

## 🏗️ Architecture  


Next.js (frontend + backend API)
│
├── app/
│ ├── page.jsx → Main UI page
│ ├── api/answer/route.js → Backend route to Ollama
│ └── components/EnhancedEditor.jsx → Modern Q&A editor
│
├── scripts/
│ └── ingest.js → Builds BM25 index from /docs
│
├── lib/
│ └── search.js → Performs document search
│
├── docs/ → Place your Markdown/Text files here
└── data/index.json → Generated BM25 index


---

## ⚙️ Installation  

### Prerequisites  
- Node.js **v18+**  
- [Ollama](https://ollama.ai) installed locally  
- Qwen3 model pulled:  
  ```bash
  ollama pull qwen3:4b

Setup
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ollama-doc-assistant.git
cd ollama-doc-assistant

# Install dependencies
npm install

# Build document index
npm run ingest

# Start Ollama in a new terminal
ollama run qwen3:4b

# Start the app
npm run dev


Then open 👉 http://localhost:3000

📂 Folder Structure
.
├── app/
│   ├── api/answer/route.js
│   ├── components/EnhancedEditor.jsx
│   └── page.jsx
├── scripts/
│   └── ingest.js
├── lib/
│   └── search.js
├── docs/
│   └── sample.md
├── data/
│   └── index.json
└── README.md

⚡ Environment Variables

Optional .env.local settings:

OLLAMA_URL=http://localhost:11434
OLLAMA_FETCH_TIMEOUT_MS=30000

💬 Example Questions

“Summarize architecture.md in 3 bullet points.”

“List all APIs mentioned in my documentation.”

“Explain this JavaScript function step by step.”

“What is JWT authentication and how does it work?”

🔮 Roadmap

 Add chat memory & conversation history

 Enable streaming responses from Ollama

 Support PDF and Docx ingestion

 Integrate embeddings (Chroma / FAISS) for semantic search

 Add dark/light theme toggle

🤝 Contributing

Pull requests are welcome!
For major changes, open an issue first to discuss what you’d like to improve.

👨‍💻 Author

Karthikeyan T

💼 LinkedIn

📧 tkarthikeyan@gmail.com

🪪 License

Licensed under the MIT License — free to use, modify, and distribute.