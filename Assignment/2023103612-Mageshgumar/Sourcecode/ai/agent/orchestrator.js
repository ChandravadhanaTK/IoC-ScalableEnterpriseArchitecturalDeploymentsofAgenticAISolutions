import { getAttendance, getMarks, getStudentProfile, getAssignments, getTimetable, getAcademicCalendar, getDocuments } from '../../backend/services/dataService.js';
import { buildDocumentIndex, searchDocuments } from '../rag/localRag.js';
import { getStudentMemory, updateStudentMemory } from '../memory/sessionMemory.js';
import { calculateAttendanceNeeded, calculateAverage, calculateDateDifference } from '../../backend/utils/calculators.js';

function resolveSubject(message, studentMemory) {
  const subjectMatches = ['OS', 'DBMS', 'CN', 'AI'];
  const lowerMessage = message.toLowerCase();

  for (const subject of subjectMatches) {
    if (lowerMessage.includes(subject.toLowerCase())) {
      return subject;
    }
  }

  return studentMemory?.lastSubject || null;
}

function buildToolTrace(toolName, message) {
  return { tool: toolName, status: 'executed', message };
}

export async function runAcademicAgent({ studentId, message, conversationMemory = {} }) {
  const studentProfile = await getStudentProfile(studentId);
  const studentMemory = getStudentMemory(studentId);
  const tools = [];
  const lowerMessage = message.toLowerCase();
  const subject = resolveSubject(message, studentMemory);

  if (subject) {
    updateStudentMemory(studentId, { lastSubject: subject });
  }

  let answer = 'I can help with your academic questions. Let me check your records and the applicable rules.';
  let source = null;

  const attendance = await getAttendance(studentId);
  const attendanceBySubject = Array.isArray(attendance?.subjects) ? attendance.subjects : [];
  const marks = await getMarks(studentId);
  const subjects = Array.isArray(marks?.subjects) ? marks.subjects : [];
  const assignments = await getAssignments(studentId);
  const normalizedAssignments = Array.isArray(assignments) ? assignments : [];
  const upcomingAssignments = normalizedAssignments.filter((item) => item.status === 'pending');
  const timetable = await getTimetable(studentId);
  const normalizedTimetable = Array.isArray(timetable) ? timetable : [];
  const calendar = await getAcademicCalendar();

  if (lowerMessage.includes('attendance') || lowerMessage.includes('attend')) {
    tools.push(buildToolTrace('getAttendance', '📊 Checking your attendance records...'));

    if (attendanceBySubject.length) {
      const lowest = [...attendanceBySubject].sort((a, b) => a.percentage - b.percentage)[0];
      const below80 = attendanceBySubject.filter((item) => item.percentage < 80);
      answer = `Your current attendance is:\n\n${attendanceBySubject.map((item) => `${item.subject}: ${item.percentage}%`).join('\n')}\n\nYour lowest attendance is ${lowest.subject} at ${lowest.percentage}%.${below80.length ? `\n\nSubjects below 80%: ${below80.map((item) => `${item.subject} (${item.percentage}%)`).join(', ')}` : ''}`;
    } else {
      answer = "I couldn't find your attendance data in the database.";
    }

    if (lowerMessage.includes('reach') || lowerMessage.includes('75%') || lowerMessage.includes('target') || lowerMessage.includes('need to attend')) {
      const targetSubject = subject || attendanceBySubject[0]?.subject;
      const targetRecord = attendanceBySubject.find((item) => item.subject === targetSubject) || attendanceBySubject[0];
      if (targetRecord) {
        tools.push(buildToolTrace('calculateAttendance', '🧮 Calculating how many classes you need to reach the target attendance...'));
        const result = calculateAttendanceNeeded(targetRecord.percentage, 75, targetRecord.attended, targetRecord.total);
        answer = `To reach 75% in ${targetRecord.subject}, you need to attend about ${result.result} more classes in a row. Your current record is ${targetRecord.attended}/${targetRecord.total} classes attended.`;
      }
    }
  }

  if (lowerMessage.includes('weak') || lowerMessage.includes('strength') || lowerMessage.includes('lowest') || lowerMessage.includes('average') || lowerMessage.includes('grade') || lowerMessage.includes('mark')) {
    tools.push(buildToolTrace('getMarks', '📘 Checking your assessment records...'));

    if (subjects.length) {
      const highest = [...subjects].sort((a, b) => b.total - a.total)[0];
      const weakest = [...subjects].sort((a, b) => a.total - b.total)[0];
      const average = calculateAverage(subjects);
      answer = `Your average score is ${average}.\n\nHighest mark: ${highest.subject} with ${highest.total}.\nWeakest mark: ${weakest.subject} with ${weakest.total}.\n\nSubjects below 80: ${subjects.filter((item) => item.total < 80).map((item) => `${item.subject} (${item.total})`).join(', ') || 'None'}.`;
    } else {
      answer = "I couldn't find your mark data in the database.";
    }
  }

  if (lowerMessage.includes('assignment') || lowerMessage.includes('pending') || lowerMessage.includes('due')) {
    tools.push(buildToolTrace('getAssignments', '📝 Checking your pending assignments...'));

    if (upcomingAssignments.length) {
      const sorted = [...upcomingAssignments].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
      answer = `Your pending assignments:\n\n${sorted.map((item) => `${item.name} (${item.subject}) - ${new Date(item.deadline).toLocaleDateString()}`).join('\n')}`;
    } else {
      answer = 'You have no pending assignments.';
    }
  }

  if (lowerMessage.includes('class') || lowerMessage.includes('timetable') || lowerMessage.includes('tomorrow') || lowerMessage.includes('friday') || lowerMessage.includes('next os')) {
    tools.push(buildToolTrace('getTimetable', '📅 Checking your class schedule...'));
    const targetDate = lowerMessage.includes('tomorrow') ? new Date(Date.now() + 86400000) : new Date();
    const schedule = await getTimetable(studentId, targetDate.toISOString());
    const entries = schedule.flatMap((day) => day.classes.map((item) => `${day.day}: ${item.subject} at ${item.time} (${item.room})`));

    if (entries.length) {
      answer = `Your classes:\n${entries.join('\n')}`;
    } else {
      answer = 'There are no classes scheduled for the requested period.';
    }
  }

  if (lowerMessage.includes('exam') || lowerMessage.includes('semester end') || lowerMessage.includes('holiday') || lowerMessage.includes('calendar')) {
    tools.push(buildToolTrace('getAcademicCalendar', '🗓️ Checking the academic calendar...'));
    if (calendar) {
      const endSem = new Date(calendar.semesterEnd);
      const daysRemaining = calculateDateDifference(new Date(), endSem);
      answer = `Semester ends on ${new Date(endSem).toLocaleDateString()}. There are ${daysRemaining} days remaining. End-semester exams are scheduled on ${calendar.endSemesterExams.join(', ')}.`;
    } else {
      answer = 'I could not find an academic calendar in the database.';
    }
  }

  if (lowerMessage.includes('can i') && lowerMessage.includes('exam') || lowerMessage.includes('eligible') && lowerMessage.includes('exam') || lowerMessage.includes('attendance enough')) {
    tools.push(buildToolTrace('searchCollegeDocuments', '🔍 Checking the official exam attendance rule...'));
    const documents = await getDocuments();
    const matches = searchDocuments(message, buildDocumentIndex(documents), 3);

    if (attendanceBySubject.length) {
      const lowestSubject = [...attendanceBySubject].sort((a, b) => a.percentage - b.percentage)[0];
      const policyAnswer = matches[0]?.content || 'The college policy states that students must maintain at least 75% attendance in each course to be eligible for the semester examination.';
      const rule = `${policyAnswer} Your lowest subject attendance is ${lowestSubject.subject} at ${lowestSubject.percentage}%.`;
      answer = `${rule}\n\n${lowestSubject.percentage >= 75 ? 'You are currently eligible based on your attendance.' : 'You are below the minimum attendance requirement for the exam.'}`;
      if (matches[0]) {
        source = { title: matches[0].title, section: matches[0].section };
      }
    }
  }

  if (lowerMessage.includes('suggest') || lowerMessage.includes('improve') || lowerMessage.includes('focus') || lowerMessage.includes('study today') || lowerMessage.includes('study plan')) {
    tools.push(buildToolTrace('getMarks', '📊 Reviewing weak subjects and recent performance...'));
    tools.push(buildToolTrace('getAttendance', '⚠️ Reviewing attendance risks...'));
    tools.push(buildToolTrace('getAssignments', '📌 Checking urgent deadline pressure...'));

    const weakSubjects = subjects.filter((item) => item.total < 80).map((item) => item.subject);
    const lowAttendance = attendanceBySubject.filter((item) => item.percentage < 75).map((item) => `${item.subject} (${item.percentage}%)`);
    const urgentAssignments = upcomingAssignments.slice(0, 2).map((item) => `${item.name} (${item.subject})`);

    const focusList = [
      weakSubjects.length ? `Revise ${weakSubjects.join(', ')} first because your recent marks are below 80.` : 'Continue reinforcing your strongest subjects to protect your overall CGPA.',
      lowAttendance.length ? `Improve attendance in ${lowAttendance.join(', ')} to meet the 75% minimum requirement.` : 'Your attendance is above the minimum threshold, so maintain the current rhythm.',
      urgentAssignments.length ? `Complete ${urgentAssignments.join(', ')} before the deadlines to avoid losing marks.` : 'Keep the current assignment pace steady and review the next task list.',
    ];

    answer = `Here is your exact focus plan:\n\n- ${focusList.join('\n- ')}`;
  }

  if (lowerMessage.includes('what should i focus on this week') || lowerMessage.includes('this week') || lowerMessage.includes('study plan')) {
    tools.push(buildToolTrace('getTimetable', '🧭 Checking your weekly schedule...'));
    const weakSubjects = subjects.filter((item) => item.total < 80).map((item) => item.subject);
    const classSlots = normalizedTimetable.slice(0, 3).flatMap((day) => (Array.isArray(day.classes) ? day.classes.map((item) => `${day.day} ${item.time} ${item.subject}`) : []));
    answer = `This week, focus on ${weakSubjects.length ? weakSubjects.join(', ') : 'your current weak areas'} and use your timetable slots effectively: ${classSlots.join(' • ')}. Keep your revision time aligned with pending assignments and attendance targets.`;
  }

  if (lowerMessage.includes('regulation') || lowerMessage.includes('rule') || lowerMessage.includes('policy')) {
    tools.push(buildToolTrace('searchCollegeDocuments', '🔍 Searching the official college regulations...'));
    const documents = await getDocuments();
    const matches = searchDocuments(message, buildDocumentIndex(documents), 3);

    if (matches.length) {
      const first = matches[0];
      answer = `${first.content} Source: ${first.title} | Section: ${first.section}`;
      source = { title: first.title, section: first.section };
    } else {
      answer = 'The available college documents do not contain the answer to that policy question.';
    }
  }

  const finalConversation = {
    ...conversationMemory,
    studentId,
    lastSubject: subject || conversationMemory.lastSubject,
    lastMessage: message,
  };

  updateStudentMemory(studentId, finalConversation);

  return {
    answer,
    source,
    tools,
    student: studentProfile,
    memory: getStudentMemory(studentId),
  };
}
