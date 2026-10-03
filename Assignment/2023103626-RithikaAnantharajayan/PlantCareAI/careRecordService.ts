import { CareRecord } from '../types';
import { db, isFirebaseConfigured } from '../config/firebase';
import { collection, setDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { getLocalItems, saveLocalItems } from './plantService';

export const fetchUserRecords = async (userId: string): Promise<CareRecord[]> => {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'careRecords'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const list: CareRecord[] = [];
      snap.forEach(d => list.push({ ...d.data() as CareRecord, id: d.id }));
      saveLocalItems('careRecords', userId, list);
      return list.sort((a, b) => b.date.localeCompare(a.date));
    } catch (e) {
      console.warn('Firestore fetchUserRecords error:', e);
    }
  }
  const localList = getLocalItems<CareRecord>('careRecords', userId);
  return localList.sort((a, b) => b.date.localeCompare(a.date));
};

export const addCareRecord = async (record: CareRecord): Promise<CareRecord> => {
  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'careRecords', record.id), record);
    } catch (e) {
      console.warn('Firestore addCareRecord error:', e);
    }
  }
  const existing = getLocalItems<CareRecord>('careRecords', record.userId);
  const updated = [record, ...existing];
  saveLocalItems('careRecords', record.userId, updated);
  return record;
};
