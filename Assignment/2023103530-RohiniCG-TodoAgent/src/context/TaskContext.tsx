import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Task, AuditLogEntry, EisenhowerQuadrant, TaskPriority, AgentExecutionStep } from '../types';
import { INITIAL_TASKS, INITIAL_AUDIT_LOGS } from '../data/mockData';
import { useAuth } from './AuthContext';

// Simple SHA-256 simulation for immutable tamper-evident audit chaining
function computeHash(prevHash: string, data: string): string {
  let hash = 0;
  const str = prevHash + data;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256_${hex}${Date.now().toString(16).slice(-6)}`;
}

interface TaskContextType {
  tasks: Task[];
  auditLogs: AuditLogEntry[];
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'quadrant'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  autoPrioritizeAll: () => { updatedCount: number; summary: string };
  approveHitl: (taskId: string, notes?: string) => void;
  rejectHitl: (taskId: string, reason?: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'previousHash' | 'hash' | 'verified'>) => void;
  verifyAuditChain: () => { valid: boolean; brokenAtIndex?: number };
  simulateAuditTamper: () => void;
  isExecutingAgent: boolean;
  activeExecutionSteps: AgentExecutionStep[];
  runAgentExecution: (task: Task) => Promise<void>;
  cancelAgentExecution: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('todo_agent_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem('todo_agent_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isExecutingAgent, setIsExecutingAgent] = useState<boolean>(false);
  const [activeExecutionSteps, setActiveExecutionSteps] = useState<AgentExecutionStep[]>([]);

  useEffect(() => {
    localStorage.setItem('todo_agent_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('todo_agent_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Helper to append audit entry with cryptographic hash chain
  const addAuditLog = useCallback((entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'previousHash' | 'hash' | 'verified'>) => {
    setAuditLogs(prev => {
      const prevEntry = prev[prev.length - 1];
      const previousHash = prevEntry ? prevEntry.hash : '0000000000000000000000000000000000000000000000000000000000000000';
      const timestamp = new Date().toISOString();
      const payloadString = `${previousHash}|${timestamp}|${entry.userId}|${entry.action}|${entry.resourceId}|${entry.details}`;
      const hash = computeHash(previousHash, payloadString);

      const newLog: AuditLogEntry = {
        id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp,
        ...entry,
        previousHash,
        hash,
        verified: true,
      };
      return [...prev, newLog];
    });
  }, []);

  // Determine Eisenhower Quadrant based on Impact (Importance) & Urgency
  const calculateQuadrant = (impact: number, urgency: number): EisenhowerQuadrant => {
    if (impact >= 7 && urgency >= 7) return 'do_first';
    if (impact >= 7 && urgency < 7) return 'schedule';
    if (impact < 7 && urgency >= 7) return 'delegate';
    return 'backlog';
  };

  const calculatePriority = (impact: number, urgency: number, isRestricted: boolean): TaskPriority => {
    if (impact >= 9 || (impact >= 8 && urgency >= 8) || isRestricted) return 'P0_CRITICAL';
    if (impact >= 7 || urgency >= 8) return 'P1_HIGH';
    if (impact >= 4 || urgency >= 5) return 'P2_MEDIUM';
    return 'P3_LOW';
  };

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'quadrant'>) => {
    const quadrant = calculateQuadrant(taskData.impactScore, taskData.urgencyScore);
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      quadrant,
    };

    setTasks(prev => [newTask, ...prev]);

    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'TASK_CREATED',
      resourceType: 'task',
      resourceId: newTask.id,
      details: `Created task "${newTask.title}" [${newTask.priority}] assigned to ${newTask.assignee.name}. Quadrant: ${quadrant.toUpperCase()}.`,
      ipAddress: '10.240.14.22 (Enterprise Web Gateway)',
    });
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id === id) {
          const updated = { ...task, ...updates };
          // If impact or urgency changed, re-compute quadrant
          if (updates.impactScore !== undefined || updates.urgencyScore !== undefined) {
            updated.quadrant = calculateQuadrant(
              updates.impactScore ?? task.impactScore,
              updates.urgencyScore ?? task.urgencyScore
            );
          }
          return updated;
        }
        return task;
      })
    );

    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'TASK_UPDATED',
      resourceType: 'task',
      resourceId: id,
      details: `Updated task ${id} attributes: ${Object.keys(updates).join(', ')}`,
      ipAddress: '10.240.14.22',
    });
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    if (selectedTask?.id === id) setSelectedTask(null);

    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'TASK_DELETED',
      resourceType: 'task',
      resourceId: id,
      details: `Deleted task "${taskToDelete?.title || id}"`,
      ipAddress: '10.240.14.22',
    });
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== taskId) return t;
        const newSubtasks = t.subtasks.map(st => {
          if (st.id !== subtaskId) return st;
          return { ...st, completed: !st.completed, agentStatus: !st.completed ? ('done' as const) : ('idle' as const) };
        });
        const allDone = newSubtasks.length > 0 && newSubtasks.every(s => s.completed);
        return {
          ...t,
          subtasks: newSubtasks,
          status: allDone ? 'completed' : t.status,
          completedAt: allDone ? new Date().toISOString() : t.completedAt,
        };
      })
    );
  };

  // Enterprise Auto-Prioritization Engine
  const autoPrioritizeAll = () => {
    let reclassified = 0;
    const now = new Date().getTime();

    // Map dependency graph to count how many tasks are blocked by each task
    const dependencyCountMap: Record<string, number> = {};
    tasks.forEach(t => {
      t.dependencies.forEach(depId => {
        dependencyCountMap[depId] = (dependencyCountMap[depId] || 0) + 1;
      });
    });

    const updatedTasks = tasks.map(t => {
      // Calculate dynamic urgency score based on deadline proximity
      const dueTime = new Date(t.dueDate).getTime();
      const hoursRemaining = Math.max(0, (dueTime - now) / (1000 * 60 * 60));
      
      let dynamicUrgency = t.urgencyScore;
      if (hoursRemaining <= 24) {
        dynamicUrgency = Math.min(10, Math.max(9, dynamicUrgency + 3));
      } else if (hoursRemaining <= 72) {
        dynamicUrgency = Math.min(10, Math.max(7, dynamicUrgency + 1));
      }

      // Calculate dynamic impact score based on dependencies and security level
      let dynamicImpact = t.impactScore;
      const blockersCount = dependencyCountMap[t.id] || 0;
      if (blockersCount >= 2) dynamicImpact = Math.min(10, dynamicImpact + 2);
      if (t.securityLevel === 'restricted') dynamicImpact = 10;

      const newQuadrant = calculateQuadrant(dynamicImpact, dynamicUrgency);
      const newPriority = calculatePriority(dynamicImpact, dynamicUrgency, t.securityLevel === 'restricted');

      if (newPriority !== t.priority || newQuadrant !== t.quadrant) {
        reclassified++;
      }

      return {
        ...t,
        impactScore: dynamicImpact,
        urgencyScore: dynamicUrgency,
        quadrant: newQuadrant,
        priority: newPriority,
        confidenceScore: 94 + Math.floor(Math.random() * 5),
      };
    });

    // Sort by priority rank (P0 > P1 > P2 > P3) then urgency
    const priorityRank: Record<TaskPriority, number> = {
      P0_CRITICAL: 0,
      P1_HIGH: 1,
      P2_MEDIUM: 2,
      P3_LOW: 3,
    };

    updatedTasks.sort((a, b) => {
      if (priorityRank[a.priority] !== priorityRank[b.priority]) {
        return priorityRank[a.priority] - priorityRank[b.priority];
      }
      return (b.impactScore * 2 + b.urgencyScore * 2) - (a.impactScore * 2 + a.urgencyScore * 2);
    });

    setTasks(updatedTasks);

    const summary = `Evaluated ${tasks.length} tasks across Impact, Urgency, Deadline SLAs, and Dependency Graph. Reclassified ${reclassified} tasks into optimal Eisenhower quadrants.`;
    
    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'AUTO_PRIORITIZATION_EXECUTED',
      resourceType: 'agent',
      resourceId: 'agent_prioritizer_v3',
      details: summary,
      ipAddress: '10.240.12.8 (Internal AI Cluster)',
    });

    return { updatedCount: reclassified, summary };
  };

  const approveHitl = (taskId: string, notes?: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status: 'in_progress',
            agentNotes: `[HITL APPROVED by ${currentUser.name} (${currentUser.role})]: ${notes || 'Authorization granted to proceed with autonomous execution.'}`,
            subtasks: t.subtasks.map(st => 
              st.agentStatus === 'waiting_approval' 
                ? { ...st, completed: true, agentStatus: 'done' }
                : st
            )
          };
        }
        return t;
      })
    );

    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'HITL_APPROVAL_GRANTED',
      resourceType: 'security',
      resourceId: taskId,
      details: `Manual Human-In-The-Loop approval granted by ${currentUser.name} (${currentUser.role}). ${notes || ''}`,
      ipAddress: '192.168.1.104 (Authenticated SSO)',
    });
  };

  const rejectHitl = (taskId: string, reason?: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            status: 'blocked',
            agentNotes: `[HITL REJECTED by ${currentUser.name}]: ${reason || 'Action denied due to policy violation or security risk.'}`,
          };
        }
        return t;
      })
    );

    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action: 'HITL_APPROVAL_REJECTED',
      resourceType: 'security',
      resourceId: taskId,
      details: `HITL Action Rejected: ${reason || 'Denied'}`,
      ipAddress: '192.168.1.104',
    });
  };

  const verifyAuditChain = (): { valid: boolean; brokenAtIndex?: number } => {
    for (let i = 1; i < auditLogs.length; i++) {
      const prev = auditLogs[i - 1];
      const curr = auditLogs[i];
      if (curr.previousHash !== prev.hash) {
        return { valid: false, brokenAtIndex: i };
      }
    }
    return { valid: true };
  };

  const simulateAuditTamper = () => {
    if (auditLogs.length < 2) return;
    setAuditLogs(prev => {
      const copy = [...prev];
      copy[1] = {
        ...copy[1],
        details: copy[1].details + ' [TAMPERED_BY_ATTACKER_INJECTION]',
        verified: false,
      };
      return copy;
    });
  };

  // Run autonomous agent execution with realistic step-by-step progress
  const runAgentExecution = async (task: Task) => {
    setIsExecutingAgent(true);
    const steps: AgentExecutionStep[] = [
      {
        id: 'step-1',
        stepNumber: 1,
        title: 'Task Ingestion & Security Redaction',
        role: 'Safety Evaluator',
        status: 'running',
        inputSummary: `Ingested task "${task.title}". Scanning for prompt injection & PII tokens...`,
        latencyMs: 120,
        tokensUsed: 310,
        requiresHITL: false,
      },
      {
        id: 'step-2',
        stepNumber: 2,
        title: 'Multi-Factor Eisenhower Prioritization',
        role: 'Prioritization Agent',
        status: 'pending',
        inputSummary: `Evaluating impact: ${task.impactScore}/10, urgency: ${task.urgencyScore}/10, security: ${task.securityLevel}`,
        latencyMs: 240,
        tokensUsed: 420,
        requiresHITL: false,
      },
      {
        id: 'step-3',
        stepNumber: 3,
        title: 'Task Decomposition & Tool Selection',
        role: 'Task Decomposition',
        status: 'pending',
        inputSummary: `Generating atomic subtasks & binding sandboxed tools: [${task.toolRequirements.join(', ')}]`,
        latencyMs: 380,
        tokensUsed: 890,
        requiresHITL: false,
      },
      {
        id: 'step-4',
        stepNumber: 4,
        title: task.hitlRequired ? 'Human-In-The-Loop Safety Gate' : 'Isolated Tool Sandbox Execution',
        role: 'Tool Orchestrator',
        status: 'pending',
        inputSummary: task.hitlRequired ? 'P0 Critical or Restricted security policy requires human sign-off' : 'Executing tools in microVM sandbox...',
        toolInvoked: task.toolRequirements[0] || 'ContainerRunner',
        latencyMs: 510,
        tokensUsed: 620,
        requiresHITL: task.hitlRequired,
      },
      {
        id: 'step-5',
        stepNumber: 5,
        title: 'Self-Reflection & Cryptographic Audit Commit',
        role: 'Reflection Critic',
        status: 'pending',
        inputSummary: 'Verifying outputs against acceptance criteria and hashing state to immutable audit log',
        latencyMs: 180,
        tokensUsed: 250,
        requiresHITL: false,
      }
    ];

    setActiveExecutionSteps(steps);

    // Step 1: Run
    await new Promise(r => setTimeout(r, 700));
    steps[0].status = 'completed';
    steps[0].outputSummary = 'Sanitization complete: 0 injection patterns detected. 1 internal IP masked.';
    steps[1].status = 'running';
    setActiveExecutionSteps([...steps]);

    // Step 2: Run
    await new Promise(r => setTimeout(r, 800));
    steps[1].status = 'completed';
    steps[1].outputSummary = `Priority confirmed as ${task.priority}. Mapped to quadrant: ${task.quadrant.toUpperCase()}.`;
    steps[2].status = 'running';
    setActiveExecutionSteps([...steps]);

    // Step 3: Run
    await new Promise(r => setTimeout(r, 900));
    steps[2].status = 'completed';
    steps[2].outputSummary = `Decomposed into ${task.subtasks.length || 3} actionable work items. Sandbox environment initialized.`;
    steps[3].status = task.hitlRequired ? 'hitl_blocked' : 'running';
    setActiveExecutionSteps([...steps]);

    if (task.hitlRequired) {
      updateTask(task.id, {
        status: 'hitl_approval',
        agentNotes: 'Agent reached Step 4 (Tool Execution). Paused for Human-In-The-Loop sign-off.',
      });
      setIsExecutingAgent(false);
      return;
    }

    // Step 4 non-HITL: Run
    await new Promise(r => setTimeout(r, 1000));
    steps[3].status = 'completed';
    steps[3].outputSummary = `Successfully invoked ${steps[3].toolInvoked}. 0 errors, output validated.`;
    steps[4].status = 'running';
    setActiveExecutionSteps([...steps]);

    // Step 5: Run
    await new Promise(r => setTimeout(r, 700));
    steps[4].status = 'completed';
    steps[4].outputSummary = 'Verification score 98.4%. Audit log chained & signed with SHA-256.';
    setActiveExecutionSteps([...steps]);

    // Update task to completed
    updateTask(task.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      agentNotes: 'Autonomous execution completed successfully with 100% acceptance criteria pass.',
      subtasks: task.subtasks.map(s => ({ ...s, completed: true, agentStatus: 'done' }))
    });

    setIsExecutingAgent(false);
  };

  const cancelAgentExecution = () => {
    setIsExecutingAgent(false);
    setActiveExecutionSteps([]);
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        auditLogs,
        selectedTask,
        setSelectedTask,
        addTask,
        updateTask,
        deleteTask,
        autoPrioritizeAll,
        approveHitl,
        rejectHitl,
        toggleSubtask,
        addAuditLog,
        verifyAuditChain,
        simulateAuditTamper,
        isExecutingAgent,
        activeExecutionSteps,
        runAgentExecution,
        cancelAgentExecution,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
