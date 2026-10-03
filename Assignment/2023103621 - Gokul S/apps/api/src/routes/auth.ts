import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hevy_clone_super_secret_jwt_key_2026';

const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(6),
  display_name: z.string().min(1).max(50)
});

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1),
  password: z.string().min(1)
});

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const validated = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validated.email.toLowerCase() },
          { username: validated.username.toLowerCase() }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already in use' });
    }

    const password_hash = await bcrypt.hash(validated.password, 10);

    const user = await prisma.user.create({
      data: {
        username: validated.username.toLowerCase(),
        email: validated.email.toLowerCase(),
        password_hash,
        display_name: validated.display_name,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${validated.username}`
      },
      select: {
        id: true,
        username: true,
        email: true,
        display_name: true,
        bio: true,
        avatar_url: true,
        is_private: true,
        unit_preference: true,
        created_at: true
      }
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === undefined
        ? process.env.NODE_ENV === 'production'
        : process.env.COOKIE_SECURE === 'true',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.COOKIE_SAME_SITE === 'none' ? 'none' : 'lax'
    });

    return res.status(201).json({ user, token });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    return res.status(500).json({ error: 'Failed to register' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const validated = loginSchema.parse(req.body);
    const identifier = validated.usernameOrEmail.toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(validated.password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === undefined
        ? process.env.NODE_ENV === 'production'
        : process.env.COOKIE_SECURE === 'true',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.COOKIE_SAME_SITE === 'none' ? 'none' : 'lax'
    });

    const { password_hash, ...userWithoutPassword } = user;
    return res.json({ user: userWithoutPassword, token });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    return res.status(500).json({ error: 'Login failed' });
  }
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully' });
});

// GET /me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        username: true,
        email: true,
        display_name: true,
        bio: true,
        avatar_url: true,
        is_private: true,
        unit_preference: true,
        created_at: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch current user' });
  }
});

export default router;
