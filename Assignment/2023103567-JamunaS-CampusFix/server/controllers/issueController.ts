import type { Response } from 'express';
import { db } from '../db.ts';
import type { IIssue, IssueCategory, IssuePriority, IssueStatus, IStatusHistoryItem } from '../models/types.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import { classifyIssue } from '../services/aiClassifier.ts';

const VALID_CATEGORIES: IssueCategory[] = [
  'Hostel',
  'Classroom',
  'Laboratory',
  'Library',
  'Canteen',
  'Transport',
  'Electricity',
  'Water',
  'Internet',
  'Cleanliness',
  'Other',
];

const VALID_PRIORITIES: IssuePriority[] = ['Low', 'Medium', 'High', 'Critical'];
const VALID_STATUSES: IssueStatus[] = ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];

async function generateIssueId(): Promise<string> {
  const count = await db.issues.countDocuments();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `CF-${year}-${1000 + count + 1}-${randomSuffix.toString().slice(0, 2)}`;
}

export async function createIssue(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const { title, description, category, location, priority, imageUrl } = req.body;

    if (!title || !description || !category || !location || !priority) {
      res.status(400).json({ error: 'Please fill all required fields.' });
      return;
    }

    if (!VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ error: 'Invalid category selected.' });
      return;
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      res.status(400).json({ error: 'Invalid priority level selected.' });
      return;
    }

    // AI suggestion / department routing check
    const aiAnalysis = await classifyIssue(title, description, category, priority);
    const assignedDepartment = aiAnalysis.department || 'General Administration';

    const issueId = await generateIssueId();
    const now = new Date().toISOString();

    const statusHistory: IStatusHistoryItem[] = [
      {
        status: 'Pending',
        changedBy: req.user.name,
        changedByRole: req.user.role,
        timestamp: now,
        remarks: 'Issue submitted by student.',
      },
    ];

    const newIssue = await db.issues.insertOne({
      issueId,
      studentId: req.user._id,
      studentName: req.user.name,
      studentEmail: req.user.email,
      studentDepartment: req.user.department,
      title: title.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
      priority,
      status: 'Pending',
      assignedDepartment,
      adminRemarks: '',
      imageUrl: imageUrl?.trim() || undefined,
      statusHistory,
      createdAt: now,
      updatedAt: now,
    });

    // Notify the student
    await db.notifications.insertOne({
      userId: req.user._id,
      message: `Your issue ${issueId} ("${title.slice(0, 30)}...") has been submitted and queued for review.`,
      type: 'submission',
      issueId,
      read: false,
      createdAt: now,
    });

    res.status(201).json({
      message: 'Issue submitted successfully.',
      issue: newIssue,
    });
  } catch (error) {
    console.error('Create issue error:', error);
    res.status(500).json({ error: 'Unable to submit issue. Please try again.' });
  }
}

export async function getMyIssues(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const issues = await db.issues.find({ studentId: req.user._id });
    // Sort latest first
    issues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.status(200).json({ issues });
  } catch (error) {
    console.error('Get my issues error:', error);
    res.status(500).json({ error: 'Failed to retrieve your issues.' });
  }
}

export async function getAllIssues(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { search, category, priority, status } = req.query;

    let issues = await db.issues.find();

    if (category && category !== 'All') {
      issues = issues.filter((i) => i.category === category);
    }
    if (priority && priority !== 'All') {
      issues = issues.filter((i) => i.priority === priority);
    }
    if (status && status !== 'All') {
      issues = issues.filter((i) => i.status === status);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      issues = issues.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.issueId.toLowerCase().includes(q) ||
          i.location.toLowerCase().includes(q) ||
          i.studentName.toLowerCase().includes(q) ||
          i.assignedDepartment.toLowerCase().includes(q)
      );
    }

    // Sort latest first
    issues.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.status(200).json({ issues });
  } catch (error) {
    console.error('Get all issues error:', error);
    res.status(500).json({ error: 'Failed to fetch issues.' });
  }
}

export async function getIssueById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    let issue = await db.issues.findOne({ _id: id });
    if (!issue) {
      issue = await db.issues.findOne({ issueId: id });
    }

    if (!issue) {
      res.status(404).json({ error: 'Issue not found.' });
      return;
    }

    // Student can only view their own issues, Admin can view all
    if (req.user && req.user.role !== 'admin' && issue.studentId !== req.user._id) {
      res.status(403).json({ error: 'Access denied to this issue record.' });
      return;
    }

    res.status(200).json({ issue });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve issue details.' });
  }
}

export async function trackIssue(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { issueId } = req.params;
    if (!issueId) {
      res.status(400).json({ error: 'Issue ID is required.' });
      return;
    }

    const trimmed = issueId.trim().toUpperCase();
    const issue = await db.issues.findOne({ issueId: trimmed });

    if (!issue) {
      res.status(404).json({ error: `No issue found matching reference ID "${trimmed}".` });
      return;
    }

    res.status(200).json({ issue });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track issue.' });
  }
}

