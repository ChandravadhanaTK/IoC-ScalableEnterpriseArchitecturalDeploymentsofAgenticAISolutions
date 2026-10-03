import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Trash2, Sparkles, Loader2 } from 'lucide-react';
import type { AppData, AgentMessage } from '@/types';
import { processAgentMessage, AGENT_EXAMPLE_PROMPTS } from '@/lib/financeAgent';
import { generateId } from '@/lib/storage';
import { Button } from '@/components/Button';
import { Card, EmptyState } from '@/components/ui';
import { ConfirmDialog } from '@/components/Modal';

interface AgentPageProps {
  data: AppData;
  onUpdateData: (data: AppData) => boolean;
}

export function AgentPage({ data, onUpdateData }: AgentPageProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  function send(rawText: string) {
    const text = rawText.trim();
    if (!text || processing) return;

    const userMsg: AgentMessage = {
      id: generateId(),
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setProcessing(true);

    // Simulate brief processing for UX
    setTimeout(() => {
      const response = processAgentMessage(text, data);
      const agentMsg: AgentMessage = {
        id: generateId(),
        role: 'agent',
        text: response.message,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, agentMsg]);
      if (response.updatedData) {
        onUpdateData(response.updatedData);
      }
      setProcessing(false);
    }, 300);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function useExample(prompt: string) {
    send(prompt);
  }

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Finance Agent</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ask questions or add transactions using natural language. Rule-based, runs in your browser.
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setClearConfirm(true)}>
            <Trash2 size={16} />
            Clear chat
          </Button>
        )}
      </div>

      <Card className="flex flex-col" >
        <div className="flex flex-col h-[60vh] min-h-[400px]">
          {/* Messages area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="p-4 bg-teal-50 rounded-2xl text-teal-600 mb-4">
                  <Bot size={40} />
                </div>
                <h3 className="font-semibold text-slate-700 text-lg">Hi, I'm your Finance Agent</h3>
                <p className="text-sm text-slate-500 mt-1 text-center max-w-md">
                  I can help you add transactions, check spending, and manage budgets.
                  Try one of these examples:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5 max-w-2xl w-full">
                  {AGENT_EXAMPLE_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => useExample(prompt)}
                      className="text-left text-sm text-slate-600 bg-slate-50 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 hover:border-teal-200 rounded-lg px-3 py-2.5 transition"
                    >
                      <Sparkles size={14} className="inline mr-1.5 text-teal-400" />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))
            )}
            {processing && (
              <div className="flex items-center gap-2 text-slate-400 text-sm pl-1">
                <Loader2 size={16} className="animate-spin" />
                Processing request...
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-slate-100 pt-4 mt-2">
            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command... (e.g., I spent ₹250 on lunch today)"
                rows={1}
                disabled={processing}
                className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none min-h-[44px] max-h-32 disabled:bg-slate-50"
                style={{ height: 'auto' }}
              />
              <Button type="submit" disabled={!input.trim() || processing} className="h-[44px]">
                <Send size={18} />
                <span className="hidden sm:inline">Send</span>
              </Button>
            </form>
            <p className="text-xs text-slate-400 mt-2">
              Press Enter to send. Shift+Enter for a new line.
            </p>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={clearConfirm}
        title="Clear chat history?"
        message="This will remove all messages from the chat. This action cannot be undone."
        confirmLabel="Clear"
        onConfirm={() => {
          setMessages([]);
          setClearConfirm(false);
        }}
        onCancel={() => setClearConfirm(false)}
      />
    </div>
  );
}

function MessageBubble({ message }: { message: AgentMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex-shrink-0 p-2 rounded-lg ${
          isUser ? 'bg-slate-100 text-slate-600' : 'bg-teal-50 text-teal-600'
        }`}
      >
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-slate-800 text-white'
            : 'bg-slate-50 text-slate-700 border border-slate-100'
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}
