import express from 'express';
import { requireAuth, requireStudentAccess } from '../middleware/auth.js';
import { getStudentProfile, getAttendance, getMarks, getAssignments, getTimetable, getAcademicCalendar } from '../services/dataService.js';

const router = express.Router();

router.get('/profile/:studentId', requireAuth, requireStudentAccess, async (req, res) => {
  try {
    const profile = await getStudentProfile(req.params.studentId);
    if (!profile) return res.status(404).json({ message: 'Student not found.' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load profile.' });
  }
});

router.get('/attendance/:studentId', requireAuth, requireStudentAccess, async (req, res) => {
  try {
    const data = await getAttendance(req.params.studentId);
    if (!data) return res.status(404).json({ message: 'Attendance data not found.' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load attendance.' });
  }
});

router.get('/marks/:studentId', requireAuth, requireStudentAccess, async (req, res) => {
  try {
    const data = await getMarks(req.params.studentId);
    if (!data) return res.status(404).json({ message: 'Marks data not found.' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load marks.' });
  }
});

router.get('/assignments/:studentId', requireAuth, requireStudentAccess, async (req, res) => {
  try {
    const data = await getAssignments(req.params.studentId);
    res.json(await data.toArray ? data.toArray() : data);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load assignments.' });
  }
});

router.get('/timetable/:studentId', requireAuth, requireStudentAccess, async (req, res) => {
  try {
    const { date } = req.query;
    const data = await getTimetable(req.params.studentId, date || null);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load timetable.' });
  }
});

router.get('/calendar', requireAuth, async (req, res) => {
  try {
    const data = await getAcademicCalendar();
    if (!data) return res.status(404).json({ message: 'Academic calendar not found.' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Unable to load academic calendar.' });
  }
});

export default router;
