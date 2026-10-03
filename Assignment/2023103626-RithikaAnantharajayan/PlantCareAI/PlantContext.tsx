import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Plant, CareTask, CareRecord, CareStatus } from '../types';
import { useAuth } from './AuthContext';
import { 
  fetchUserPlants, 
  savePlant, 
  deletePlant, 
  markPlantAsWatered, 
  computePlantStatus, 
  formatDate, 
  addDays 
} from '../services/plantService';
import { 
  fetchUserTasks, 
  saveCareTask, 
  completeCareTask, 
  deleteCareTask 
} from '../services/careTaskService';
import { fetchUserRecords } from '../services/careRecordService';
import { getSamplePlantsData } from '../services/sampleData';
import confetti from 'canvas-confetti';

interface PlantContextType {
  plants: Plant[];
  tasks: CareTask[];
  records: CareRecord[];
  loading: boolean;
  addPlant: (data: Omit<Plant, 'id' | 'userId' | 'createdAt' | 'status'>) => Promise<Plant>;
  updatePlant: (plant: Plant) => Promise<Plant>;
  deletePlantById: (plantId: string) => Promise<void>;
  waterPlantAction: (plant: Plant, notes?: string) => Promise<void>;
  toggleTaskAction: (taskId: string) => Promise<void>;
  addTaskAction: (task: Omit<CareTask, 'id' | 'userId' | 'createdAt'>) => Promise<CareTask>;
  deleteTaskAction: (taskId: string) => Promise<void>;
  loadDemoDataAction: () => Promise<void>;
  clearDemoDataAction: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const PlantContext = createContext<PlantContextType | undefined>(undefined);

export const PlantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [records, setRecords] = useState<CareRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshData = useCallback(async () => {
    if (!user) {
      setPlants([]);
      setTasks([]);
      setRecords([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [fetchedPlants, fetchedTasks, fetchedRecords] = await Promise.all([
        fetchUserPlants(user.uid),
        fetchUserTasks(user.uid),
        fetchUserRecords(user.uid),
      ]);

      // If user is new demo user and has no data, automatically load sample data
      if (user.isDemoUser && fetchedPlants.length === 0) {
        const sample = getSamplePlantsData(user.uid);
        for (const p of sample.plants) await savePlant(p);
        for (const t of sample.tasks) await saveCareTask(t);
        setPlants(sample.plants);
        setTasks(sample.tasks);
        setRecords(sample.records);
      } else {
        setPlants(fetchedPlants);
        setTasks(fetchedTasks);
        setRecords(fetchedRecords);
      }
    } catch (e) {
      console.error('Error refreshing plant data:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addPlant = async (data: Omit<Plant, 'id' | 'userId' | 'createdAt' | 'status'>): Promise<Plant> => {
    if (!user) throw new Error('User not authenticated');
    const newPlant: Plant = {
      ...data,
      id: 'plant-' + Date.now(),
      userId: user.uid,
      status: computePlantStatus(data.nextWateringDate),
      createdAt: new Date().toISOString(),
    };
    await savePlant(newPlant);

    // Automatically create first care task for this plant
    const firstTask: CareTask = {
      id: 'task-' + Date.now(),
      userId: user.uid,
      plantId: newPlant.id,
      plantName: newPlant.name,
      taskType: 'Water',
      dueDate: newPlant.nextWateringDate,
      status: 'pending',
      notes: `Routine hydration cycle for ${newPlant.name}`,
      createdAt: new Date().toISOString(),
    };
    await saveCareTask(firstTask);

    await refreshData();
    return newPlant;
  };

  const updatePlant = async (plant: Plant): Promise<Plant> => {
    const updated = await savePlant(plant);
    await refreshData();
    return updated;
  };

  const deletePlantById = async (plantId: string): Promise<void> => {
    if (!user) return;
    await deletePlant(plantId, user.uid);
    await refreshData();
  };

  const waterPlantAction = async (plant: Plant, notes?: string): Promise<void> => {
    await markPlantAsWatered(plant, notes);
    
    // Fun visual celebration
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#38aa6b', '#5fc78c', '#95dfb3', '#236d44'],
      });
    } catch {
      // ignore
    }

    await refreshData();
  };

  const toggleTaskAction = async (taskId: string): Promise<void> => {
    if (!user) return;
    await completeCareTask(taskId, user.uid);
    await refreshData();
  };

  const addTaskAction = async (task: Omit<CareTask, 'id' | 'userId' | 'createdAt'>): Promise<CareTask> => {
    if (!user) throw new Error('User not authenticated');
    const newTask: CareTask = {
      ...task,
      id: 'task-' + Date.now(),
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };
    await saveCareTask(newTask);
    await refreshData();
    return newTask;
  };

  const deleteTaskAction = async (taskId: string): Promise<void> => {
    if (!user) return;
    await deleteCareTask(taskId, user.uid);
    await refreshData();
  };

  const loadDemoDataAction = async (): Promise<void> => {
    if (!user) return;
    const sample = getSamplePlantsData(user.uid);
    for (const p of sample.plants) await savePlant(p);
    for (const t of sample.tasks) await saveCareTask(t);
    await refreshData();
  };

  const clearDemoDataAction = async (): Promise<void> => {
    if (!user) return;
    for (const p of plants) {
      if (p.isDemo) await deletePlant(p.id, user.uid);
    }
    await refreshData();
  };

  return (
    <PlantContext.Provider
      value={{
        plants,
        tasks,
        records,
        loading,
        addPlant,
        updatePlant,
        deletePlantById,
        waterPlantAction,
        toggleTaskAction,
        addTaskAction,
        deleteTaskAction,
        loadDemoDataAction,
        clearDemoDataAction,
        refreshData,
      }}
    >
      {children}
    </PlantContext.Provider>
  );
};

export const usePlants = () => {
  const context = useContext(PlantContext);
  if (!context) {
    throw new Error('usePlants must be used within a PlantProvider');
  }
  return context;
};
