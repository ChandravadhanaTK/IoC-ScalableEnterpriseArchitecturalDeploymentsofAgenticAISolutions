'use client';

import React, { useState } from 'react';
import { Sparkles, Send, User, Bot, RefreshCw, HelpCircle, MessageSquare } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const QUICK_QUESTIONS = [
  'How should I price my first project?',
  'How do I improve my portfolio?',
  'How should I approach a client?',
  'What skills should I learn next?',
  'How do I write a good proposal?'
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your **SkillBridge AI Freelancing Assistant**.\n\nAsk me anything about pricing your work, optimizing your technical portfolio, handling client negotiations, or upskilling for high-demand tech roles!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Sorry, I am unable to reply right now.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Assistant error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      
      {/* Header */}
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20">
          <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-indigo-400" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <span>✨ AI Freelancing Assistant</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
              Interactive AI
            </span>
          </h1>
          <p className="text-xs text-slate-400">Get instant, actionable advice on pricing, portfolios, proposals & client growth</p>
        </div>
      </div>

      {/* Suggested Quick Questions Pills */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Suggested Questions:</span>
        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleSendMessage(q)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/30 text-slate-300 hover:text-white rounded-xl text-xs font-medium transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 min-h-[450px] flex flex-col justify-between">
        
        {/* Messages List */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div className={`h-8 w-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow'
              }`}>
                {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>

              <div className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-600/30 border border-indigo-500/40 text-slate-100'
                  : 'bg-slate-950 border border-slate-800 text-slate-200'
              }`}>
                {m.role === 'assistant' && (
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800/80 text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
                    <span>✨ AI Generated Advice</span>
                    <span className="text-slate-500">{m.timestamp}</span>
                  </div>
                )}
                <div className="whitespace-pre-line">
                  {m.content}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-3 text-xs text-indigo-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>SkillBridge AI is drafting a response...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="pt-4 border-t border-slate-800 flex items-center space-x-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your freelancing question here..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-xs rounded-2xl shadow-lg transition-all flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span>Send</span>
          </button>
        </form>

      </div>

    </div>
  );
}
