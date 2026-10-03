import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.ts';
import type { IUser } from '../models/types.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import { JWT_SECRET } from '../middleware/auth.ts';

function formatUserResponse(user: IUser) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    department: user.department,
    year: user.year,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function register(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { name, email, password, confirmPassword, department, year } = req.body;

    if (!name || !email || !password || !confirmPassword || !department || !year) {
      res.status(400).json({ error: 'Please fill all required fields.' });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    const existingUser = await db.users.findOne({ email: trimmedEmail });
    if (existingUser) {
      res.status(400).json({ error: 'An account with this email address already exists. Please log in.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await db.users.insertOne({
      name: name.trim(),
      email: trimmedEmail,
      password: hashedPassword,
      department: department.trim(),
      year: year.trim(),
      role: 'student',
      createdAt: new Date().toISOString(),
    });

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Initial welcome notification
    await db.notifications.insertOne({
      userId: newUser._id,
      message: `Welcome to CampusFix, ${newUser.name}! You can now submit and track campus issues.`,
      type: 'system',
      read: false,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      message: 'Account registered successfully.',
      token,
      user: formatUserResponse(newUser),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Unable to complete registration. Please try again.' });
  }
}

export async function login(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Please enter both email and password.' });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await db.users.findOne({ email: trimmedEmail });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Logged in successfully.',
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Unable to log in. Please try again.' });
  }
}

export async function adminLogin(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Please enter both email and password.' });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await db.users.findOne({ email: trimmedEmail });

    if (!user) {
      res.status(401).json({ error: 'Invalid administrator credentials.' });
      return;
    }

    if (user.role !== 'admin') {
      res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid administrator credentials.' });
      return;
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Admin access granted.',
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Unable to log in as administrator. Please try again.' });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated.' });
      return;
    }
    res.status(200).json({ user: formatUserResponse(req.user) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not authenticated.' });
      return;
    }

    const { name, email, department, year } = req.body;

    if (!name || !email) {
      res.status(400).json({ error: 'Name and email are required.' });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    // If email changed, ensure no duplicate
    if (trimmedEmail !== req.user.email) {
      const existing = await db.users.findOne({ email: trimmedEmail });
      if (existing && existing._id !== req.user._id) {
        res.status(400).json({ error: 'Email is already in use by another user.' });
        return;
      }
    }

    // Role cannot be changed by user
    const updateData: Partial<IUser> = {
      name: name.trim(),
      email: trimmedEmail,
    };

    if (department !== undefined) updateData.department = department.trim();
    if (year !== undefined) updateData.year = year.trim();

    await db.users.updateOne({ _id: req.user._id }, { $set: updateData });

    const updatedUser = await db.users.findOne({ _id: req.user._id });
    if (!updatedUser) {
      res.status(404).json({ error: 'User not found after update.' });
      return;
    }

    res.status(200).json({
      message: 'Profile updated successfully.',
      user: formatUserResponse(updatedUser),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Unable to update profile. Please try again.' });
  }
}
