import { CareTask } from '../types';
import { db, isFirebaseConfigured } from '../config/firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { getLocalItems, saveLocalItems, formatDate, addDays } from './plantService';

export const fetchUserTasks = async (userId: string): Promise<CareTask[]> => {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'careTasks'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const list: CareTask[] = [];
      snap.forEach(d => list.push({ ...d.data() as CareTask, id: d.id }));
      saveLocalItems('careTasks', userId, list);
      return list;
    } catch (e) {
      console.warn('Firestore fetchUserTasks error:', e);
    }
  }
  return getLocalItems<CareTask>('careTasks', userId);
};

export const saveCareTask = async (task: CareTask): Promise<CareTask> => {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'careTasks', task.id), task);
    } catch (e) {
      console.warn('Firestore saveCareTask error:', e);
    }
  }
  const existing = getLocalItems<CareTask>('careTasks', task.userId);
  const index = existing.findIndex(t => t.id === task.id);
  let updatedList: CareTask[];
  if (index >= 0) {
    updatedList = [...existing];
    updatedList[index] = task;
  } else {
    updatedList = [task, ...existing];
  }
  saveLocalItems('careTasks', task.userId, updatedList);
  return task;
};

export const completeCareTask = async (taskId: string, userId: string): Promise<CareTask | null> => {
  const existing = getLocalItems<CareTask>('careTasks', userId);
  const task = existing.find(t => t.id === taskId);
  if (!task) return null;

  const isNowCompleted = task.status !== 'completed';
  const updatedTask: CareTask = {
    ...task,
    status: isNowCompleted ? 'completed' : 'pending',
    completedAt: isNowCompleted ? new Date().toISOString() : undefined,
  };

  await saveCareTask(updatedTask);
  return updatedTask;
};

export const deleteCareTask = async (taskId: string, userId: string): Promise<void> => {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'careTasks', taskId));
    } catch (e) {
      console.warn('Firestore deleteCareTask error:', e);
    }
  }
  const existing = getLocalItems<CareTask>('careTasks', userId);
  saveLocalItems('careTasks', userId, existing.filter(t => t.id !== taskId));
};

export interface GroupedTasks {
  overdue: CareTask[];
  today: CareTask[];
  tomorrow: CareTask[];
  in3Days: CareTask[];
  later: CareTask[];
  completed: CareTask[];
}

export const groupTasksByTimeline = (tasks: CareTask[]): GroupedTasks => {
  const todayStr = formatDate(new Date());
  const tomorrowStr = addDays(todayStr, 1);
  const in3DaysStr = addDays(todayStr, 3);

  const result: GroupedTasks = {
    overdue: [],
    today: [],
    tomorrow: [],
    in3Days: [],
    later: [],
    completed: [],
  };

  tasks.forEach(task => {
    if (task.status === 'completed') {
      result.completed.push(task);
      return;
    }
    if (task.dueDate < todayStr) {
      result.overdue.push(task);
    } else if (task.dueDate === todayStr) {
      result.today.push(task);
    } else if (task.dueDate === tomorrowStr) {
      result.tomorrow.push(task);
    } else if (task.dueDate <= in3DaysStr) {
      result.in3Days.push(task);
    } else {
      result.later.push(task);
    }
  });

  // Sort each bucket by dueDate ascending
  const sorter = (a: CareTask, b: CareTask) => a.dueDate.localeCompare(b.dueDate);
  result.overdue.sort(sorter);
  result.today.sort(sorter);
  result.tomorrow.sort(sorter);
  result.in3Days.sort(sorter);
  result.later.sort(sorter);

  return result;
};
