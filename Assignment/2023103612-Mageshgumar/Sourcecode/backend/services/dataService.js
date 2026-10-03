import { getCollection } from '../config/db.js';

export async function getStudentProfile(studentId) {
  const collection = await getCollection('students');
  return collection.findOne({ studentId });
}

export async function getAttendance(studentId) {
  const collection = await getCollection('attendance');
  const result = await collection.findOne({ studentId });
  return result || null;
}

export async function getMarks(studentId) {
  const collection = await getCollection('marks');
  const result = await collection.findOne({ studentId });
  return result || null;
}

export async function getAssignments(studentId) {
  const collection = await getCollection('assignments');
  const results = await collection.find({ studentId });
  return results.toArray ? await results.toArray() : results;
}

export async function getTimetable(studentId, date) {
  const collection = await getCollection('timetable');
  const results = await collection.find({ studentId });
  const entries = await results.toArray ? results.toArray() : results;

  if (!date) {
    return entries;
  }

  const targetDay = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  return entries.filter((entry) => entry.day === targetDay);
}

export async function getAcademicCalendar() {
  const collection = await getCollection('academic_calendar');
  const result = await collection.findOne({});
  return result || null;
}

export async function getDocuments() {
  const collection = await getCollection('documents');
  const result = await collection.find({});
  return result.toArray ? await result.toArray() : result;
}

export async function saveConversation(userId, title, message) {
  const collection = await getCollection('conversations');
  const doc = {
    _id: `conversation-${Date.now()}`,
    userId,
    title,
    updatedAt: new Date().toISOString(),
  };

  await collection.insertOne(doc);
  return doc;
}

export async function saveMessage(conversationId, sender, text) {
  const collection = await getCollection('messages');
  const doc = {
    _id: `message-${Date.now()}`,
    conversationId,
    sender,
    text,
    createdAt: new Date().toISOString(),
  };

  await collection.insertOne(doc);
  return doc;
}
