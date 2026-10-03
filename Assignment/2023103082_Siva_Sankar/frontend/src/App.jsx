import React, { useState, useEffect, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mindsupport-ai-production.up.railway.app';

export default function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi there! This is a completely anonymous, secure safe space to chat about academic pressures, burnout, or anything on your mind. How are you holding up today?" }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMsg = { role: 'user', content: input };
    const contextHistory = messages.slice(-6);

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, history: contextHistory }),
      });

      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const fallbackData = await response.json();
        if (fallbackData.crisisTriggered) {
          setMessages((prev) => [...prev, {
            role: 'assistant',
            isCrisis: true,
            content: `⚠️ Please stay safe. We hear you and want to support you right now. Since AI tools can't replace immediate human help, please reach out to professional campus support lines immediately at ${fallbackData.suggestedHelpline}. You are not alone.`
          }]);
          setIsStreaming(false);
          return;
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let completeResponse = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const decodedToken = decoder.decode(value, { stream: true });
        completeResponse += decodedToken;

        setMessages((prev) => {
          const buffer = [...prev];
          buffer[buffer.length - 1].content = completeResponse;
          return buffer;
        });
      }

    } catch (error) {
      console.error("Connection error:", error);
      setMessages((prev) => [...prev, { role: 'assistant', content: "An unexpected error occurred. Please check if your backend server is running." }]);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-between items-center p-4 sm:p-6 md:p-8 selection:bg-zinc-700 selection:text-white">
      
      {/* Dark Mode Header Bar */}
      <div className="w-full max-w-3xl flex justify-between items-center bg-zinc-900 border border-zinc-800 px-6 py-4 rounded-2xl shadow-xl mb-4">
        <div>
          <h1 className="text-lg font-bold text-zinc-100 tracking-tight">MindSupport AI</h1>
          <p className="text-xs text-zinc-500 font-medium">✨ Completely Encrypted & Anonymous</p>
        </div>
        <a 
          href="tel:9152987821" 
          className="bg-rose-950/30 border border-rose-900/50 text-rose-400 px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-rose-950/60 transition-all duration-200"
        >
          SOS Crisis Helpline
        </a>
      </div>

      {/* Main Dark Canvas Area */}
      <div className="w-full max-w-3xl flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[65vh]">
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-zinc-900/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-base leading-relaxed transition-all duration-300 ${
                msg.role === 'user'
                  // Premium Metallic Black Finish for User Bubbles
                  ? 'bg-gradient-to-br from-zinc-700 via-zinc-800 to-black text-zinc-100 rounded-br-none font-medium shadow-lg border border-zinc-600/30'
                  : msg.isCrisis 
                  ? 'bg-rose-950/40 border border-rose-900/60 text-rose-200 rounded-bl-none font-semibold shadow-inner'
                  // Balanced Contrast Gray Finish for AI Responses
                  : 'bg-zinc-800 text-zinc-100 rounded-bl-none border border-zinc-700/50 shadow-sm'
              }`}>
                {msg.content === '' ? (
                  <span className="flex items-center gap-1.5 py-1">
                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                ) : msg.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Form Box Container */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800/80 bg-zinc-900/80 flex gap-3 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            placeholder="Type how you are feeling (e.g., 'Feeling burnt out by exams...')"
            className="flex-1 border border-zinc-700 bg-zinc-950 text-zinc-200 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-zinc-600/50 focus:border-zinc-500 disabled:opacity-60 transition-all duration-200 placeholder-zinc-600 shadow-inner"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="bg-gradient-to-b from-zinc-600 via-zinc-700 to-zinc-900 text-zinc-100 px-6 py-3.5 rounded-xl text-base font-semibold hover:from-zinc-500 hover:to-zinc-800 active:scale-[0.98] disabled:opacity-20 disabled:pointer-events-none transition-all duration-200 shadow-lg border border-zinc-600/30"
          >
            Send
          </button>
        </form>
      </div>
      
      <p className="text-[11px] text-zinc-600 text-center mt-4 max-w-md tracking-wide">
        Disclaimer: This AI prototype is built for hackathon evaluation purposes. It does not replace professional treatment.
      </p>
    </div>
  );
}