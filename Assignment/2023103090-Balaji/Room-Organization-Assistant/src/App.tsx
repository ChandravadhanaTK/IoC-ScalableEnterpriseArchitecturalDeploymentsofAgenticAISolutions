import { useEffect, useMemo, useState } from 'react';

import ChatAssistant from './components/ChatAssistant';
import CleanupTask from './components/CleanupTask';
import Dashboard from './components/Dashboard';
import ProgressBar from './components/ProgressBar';
import RoomInput from './components/RoomInput';
import { askAssistant, generateCleanupPlan } from './services/aiService';
import {
  clearAllCleanupData,
  loadCleanupPlan,
  loadRoomDescription,
  saveCleanupPlan,
  saveRoomDescription,
} from './services/storageService';
import type { ChatMessage, CleanupPlan, TaskStatus } from './types';

const defaultMessages: ChatMessage[] = [
  {
    id: 'assistant-welcome',
    role: 'assistant',
    text: 'Hi! I can help you decide what to clean next based on your room and plan.',
  },
];

function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'plan' | 'assistant'>('dashboard');
  const [roomDescription, setRoomDescription] = useState<string>(() => loadRoomDescription());
  const [plan, setPlan] = useState<CleanupPlan | null>(() => loadCleanupPlan());
  const [messages, setMessages] = useState<ChatMessage[]>(defaultMessages);
  const [isRoomInputOpen, setIsRoomInputOpen] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [planError, setPlanError] = useState('');

  useEffect(() => {
    saveRoomDescription(roomDescription);
  }, [roomDescription]);

  useEffect(() => {
    if (plan) {
      saveCleanupPlan(plan);
    } else {
      clearAllCleanupData();
    }
  }, [plan]);

  const progress = useMemo(() => {
    if (!plan || plan.tasks.length === 0) {
      return 0;
    }

    const completedTasks = plan.tasks.filter((task) => task.status === 'COMPLETED').length;
    return (completedTasks / plan.tasks.length) * 100;
  }, [plan]);

  const handleGeneratePlan = async (description: string) => {
    setPlanError('');
    setIsGeneratingPlan(true);

    try {
      const nextPlan = await generateCleanupPlan(description);
      setRoomDescription(description);
      setPlan(nextPlan);
      setMessages((current) => [
        ...current.filter((message) => message.id !== 'assistant-welcome'),
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: `I created a plan for your room. ${nextPlan.summary}`,
        },
      ]);
      setIsRoomInputOpen(false);
      setActiveView('plan');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to generate your cleanup plan. Please try again.';
      setPlanError(message);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleUpdateTaskStatus = (taskId: string, nextStatus: TaskStatus) => {
    if (!plan) {
      return;
    }

    const updatedTasks = plan.tasks.map((task) =>
      task.id === taskId ? { ...task, status: nextStatus } : task,
    );

    setPlan({ ...plan, tasks: updatedTasks });
  };

  const handleAskAssistant = async (question: string) => {
    if (!plan) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: question,
    };

    setMessages((current) => [...current, userMessage]);
    setIsAskingAI(true);

    try {
      const answer = await askAssistant(question, roomDescription, plan);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: answer,
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'I could not answer that question right now.';
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          text: message,
        },
      ]);
    } finally {
      setIsAskingAI(false);
    }
  };

  const handleStartNewCleanup = () => {
    const confirmed = window.confirm(
      'Are you sure you want to start a new cleanup? Your current plan will be deleted.',
    );

    if (!confirmed) {
      return;
    }

    clearAllCleanupData();
    setPlan(null);
    setRoomDescription('');
    setMessages(defaultMessages);
    setPlanError('');
    setActiveView('dashboard');
  };

  const completedTasks = plan?.tasks.filter((task) => task.status === 'COMPLETED').length ?? 0;
  const remainingTasks = plan ? plan.tasks.length - completedTasks : 0;

  const navClass =
    'rounded-xl border px-3 py-2 text-sm font-medium transition';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-xl shadow-sm">🏠</div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Productivity</p>
              <h1 className="text-xl font-bold text-slate-900">Room Organization Assistant</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setActiveView('dashboard')} className={`${navClass} ${activeView === 'dashboard' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}>
              Dashboard
            </button>
            <button type="button" onClick={() => setActiveView('plan')} disabled={!plan} className={`${navClass} ${activeView === 'plan' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'} disabled:cursor-not-allowed disabled:opacity-50`}>
              Cleanup Plan
            </button>
            <button type="button" onClick={() => setActiveView('assistant')} disabled={!plan} className={`${navClass} ${activeView === 'assistant' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'} disabled:cursor-not-allowed disabled:opacity-50`}>
              Ask AI
            </button>
            <button type="button" onClick={handleStartNewCleanup} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
              Start New Cleanup
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        {activeView === 'dashboard' ? (
          <Dashboard
            plan={plan}
            onOpenRoomInput={() => setIsRoomInputOpen(true)}
            onViewPlan={() => setActiveView('plan')}
            onAskAI={() => setActiveView('assistant')}
          />
        ) : null}

        {activeView === 'plan' ? (
          <div className="space-y-6">
            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Current cleanup plan</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">{plan ? plan.summary : 'No cleanup plan generated yet'}</h2>
                </div>
                <button type="button" onClick={() => setIsRoomInputOpen(true)} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800">
                  {plan ? 'Update Room Description' : 'Describe My Room'}
                </button>
              </div>

              {plan ? (
                <div className="mt-5 space-y-4">
                  <ProgressBar value={progress} label="Completion" />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total tasks</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{plan.tasks.length}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Completed</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{completedTasks}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Remaining</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{remainingTasks}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            {planError ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{planError}</div> : null}

            {plan ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {plan.tasks.map((task) => (
                  <CleanupTask key={task.id} task={task} onUpdateStatus={handleUpdateTaskStatus} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
                <p className="text-lg font-semibold text-slate-700">No tasks yet.</p>
                <p className="mt-2 text-slate-600">Describe your room to generate a personalized cleanup plan.</p>
                <button type="button" onClick={() => setIsRoomInputOpen(true)} className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500">Generate Cleanup Plan</button>
              </div>
            )}
          </div>
        ) : null}

        {activeView === 'assistant' ? (
          <ChatAssistant
            plan={plan}
            roomDescription={roomDescription}
            messages={messages}
            isLoading={isAskingAI}
            onSendMessage={handleAskAssistant}
          />
        ) : null}
      </main>

      {isRoomInputOpen ? (
        <RoomInput
          initialDescription={roomDescription}
          isLoading={isGeneratingPlan}
          onClose={() => setIsRoomInputOpen(false)}
          onGenerate={handleGeneratePlan}
        />
      ) : null}
    </div>
  );
}

export default App;
