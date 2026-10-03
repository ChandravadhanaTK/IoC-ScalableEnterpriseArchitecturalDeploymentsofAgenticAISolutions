import { MongoClient } from 'mongodb';
import { sampleUsers, sampleStudents, sampleAttendance, sampleMarks, sampleAssignments, sampleTimetable, sampleAcademicCalendar, sampleDocuments } from '../data/sampleData.js';

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const dbName = process.env.MONGO_DB_NAME || 'academic_agent';

let client;
let db;

export const memoryStore = {
  users: [...sampleUsers],
  students: [...sampleStudents],
  attendance: [...sampleAttendance],
  marks: [...sampleMarks],
  assignments: [...sampleAssignments],
  timetable: [...sampleTimetable],
  academic_calendar: [...sampleAcademicCalendar],
  documents: [...sampleDocuments],
  conversations: [],
  messages: [],
};

export async function connectDB() {
  if (db) return db;

  try {
    client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db(dbName);
    console.log('Connected to MongoDB successfully.');
    return db;
  } catch (error) {
    console.warn('MongoDB unavailable. Falling back to in-memory store.', error.message);
    db = null;
    return null;
  }
}

export async function getCollection(name) {
  const currentDb = await connectDB();

  if (currentDb) {
    return currentDb.collection(name);
  }

  return {
    findOne: async (query) => memoryStore[name]?.find((item) => Object.entries(query).every(([key, value]) => item[key] === value)) ?? null,
    find: async (query = {}) => {
      const collection = memoryStore[name] ?? [];
      if (!query || Object.keys(query).length === 0) return collection;
      return collection.filter((item) => Object.entries(query).every(([key, value]) => item[key] === value));
    },
    insertOne: async (doc) => {
      memoryStore[name] ??= [];
      memoryStore[name].push(doc);
      return { insertedId: doc._id || doc.id || `${name}-${Date.now()}` };
    },
    insertMany: async (docs) => {
      memoryStore[name] ??= [];
      memoryStore[name].push(...docs);
      return { insertedCount: docs.length };
    },
    updateOne: async (query, update) => {
      const collection = memoryStore[name] ?? [];
      const index = collection.findIndex((item) => Object.entries(query).every(([key, value]) => item[key] === value));
      if (index === -1) return { matchedCount: 0, modifiedCount: 0 };
      const updated = { ...collection[index], ...update.$set };
      collection[index] = updated;
      return { matchedCount: 1, modifiedCount: 1 };
    },
    deleteMany: async (query = {}) => {
      const collection = memoryStore[name] ?? [];
      const filtered = collection.filter((item) => !Object.entries(query).every(([key, value]) => item[key] === value));
      memoryStore[name] = filtered;
      return { deletedCount: collection.length - filtered.length };
    },
  };
}

export async function ensureSeedData() {
  const collectionNames = ['users', 'students', 'attendance', 'marks', 'assignments', 'timetable', 'academic_calendar', 'documents'];

  for (const name of collectionNames) {
    const collection = await getCollection(name);
    if (collection && typeof collection.countDocuments === 'function') {
      const count = await collection.countDocuments({});
      if (count === 0) {
        const source = memoryStore[name] || [];
        if (source.length) {
          await collection.insertMany(source);
        }
      }
    }
  }

  const usersCollection = await getCollection('users');
  if (usersCollection && typeof usersCollection.updateOne === 'function') {
    await usersCollection.updateOne(
      { _id: 'user-student-1' },
      {
        $set: {
          _id: 'user-student-1',
          email: 'student@college.edu',
          passwordHash: '$2b$10$We55evMdto8QeFEc3SGFg./PPnKwfvIVSIiU.lp1G6WHWFGDzJeEG',
          role: 'student',
          studentId: 'CS2024001',
          name: 'Aisha Patel',
        },
      },
      { upsert: true },
    );

    await usersCollection.updateOne(
      { _id: 'user-admin-1' },
      {
        $set: {
          _id: 'user-admin-1',
          email: 'admin@college.edu',
          passwordHash: '$2b$10$xoBehjolq1tKG9EKbtFfYOW2RFOo2hj.G8pMosTt.cmhbcWe4nnO2',
          role: 'admin',
          name: 'Admission Office',
        },
      },
      { upsert: true },
    );
  }
}

export async function getDbStatus() {
  const currentDb = await connectDB();
  return currentDb ? 'mongodb' : 'memory';
}