export async function updateIssue(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ error: 'Administrator access required.' });
      return;
    }

    const { id } = req.params;
    const { status, assignedDepartment, adminRemarks } = req.body;

    const issue = await db.issues.findOne({ _id: id });
    if (!issue) {
      res.status(404).json({ error: 'Issue not found.' });
      return;
    }

    const now = new Date().toISOString();
    const isStatusChanged = status && status !== issue.status;
    const newStatus = status && VALID_STATUSES.includes(status) ? status : issue.status;
    const newDepartment = assignedDepartment !== undefined ? assignedDepartment.trim() : issue.assignedDepartment;
    const newRemarks = adminRemarks !== undefined ? adminRemarks.trim() : issue.adminRemarks;

    const statusHistory = [...(issue.statusHistory || [])];

    if (isStatusChanged || (newRemarks && newRemarks !== issue.adminRemarks) || (newDepartment && newDepartment !== issue.assignedDepartment)) {
      statusHistory.push({
        status: newStatus,
        changedBy: req.user.name,
        changedByRole: 'admin',
        timestamp: now,
        remarks: newRemarks || undefined,
        department: newDepartment || undefined,
      });
    }

    await db.issues.updateOne(
      { _id: id },
      {
        $set: {
          status: newStatus,
          assignedDepartment: newDepartment,
          adminRemarks: newRemarks,
          statusHistory,
          updatedAt: now,
        },
      }
    );

    // Notifications for student
    let notifMessage = '';
    let notifType: 'assigned' | 'status_change' | 'resolved' | 'remark' = 'status_change';

    if (newStatus === 'Resolved' && issue.status !== 'Resolved') {
      notifMessage = `Your issue ${issue.issueId} has been resolved! Remarks: "${newRemarks || 'Completed'}".`;
      notifType = 'resolved';
    } else if (newStatus === 'Rejected' && issue.status !== 'Rejected') {
      notifMessage = `Your issue ${issue.issueId} was rejected. Remarks: "${newRemarks || 'Not applicable'}".`;
      notifType = 'status_change';
    } else if (newDepartment !== issue.assignedDepartment) {
      notifMessage = `Your issue ${issue.issueId} was assigned to ${newDepartment}.`;
      notifType = 'assigned';
    } else if (isStatusChanged) {
      notifMessage = `Status of issue ${issue.issueId} changed from ${issue.status} to ${newStatus}.`;
      notifType = 'status_change';
    } else if (newRemarks && newRemarks !== issue.adminRemarks) {
      notifMessage = `Admin added remark on issue ${issue.issueId}: "${newRemarks}".`;
      notifType = 'remark';
    }

    if (notifMessage) {
      await db.notifications.insertOne({
        userId: issue.studentId,
        message: notifMessage,
        type: notifType,
        issueId: issue.issueId,
        read: false,
        createdAt: now,
      });
    }

    const updated = await db.issues.findOne({ _id: id });

    res.status(200).json({
      message: 'Issue updated successfully.',
      issue: updated,
    });
  } catch (error) {
    console.error('Update issue error:', error);
    res.status(500).json({ error: 'Failed to update issue.' });
  }
}

export async function getAdminStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const issues = await db.issues.find();

    const totalIssues = issues.length;
    const pending = issues.filter((i) => i.status === 'Pending').length;
    const assigned = issues.filter((i) => i.status === 'Assigned').length;
    const inProgress = issues.filter((i) => i.status === 'In Progress').length;
    const resolved = issues.filter((i) => i.status === 'Resolved').length;
    const rejected = issues.filter((i) => i.status === 'Rejected').length;
    const critical = issues.filter((i) => i.priority === 'Critical').length;

    // By Category
    const categoryCounts: Record<string, number> = {};
    for (const c of VALID_CATEGORIES) categoryCounts[c] = 0;
    for (const i of issues) {
      categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1;
    }

    // By Priority
    const priorityCounts: Record<string, number> = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };
    for (const i of issues) {
      priorityCounts[i.priority] = (priorityCounts[i.priority] || 0) + 1;
    }

    // By Status
    const statusCounts: Record<string, number> = {
      Pending: pending,
      Assigned: assigned,
      'In Progress': inProgress,
      Resolved: resolved,
      Rejected: rejected,
    };

    // Calculate resolution rate
    const resolutionRate = totalIssues > 0 ? Math.round((resolved / totalIssues) * 100) : 0;

    res.status(200).json({
      stats: {
        totalIssues,
        pending,
        assigned,
        inProgress,
        resolved,
        rejected,
        critical,
        resolutionRate,
      },
      categoryCounts,
      priorityCounts,
      statusCounts,
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to generate admin statistics.' });
  }
}

export async function getStudentStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    const issues = await db.issues.find({ studentId: req.user._id });

    const totalIssues = issues.length;
    const pending = issues.filter((i) => i.status === 'Pending').length;
    const assigned = issues.filter((i) => i.status === 'Assigned').length;
    const inProgress = issues.filter((i) => i.status === 'In Progress').length;
    const resolved = issues.filter((i) => i.status === 'Resolved').length;
    const rejected = issues.filter((i) => i.status === 'Rejected').length;

    res.status(200).json({
      totalIssues,
      pending,
      assigned,
      inProgress,
      resolved,
      rejected,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student statistics.' });
  }
}
