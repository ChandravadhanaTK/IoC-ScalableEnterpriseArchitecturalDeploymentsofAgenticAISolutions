import React, { useState } from 'react';
import { useTasks } from '../../context/TaskContext';
import { useAuth } from '../../context/AuthContext';
import { TaskPriority, SecurityLevel, Subtask } from '../../types';
import { X, Sparkles, Shield, Bot, User, Check, Plus, Trash2 } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ isOpen, onClose }) => {
  const { addTask } = useTasks();
  const { currentUser, allUsers } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [impactScore, setImpactScore] = useState<number>(7);
  const [urgencyScore, setUrgencyScore] = useState<number>(7);
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>('internal');
  const [assignToAgent, setAssignToAgent] = useState<boolean>(true);
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [tagsInput, setTagsInput] = useState('Security, Platform, Agent');
  const [subtasks, setSubtasks] = useState<Subtask[]>([
    { id: 'st-1', title: 'Analyze requirements and verify threat boundary', completed: false, agentCapable: true, agentStatus: 'idle', toolUsed: 'ThreatAnalyzer' },
    { id: 'st-2', title: 'Synthesize code implementation in isolated sandbox', completed: false, agentCapable: true, agentStatus: 'idle', toolUsed: 'CodeSynthesizer' },
  ]);

  if (!isOpen) return null;

  // Live quadrant preview
  const getQuadrantPreview = () => {
    if (impactScore >= 7 && urgencyScore >= 7) return { name: 'Quadrant 1: DO FIRST', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    if (impactScore >= 7 && urgencyScore < 7) return { name: 'Quadrant 2: SCHEDULE', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
    if (impactScore < 7 && urgencyScore >= 7) return { name: 'Quadrant 3: DELEGATE', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { name: 'Quadrant 4: BACKLOG', color: 'text-slate-400 bg-slate-800 border-slate-700' };
  };

  const getAutoPriority = (): TaskPriority => {
    if (impactScore >= 9 || (impactScore >= 8 && urgencyScore >= 8) || securityLevel === 'restricted') return 'P0_CRITICAL';
    if (impactScore >= 7 || urgencyScore >= 8) return 'P1_HIGH';
    if (impactScore >= 4 || urgencyScore >= 5) return 'P2_MEDIUM';
    return 'P3_LOW';
  };

  const handleGenerateAISubtasks = () => {
    if (!title) {
      alert('Please enter a task title first');
      return;
    }
    setSubtasks([
      { id: `st-${Date.now()}-1`, title: `Run static security analysis & fuzz testing on "${title}"`, completed: false, agentCapable: true, agentStatus: 'idle', toolUsed: 'SnykFuzzer' },
      { id: `st-${Date.now()}-2`, title: 'Execute implementation inside Firecracker microVM', completed: false, agentCapable: true, agentStatus: 'idle', toolUsed: 'SandboxRunner' },
      { id: `st-${Date.now()}-3`, title: 'Generate Git Pull Request and run regression benchmark', completed: false, agentCapable: true, agentStatus: 'idle', toolUsed: 'GitHubAPI' },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignedUser = allUsers.find(u => u.id === selectedUserId) || currentUser;
    const priority = getAutoPriority();
    const hitlRequired = priority === 'P0_CRITICAL' || securityLevel === 'restricted';

    addTask({
      title,
      description: description || 'Autonomous task generated for enterprise platform.',
      priority,
      status: hitlRequired ? 'hitl_approval' : 'todo',
      assignee: assignToAgent
        ? {
            id: 'agent_core',
            name: 'Todo Autonomous Agent v3',
            avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
            isAgent: true,
          }
        : {
            id: assignedUser.id,
            name: assignedUser.name,
            avatar: assignedUser.avatar,
          },
      createdBy: currentUser.name,
      dueDate: new Date(dueDate).toISOString(),
      impactScore,
      urgencyScore,
      estimatedHours: 4,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      dependencies: [],
      subtasks,
      securityLevel,
      hitlRequired,
      toolRequirements: ['CodeSynthesizer', 'SandboxRunner', 'AuditLogger'],
      confidenceScore: 95,
      agentNotes: hitlRequired ? 'Awaiting Human-In-The-Loop approval gate (P0 / Restricted).' : undefined,
    });

    onClose();
  };

  const quad = getQuadrantPreview();
  const computedPriority = getAutoPriority();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white">Create New Enterprise Task</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Task will be evaluated by the Multi-Factor Prioritization Agent and assigned to the Eisenhower matrix.
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Task Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Implement Zero-Day Guardrail Filter for Prompt Injections"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Description & Acceptance Criteria</label>
            <textarea
              rows={3}
              placeholder="Detail architecture context, required tool capabilities, or SLA constraints..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Eisenhower Multi-Factor Sliders */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Multi-Factor Prioritization Weights
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${quad.color}`}>
                  {quad.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-white border border-slate-700 font-bold">
                  {computedPriority}
                </span>
              </div>
            </div>

            {/* Impact Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Business Impact / Criticality</span>
                <span className="font-bold text-indigo-300 font-mono">{impactScore} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={impactScore}
                onChange={(e) => setImpactScore(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Urgency Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Urgency / SLA Proximity</span>
                <span className="font-bold text-indigo-300 font-mono">{urgencyScore} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={urgencyScore}
                onChange={(e) => setUrgencyScore(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Security Level & Assignee Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Security Classification</label>
              <select
                value={securityLevel}
                onChange={(e) => setSecurityLevel(e.target.value as SecurityLevel)}
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none"
              >
                <option value="public">Public (Open Ingestion)</option>
                <option value="internal">Internal (Standard)</option>
                <option value="confidential">Confidential (Encrypted State)</option>
                <option value="restricted">Restricted (Mandatory P0 & HITL Gate)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Assignee Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Execution Assignment</label>
            <div className="flex gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                <input
                  type="radio"
                  name="assignee"
                  checked={assignToAgent}
                  onChange={() => setAssignToAgent(true)}
                  className="accent-indigo-500"
                />
                <Bot className="w-4 h-4 text-purple-400" />
                Assign to Todo Autonomous Agent
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-200">
                <input
                  type="radio"
                  name="assignee"
                  checked={!assignToAgent}
                  onChange={() => setAssignToAgent(false)}
                  className="accent-indigo-500"
                />
                <User className="w-4 h-4 text-slate-400" />
                Assign to Team Member
              </label>
            </div>
          </div>

          {/* Subtasks with AI decomposition */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Decomposed Subtasks</label>
              <button
                type="button"
                onClick={handleGenerateAISubtasks}
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Auto-Decompose with Agent
              </button>
            </div>

            <div className="space-y-1.5">
              {subtasks.map((st, idx) => (
                <div key={st.id} className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 text-xs">
                  <span className="text-slate-300 font-mono text-[11px] truncate">{st.title}</span>
                  <button
                    type="button"
                    onClick={() => setSubtasks(subtasks.filter((_, i) => i !== idx))}
                    className="text-slate-600 hover:text-red-400 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
            >
              Create Task & Register in Audit Trail
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
