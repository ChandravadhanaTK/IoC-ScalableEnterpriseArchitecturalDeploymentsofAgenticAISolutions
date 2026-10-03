import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { Bot, Dumbbell, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { AxiosError } from 'axios';
import { coachApi } from '../api/client';
import { useWorkoutSession } from '../context/WorkoutSessionContext';

interface CoachMessage {
  role: 'user' | 'assistant';
  content: string;
}

const starterMessage: CoachMessage = {
  role: 'assistant',
  content: "Hey, I'm your workout coach. Tell me what you're training for, or ask me anything about your routine, form, or recovery."
};

const suggestedQuestions = [
  'How many sets should I do for a muscle group?',
  'How do I progressively overload?',
  'What should I do if an exercise hurts?'
];

export const WorkoutCoach: React.FC = () => {
  const { isRestTimerActive, restTimerSeconds } = useWorkoutSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CoachMessage[]>([starterMessage]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages, isSending]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async (event?: FormEvent, suggestedText?: string) => {
    event?.preventDefault();
    const content = (suggestedText ?? input).trim();
    if (!content || isSending) return;

    const nextMessages = [...messages, { role: 'user' as const, content }];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setIsSending(true);

    try {
      const response = await coachApi.chat(nextMessages.slice(-16));
      setMessages((current) => [...current, { role: 'assistant', content: response.reply }]);
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ error?: string }>;
      setError(axiosError.response?.data?.error || 'Could not reach the coach. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {isOpen && (
        <section
          aria-label="Workout Coach chat"
          className="fixed inset-x-3 bottom-20 sm:inset-x-auto sm:right-5 sm:bottom-20 z-50 flex h-[min(640px,calc(100dvh-112px))] flex-col overflow-hidden rounded-2xl border border-[#34394a] bg-[#11141d] shadow-2xl sm:w-[400px]"
        >
          <header className="flex items-center justify-between border-b border-[#262a3a] bg-[#171a24] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100">PULSE Workout Coach</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Ready to help
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close workout coach"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div ref={scrollContainerRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <p className="text-center text-[10px] leading-relaxed text-slate-500">
              Training guidance only. For pain, injuries, or medical concerns, consult a healthcare professional.
            </p>
            {messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'rounded-br-md bg-cyan-500 text-slate-950'
                    : 'rounded-bl-md border border-[#2d3242] bg-[#1a1e29] text-slate-200'
                }`}>
                  {message.content}
                </div>
              </div>
            ))}
            {messages.length === 1 && (
              <div className="space-y-2 pt-1">
                <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Try asking</p>
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => sendMessage(undefined, question)}
                    disabled={isSending}
                    className="block w-full rounded-lg border border-[#2d3242] px-3 py-2 text-left text-xs text-slate-300 transition hover:border-cyan-500/50 hover:bg-cyan-500/5 disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
            {isSending && (
              <div className="flex items-center gap-2 text-xs text-slate-400" role="status">
                <Sparkles className="h-3.5 w-3.5 animate-pulse text-cyan-400" /> Coach is thinking...
              </div>
            )}
            {error && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</p>}
          </div>

          <form onSubmit={(event) => sendMessage(event)} className="border-t border-[#262a3a] bg-[#151821] p-3">
            <div className="flex items-center gap-2 rounded-xl border border-[#34394a] bg-[#0d1017] px-3 focus-within:border-cyan-500/60">
              <Dumbbell className="h-4 w-4 shrink-0 text-slate-500" />
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask a workout question..."
                maxLength={2000}
                aria-label="Message the workout coach"
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                aria-label="Send message"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-400 text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Close Workout Coach' : 'Chat with Workout Coach'}
        aria-expanded={isOpen}
        title="Ask the Workout Coach"
        className={`fixed right-5 z-40 flex h-14 items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400 px-4 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-950/40 transition hover:bg-cyan-300 ${
          isRestTimerActive && restTimerSeconds > 0 ? 'bottom-56' : 'bottom-20 md:bottom-6'
        }`}
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <span>{isOpen ? 'Close' : 'Workout Coach'}</span>
      </button>
    </>
  );
};