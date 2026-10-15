import { useMemo, useState } from 'react';

import type { ChatMessage, CleanupPlan } from '../types';

interface ChatAssistantProps {
  plan: CleanupPlan | null;
  roomDescription: string;
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (question: string) => Promise<void> | void;
}

export default function ChatAssistant({
  plan,
  roomDescription,
  messages,
  isLoading,
  onSendMessage,
}: ChatAssistantProps) {
  const [draft, setDraft] = useState('');

  const contextSummary = useMemo(() => {
    if (!plan) {
      return 'Generate a cleanup plan first to get AI guidance.';
    }

    const currentTask = plan.tasks.find((task) => task.status !== 'COMPLETED');
    return currentTask ? `Current focus: ${currentTask.title}.` : 'All tasks are complete. Great job!';
  }, [plan]);

  const handleSubmit = async () => {
    const trimmed = draft.trim();

    if (!trimmed || !plan) {
      return;
    }

    setDraft('');
    await onSendMessage(trimmed);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">AI assistant</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Ask about your current plan</h2>
          </div>
          <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{contextSummary}</div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800">Room context</p>
          <p className="mt-2 line-clamp-3">{roomDescription || 'No room description saved yet.'}</p>
        </div>

        <div className="max-h-[420px] space-y-4 overflow-y-auto rounded-2xl bg-slate-50 p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-slate-600">Ask a question like: “What should I do first?”</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-700 ring-1 ring-slate-200'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            placeholder="What should I do first?"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white"
          />

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!plan || isLoading || !draft.trim()}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Thinking...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
