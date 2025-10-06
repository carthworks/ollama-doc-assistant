import './globals.css';

export const metadata = { title: 'Q&A (Ollama)', description: 'Q&A app' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
