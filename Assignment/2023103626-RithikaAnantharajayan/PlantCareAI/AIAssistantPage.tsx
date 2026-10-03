import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlants } from '../context/PlantContext';
import { AgentChatMessage } from '../types/agent';
import { ChatMessage } from '../components/chat/ChatMessage';
import { runAgentQuery } from '../services/agentService';
import { 
  Bot, 
  Send, 
  Sparkles, 
  RotateCcw, 
  HelpCircle, 
  Cpu, 
  ShieldCheck, 
  CheckCircle2, 
  Wrench,
  Key
} from 'lucide-react';
import { getGeminiApiKey } from '../config/gemini';

export const AIAssistantPage: React.FC = () => {
  const { user } = useAuth();
  const { plants, refreshData } = usePlants();
  const location = useLocation();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AgentChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `Hello! I am your **PlantCare AI Assistant**. ??

I am an autonomous agent equipped with direct tools to query your botanical database, assess hydration urgency, formulate vacation survival schedules, and calibrate care tasks.

What can I assist you with today? Click any prompt below or ask a custom question!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isUsingGeminiKey = Boolean(getGeminiApiKey());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle URL prefilled query parameter (e.g. from Plant Detail "Ask AI About This Plant")
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const plantParam = params.get('plant');
    if (plantParam) {
      setInput(`How should I care for my ${plantParam}?`);
    }
  }, [location.search]);

  const suggestedPrompts = [
    'Which of my plants need attention today?',
    'Create a care plan for my plants.',
    "I'm going on vacation for 7 days. What should I do?",
    "Why are my plant's leaves turning yellow?",
    'How should I care for my Money Plant?',
    'Show me my overdue care tasks.',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || !user || loading) return;

    const userMessage: AgentChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const assistantMessage = await runAgentQuery(queryText, user.uid, messages);
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: `I encountered an unexpected issue while analyzing your plant care data. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionComplete = async (actionId: string, status: 'confirmed' | 'cancelled', resultMsg: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.pendingAction && m.pendingAction.id === actionId) {
          return {
            ...m,
            pendingAction: {
              ...m.pendingAction,
              status,
            },
          };
        }
        return m;
      })
    );
    await refreshData();
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-msg-' + Date.now(),
        role: 'assistant',
        content: `Chat session reset. How can I assist with your plant collection today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4 flex flex-col h-[calc(100vh-5rem)]">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-600 text-white flex items-center justify-center shadow-soft">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900">PlantCare AI Assistant</h1>
              <span className="text-[10px] bg-forest-100 text-forest-800 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-500 animate-pulse"></span>
                <span>Active Agent</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Autonomous botanical reasoning engine � {plants.length} plants under active surveillance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200/60">
            <Cpu className="w-3.5 h-3.5 text-forest-600" />
            <span>{isUsingGeminiKey ? 'Gemini 1.5 Flash' : 'Agentic Engine Active'}</span>
          </div>

          <button
            onClick={handleResetChat}
            title="Reset conversation"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested Prompts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-slate-400 font-medium flex-shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-forest-600" />
          <span>Suggested:</span>
        </span>
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            disabled={loading}
            onClick={() => handleSendMessage(prompt)}
            className="px-3 py-1.5 bg-white hover:bg-forest-50 text-slate-700 hover:text-forest-800 border border-slate-200/80 hover:border-forest-200 rounded-xl whitespace-nowrap shadow-xs transition-all flex-shrink-0 disabled:opacity-50 text-[11px] font-medium"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 bg-slate-50/60 rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-inner overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onActionComplete={handleActionComplete}
            />
          ))}

          {loading && (
            <div className="flex items-start gap-3 my-4">
              <div className="w-8 h-8 rounded-xl bg-forest-600 text-white flex items-center justify-center flex-shrink-0 shadow-soft">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 rounded-tl-xs shadow-soft space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-forest-700">
                  <span className="w-2 h-2 rounded-full bg-forest-500 animate-ping"></span>
                  <span>Agent Reasoning & Analyzing Plant Data...</span>
                </div>
                <div className="flex gap-1.5 pt-1">
                  <div className="w-2 h-2 rounded-full bg-forest-400 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-forest-500 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 rounded-full bg-forest-600 animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="bg-white rounded-2xl p-2 border border-slate-200/80 shadow-soft flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Ask PlantCare AI Assistant about your plants, schedules, or vacation planning..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 px-3 py-2 text-xs sm:text-sm border-none focus:outline-none focus:ring-0 text-slate-800"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 bg-forest-600 hover:bg-forest-700 text-white rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:hover:bg-forest-600 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
