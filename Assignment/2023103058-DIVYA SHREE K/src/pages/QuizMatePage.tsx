import { useState, useRef, useEffect } from 'react';
import { useNav } from '@/nav';
import { useApp } from '@/context';
import { runAgent, AgentResponse } from '@/agent/agent';
import { AgentActivity } from '@/components/AgentActivity';
import { AgentStep, QuizConfig, Question } from '@/types';
import { Bot, Send, User as UserIcon, Sparkles, FileQuestion } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  action?: string;
  quiz?: Question[];
  quizConfig?: QuizConfig;
}

const SUGGESTIONS = [
  'Quiz me on cell biology',
  'Create a difficult Physics quiz on Newton\'s laws',
  'I am weak in integration. What should I revise?',
  'Create a study plan for Chemistry',
  'Analyze my performance',
];

export function QuizMatePage() {
  const { navigate } = useNav();
  const { results } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'ai',
      content: "Hi! I'm QuizMate, your AI learning assistant. I can generate quizzes, analyze your performance, recommend topics, and create study plans. What would you like to do?",
    },
  ]);
  const [input, setInput] = useState('');
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, steps]);

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    setSteps([]);

    const response = await runAgent(msg, results, (phase, label, status) => {
      setSteps(prev => {
        const idx = prev.findIndex(s => s.phase === phase);
        if (idx === -1) return [...prev, { phase: phase as any, label, status }];
        const next = [...prev];
        next[idx] = { ...next[idx], label, status };
        return next;
      });
    });

    setMessages(prev => [...prev, {
      role: 'ai',
      content: response.message,
      action: response.action?.label,
      quiz: response.quiz,
      quizConfig: response.quizConfig,
    }]);
    setSteps([]);
    setLoading(false);
  };

  const formatContent = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      const lines = part.split('\n');
      return lines.map((line, j) => (
        <span key={`${i}-${j}`}>{line}{j < lines.length - 1 && <br />}</span>
      ));
    });
  };

  return (
    <div className="page-body" style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="sidebar-logo"><Bot size={22} /></div>
        <div>
          <h1 className="page-title" style={{ fontSize: 22 }}>QuizMate AI</h1>
          <p className="page-subtitle" style={{ fontSize: 13 }}>Your agentic AI learning assistant</p>
        </div>
      </div>

      <div className="card flex flex-col flex-1" style={{ overflow: 'hidden', minHeight: 0 }}>
        <div className="chat-messages" style={{ flex: 1 }}>
          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-ai'}`}>
              <div className={`chat-avatar ${msg.role === 'user' ? 'chat-avatar-user' : 'chat-avatar-ai'}`}>
                {msg.role === 'user' ? <UserIcon size={18} /> : <Bot size={18} />}
              </div>
              <div className="chat-bubble">
                <div>{formatContent(msg.content)}</div>
                {msg.action && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={12} /> {msg.action}
                  </div>
                )}
                {msg.quiz && msg.quiz.length > 0 && (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: 12 }}
                    onClick={() => navigate('takequiz', { questions: msg.quiz, config: msg.quizConfig })}
                  >
                    <FileQuestion size={16} /> Take This Quiz ({msg.quiz.length} questions)
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && <AgentActivity steps={steps} />}
          <div ref={messagesEndRef} />
        </div>

        {messages.length <= 1 && !loading && (
          <div style={{ padding: '0 16px 8px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>Try asking:</div>
            <div className="pill-group">
              {SUGGESTIONS.map(s => (
                <button key={s} className="pill" onClick={() => handleSend(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        <div className="chat-input-bar">
          <input
            className="form-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            placeholder="Ask QuizMate anything..."
            disabled={loading}
          />
          <button className="btn btn-primary" onClick={() => handleSend()} disabled={loading || !input.trim()}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
