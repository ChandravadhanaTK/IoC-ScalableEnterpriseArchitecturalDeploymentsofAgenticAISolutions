import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getCollection } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'college-academic-agent-secret';

export async function loginUser(email, password) {
  const collection = await getCollection('users');
  const user = await collection.findOne({ email });

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email or password.');
  }

  const token = jwt.sign({ id: user._id, email: user.email, role: user.role, studentId: user.studentId }, JWT_SECRET, { expiresIn: '7d' });

  return {
    token,
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      studentId: user.studentId,
    },
  };
}

export async function getUserById(userId) {
  const collection = await getCollection('users');
  return collection.findOne({ _id: userId });
}
