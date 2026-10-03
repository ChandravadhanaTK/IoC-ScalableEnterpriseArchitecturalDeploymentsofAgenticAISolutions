import { Plant, CareStatus, CareTask, CareRecord } from '../types';
import { db, isFirebaseConfigured } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where 
} from 'firebase/firestore';

export const formatDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addDays = (dateStr: string, days: number): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return formatDate(d);
};

export const computePlantStatus = (nextWateringDate: string): CareStatus => {
  const todayStr = formatDate(new Date());
  if (nextWateringDate < todayStr) {
    return 'Overdue';
  }
  if (nextWateringDate === todayStr) {
    return 'Care Due';
  }
  const tomorrowStr = addDays(todayStr, 1);
  if (nextWateringDate === tomorrowStr) {
    return 'Care Due';
  }
  return 'Healthy';
};

const getLocalKey = (collectionName: string, userId: string) => `plantcare_${collectionName}_${userId}`;

export const getLocalItems = <T>(collectionName: string, userId: string): T[] => {
  try {
    const raw = localStorage.getItem(getLocalKey(collectionName, userId));
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading localStorage:', e);
    return [];
  }
};

export const saveLocalItems = <T>(collectionName: string, userId: string, items: T[]) => {
  try {
    localStorage.setItem(getLocalKey(collectionName, userId), JSON.stringify(items));
  } catch (e) {
    console.error('Error saving localStorage:', e);
  }
};

// --- PLANT OPERATIONS ---
export const fetchUserPlants = async (userId: string): Promise<Plant[]> => {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'plants'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const list: Plant[] = [];
      snap.forEach((d) => {
        const data = d.data() as Plant;
        list.push({ ...data, id: d.id, status: computePlantStatus(data.nextWateringDate) });
      });
      saveLocalItems('plants', userId, list);
      return list;
    } catch (e) {
      console.warn('Firestore fetchUserPlants error, falling back to local storage:', e);
    }
  }
  const localList = getLocalItems<Plant>('plants', userId);
  return localList.map(p => ({ ...p, status: computePlantStatus(p.nextWateringDate) }));
};

export const savePlant = async (plant: Plant): Promise<Plant> => {
  const updatedStatus = computePlantStatus(plant.nextWateringDate);
  const updatedPlant: Plant = {
    ...plant,
    status: updatedStatus,
    updatedAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'plants', updatedPlant.id), updatedPlant);
    } catch (e) {
      console.warn('Firestore savePlant error:', e);
    }
  }

  const existing = getLocalItems<Plant>('plants', plant.userId);
  const index = existing.findIndex(p => p.id === plant.id);
  let updatedList: Plant[];
  if (index >= 0) {
    updatedList = [...existing];
    updatedList[index] = updatedPlant;
  } else {
    updatedList = [updatedPlant, ...existing];
  }
  saveLocalItems('plants', plant.userId, updatedList);
  return updatedPlant;
};

export const deletePlant = async (plantId: string, userId: string): Promise<void> => {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'plants', plantId));
    } catch (e) {
      console.warn('Firestore deletePlant error:', e);
    }
  }

  const existing = getLocalItems<Plant>('plants', userId);
  const filtered = existing.filter(p => p.id !== plantId);
  saveLocalItems('plants', userId, filtered);

  // Also clean up tasks and records for this plant
  const tasks = getLocalItems<CareTask>('careTasks', userId).filter(t => t.plantId !== plantId);
  saveLocalItems('careTasks', userId, tasks);
  const records = getLocalItems<CareRecord>('careRecords', userId).filter(r => r.plantId !== plantId);
  saveLocalItems('careRecords', userId, records);
};

// --- WATERING WORKFLOW ---
export const markPlantAsWatered = async (
  plant: Plant, 
  notes?: string
): Promise<{ plant: Plant; record: CareRecord; nextTask: CareTask }> => {
  const todayStr = formatDate(new Date());
  const nextWateringDate = addDays(todayStr, plant.wateringFrequency);

  const updatedPlant: Plant = {
    ...plant,
    lastWatered: todayStr,
    nextWateringDate,
    status: 'Healthy',
    updatedAt: new Date().toISOString(),
  };

  // 1. Save updated plant
  await savePlant(updatedPlant);

  // 2. Create Care Record
  const record: CareRecord = {
    id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    userId: plant.userId,
    plantId: plant.id,
    plantName: plant.name,
    action: 'Watered',
    date: todayStr,
    notes: notes || 'Standard watering performed.',
    isDemo: plant.isDemo,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'careRecords', record.id), record);
    } catch (e) {
      console.warn('Firestore record error:', e);
    }
  }
  const records = getLocalItems<CareRecord>('careRecords', plant.userId);
  saveLocalItems('careRecords', plant.userId, [record, ...records]);

  // 3. Mark existing pending water tasks for this plant as completed
  const currentTasks = getLocalItems<CareTask>('careTasks', plant.userId);
  const updatedTasks = currentTasks.map(t => {
    if (t.plantId === plant.id && t.status === 'pending' && t.dueDate <= todayStr) {
      return { ...t, status: 'completed' as const, completedAt: new Date().toISOString() };
    }
    return t;
  });

  // 4. Schedule the next watering task
  const nextTask: CareTask = {
    id: 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    userId: plant.userId,
    plantId: plant.id,
    plantName: plant.name,
    taskType: 'Water',
    dueDate: nextWateringDate,
    status: 'pending',
    notes: `Scheduled cycle every ${plant.wateringFrequency} days.`,
    isDemo: plant.isDemo,
    createdAt: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'careTasks', nextTask.id), nextTask);
    } catch (e) {
      console.warn('Firestore task error:', e);
    }
  }
  saveLocalItems('careTasks', plant.userId, [nextTask, ...updatedTasks]);

  return { plant: updatedPlant, record, nextTask };
};
