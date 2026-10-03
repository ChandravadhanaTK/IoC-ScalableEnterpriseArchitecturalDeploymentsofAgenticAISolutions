import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'college-academic-agent-secret';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

export function requireStudentOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  if (req.user.role === 'student' || req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({ message: 'Unauthorized.' });
}

export function requireStudentAccess(req, res, next) {
  const requestedStudentId = req.params.studentId || req.query.studentId;
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.studentId === requestedStudentId) {
    return next();
  }

  return res.status(403).json({ message: 'Students cannot access another student profile.' });
}
