import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AppBar, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, Grid, List, ListItem, ListItemButton, ListItemText, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import api from './services/api';
import './App.css';

function ProtectedRoute({ children, requiredRole = null }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Box className="loader-wrap"><CircularProgress /></Box>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function BarChart({ data, color = '#1976d2' }) {
  if (!data || !data.length) {
    return <Typography variant="body2">No data yet.</Typography>;
  }

  const maxValue = Math.max(...data.map((item) => item.value), 100);

  return (
    <svg viewBox="0 0 300 150" className="chart-svg" aria-label="Academic chart">
      {data.map((entry, index) => {
        const barHeight = (entry.value / maxValue) * 110;
        const x = 22 + index * 62;
        const y = 120 - barHeight;

        return (
          <g key={`${entry.label}-${index}`}>
            <rect x={x} y={y} width={32} height={barHeight} rx={6} fill={color} opacity={0.9} />
            <text x={x + 16} y={138} textAnchor="middle" fontSize="10" fill="#475569">{entry.label}</text>
            <text x={x + 16} y={y - 8} textAnchor="middle" fontSize="10" fill="#0f172a">{entry.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

function buildSuggestedTrace(query) {
  const lower = (query || '').toLowerCase();
  const steps = [];

  if (lower.includes('attendance')) steps.push('📊 Checking your attendance records...');
  if (lower.includes('mark') || lower.includes('grade')) steps.push('📘 Checking your assessment records...');
  if (lower.includes('assignment') || lower.includes('due') || lower.includes('pending')) steps.push('📝 Checking your pending assignments...');
  if (lower.includes('class') || lower.includes('timetable')) steps.push('📅 Checking your class schedule...');
  if (lower.includes('exam') || lower.includes('policy') || lower.includes('regulation')) steps.push('🔍 Looking up the relevant rule or exam requirement...');
  if (!steps.length) steps.push('🧠 Analyzing your academic records...');

  return steps.map((message, index) => ({ tool: `step-${index + 1}`, status: 'executed', message }));
}

function LoginPage() {
  const { login, user } = useAuth();
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('student@college.edu');
  const [password, setPassword] = useState('student123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password, role);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box className="auth-page">
      <Paper className="auth-card" elevation={3}>
        <Typography variant="h4" gutterBottom>College Academic Agent</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Secure academic assistant for students and administrators.
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField select fullWidth value={role} onChange={(event) => setRole(event.target.value)} label="Login as" margin="normal">
            <MenuItem value="student">Student</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>

          <TextField fullWidth label="Email" value={email} onChange={(event) => setEmail(event.target.value)} margin="normal" />
          <TextField fullWidth label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} margin="normal" />

          {error && <Typography color="error">{error}</Typography>}

          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ mt: 2 }}>
            {loading ? 'Signing in...' : 'Login'}
          </Button>
        </form>

        <Divider sx={{ my: 2 }} />

        <Typography variant="caption" color="text.secondary">
          Demo credentials: student@college.edu / student123 or admin@college.edu / admin123
        </Typography>
      </Paper>
    </Box>
  );
}

function StudentDashboard() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [marks, setMarks] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [conversations, setConversations] = useState([
    {
      id: 1,
      title: 'Academic overview',
      messages: [
        {
          id: 1,
          sender: 'assistant',
          text: 'Hello! I can check your academic records, attendance, marks, timetable, assignments, and college regulations.',
        },
      ],
    },
  ]);
  const [selectedConversationId, setSelectedConversationId] = useState(1);
  const [input, setInput] = useState('What is my attendance?');
  const [isSending, setIsSending] = useState(false);
  const [toolTrace, setToolTrace] = useState([]);
  const [source, setSource] = useState(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) || conversations[0],
    [conversations, selectedConversationId],
  );

  const attendanceSeries = attendance?.subjects ? attendance.subjects.map((item) => ({ label: item.subject, value: Number(item.percentage) })) : [];
  const marksSeries = marks?.subjects ? marks.subjects.map((item) => ({ label: item.subject, value: Number(item.total) })) : [];

  useEffect(() => {
    const loadData = async () => {
      if (!user || user.role !== 'student') return;

      try {
        const [profileResponse, attendanceResponse, marksResponse, assignmentResponse, timetableResponse] = await Promise.all([
          api.get(`/student/profile/${user.studentId}`),
          api.get(`/student/attendance/${user.studentId}`),
          api.get(`/student/marks/${user.studentId}`),
          api.get(`/student/assignments/${user.studentId}`),
          api.get(`/student/timetable/${user.studentId}`),
        ]);

        setProfile(profileResponse.data);
        setAttendance(attendanceResponse.data);
        setMarks(marksResponse.data);
        setAssignments(assignmentResponse.data || []);
        setTimetable(timetableResponse.data || []);
      } catch (error) {
        console.error('Unable to load dashboard data', error);
      }
    };

    loadData();
  }, [user]);

  const handleNewConversation = () => {
    const nextId = Date.now();
    const newConv = {
      id: nextId,
      title: 'New conversation',
      messages: [
        {
          id: 1,
          sender: 'assistant',
          text: 'Hello! I can help with attendance, marks, policies, timetables, and study planning.',
        },
      ],
    };

    setConversations((prev) => [newConv, ...prev]);
    setSelectedConversationId(nextId);
    setToolTrace([]);
    setSource(null);
    setInput('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMessage = { id: Date.now(), sender: 'user', text: trimmed };

    setConversations((prev) => prev.map((conversation) => {
      if (conversation.id !== selectedConversationId) return conversation;

      const nextTitle = conversation.title === 'New conversation' ? trimmed.slice(0, 28) : conversation.title;
      return {
        ...conversation,
        title: nextTitle,
        messages: [...conversation.messages, userMessage],
      };
    }));

    setInput('');
    setIsSending(true);
    setToolTrace(buildSuggestedTrace(trimmed));

    try {
      const response = await api.post('/chat', { message: trimmed });
      const assistantReply = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: response.data.answer,
      };

      setConversations((prev) => prev.map((conversation) => {
        if (conversation.id !== selectedConversationId) return conversation;
        return { ...conversation, messages: [...conversation.messages, assistantReply] };
      }));
      setToolTrace(response.data.tools || buildSuggestedTrace(trimmed));
      setSource(response.data.source || null);
    } catch (error) {
      const fallbackReply = { id: Date.now() + 2, sender: 'assistant', text: error.response?.data?.message || 'I could not answer that request.' };
      setConversations((prev) => prev.map((conversation) => {
        if (conversation.id !== selectedConversationId) return conversation;
        return { ...conversation, messages: [...conversation.messages, fallbackReply] };
      }));
    } finally {
      setIsSending(false);
    }
  };

  if (!user || user.role !== 'student') {
    return <Navigate to="/login" replace />;
  }

  return (
    <Box className="app-shell">
      <Box className="sidebar">
        <Typography variant="h6">Conversations</Typography>
        <Button variant="contained" sx={{ mt: 2, width: '100%' }} onClick={handleNewConversation}>New conversation</Button>

        <List className="conversation-list">
          {conversations.map((conversation) => (
            <ListItem key={conversation.id} disablePadding>
              <ListItemButton selected={conversation.id === selectedConversationId} onClick={() => setSelectedConversationId(conversation.id)}>
                <ListItemText primary={conversation.title} secondary={conversation.messages.length > 1 ? 'Active' : 'Started'} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2">Student profile</Typography>
        {profile ? (
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Chip label={profile.studentId} />
            <Typography variant="body2">{profile.name}</Typography>
            <Typography variant="body2">{profile.department} • Year {profile.year}</Typography>
            <Typography variant="body2">Semester {profile.semester}</Typography>
            <Typography variant="body2">CGPA: {profile.cgpa}</Typography>
          </Stack>
        ) : <Typography variant="body2">Loading profile...</Typography>}

        <Button variant="outlined" color="error" sx={{ mt: 3, width: '100%' }} onClick={logout}>Logout</Button>
      </Box>

      <Box className="main-panel">
        <AppBar position="static" color="transparent" className="topbar" elevation={0}>
          <Box className="topbar-content">
            <Typography variant="h6">Academic Assistant</Typography>
            <Typography variant="caption">{user.name}</Typography>
          </Box>
        </AppBar>

        <Grid container spacing={2} sx={{ mt: 1, px: 2 }}>
          <Grid item xs={12} md={8}>
            <Paper className="chat-panel">
              <Box className="chat-messages">
                {activeConversation.messages.map((message) => (
                  <Box key={message.id} className={`message-row ${message.sender}`}>
                    <Box className={`message-bubble ${message.sender}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                    </Box>
                  </Box>
                ))}

                {isSending && (
                  <Box className="tool-status-row">
                    <CircularProgress size={18} />
                    <Typography variant="body2">Analyzing your academic schedule...</Typography>
                  </Box>
                )}

                {toolTrace.length > 0 && (
                  <Box className="tool-trace-box">
                    {toolTrace.map((trace, index) => (
                      <Typography key={`${trace.tool}-${index}`} variant="body2">{trace.message}</Typography>
                    ))}
                  </Box>
                )}
              </Box>

              <Box className="chat-input-area">
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12 }}>
                  <TextField fullWidth value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about attendance, marks, exams, assignments, or policy rules" />
                  <Button type="submit" variant="contained" disabled={isSending}>Send</Button>
                </form>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Academic snapshot</Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  <Box>
                    <Typography variant="subtitle2">Attendance</Typography>
                    <BarChart data={attendanceSeries} color="#3b82f6" />
                    {attendance?.subjects?.map((item) => (
                      <Typography key={item.subject} variant="body2">{item.subject}: {item.percentage}%</Typography>
                    ))}
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2">Recent semester marks</Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Subject</TableCell>
                          <TableCell>Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(profile?.recentSemesterMarks || marks?.subjects || []).map((item) => (
                          <TableRow key={item.subject}>
                            <TableCell>{item.subject}</TableCell>
                            <TableCell>{item.total}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <BarChart data={marksSeries} color="#22c55e" />
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2">Pending assignments</Typography>
                    {assignments.length ? assignments.map((item) => (
                      <Typography key={item._id} variant="body2">{item.name} ({item.subject})</Typography>
                    )) : <Typography variant="body2">No pending assignments.</Typography>}
                  </Box>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2">Timetable</Typography>
                    {timetable.length ? timetable.map((day) => (
                      <Box key={day._id} sx={{ mt: 1 }}>
                        <Typography variant="body2"><strong>{day.day}</strong></Typography>
                        {day.classes.map((item) => (
                          <Typography key={`${day._id}-${item.subject}`} variant="body2">{item.subject} • {item.time}</Typography>
                        ))}
                      </Box>
                    )) : <Typography variant="body2">No timetable available.</Typography>}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {source && (
          <Paper className="citation-box">
            <Typography variant="subtitle2">Source</Typography>
            <Typography variant="body2">{source.title}</Typography>
            <Typography variant="body2">Section: {source.section}</Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
}

function AdminDashboard() {
  const { user, logout } = useAuth();
  const [students, setStudents] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [title, setTitle] = useState('Academic Regulations');
  const [section, setSection] = useState('General');
  const [content, setContent] = useState('');

  useEffect(() => {
    const loadAdminData = async () => {
      if (!user || user.role !== 'admin') return;
      try {
        const [studentsResponse, documentsResponse] = await Promise.all([
          api.get('/admin/students'),
          api.get('/admin/documents'),
        ]);
        setStudents(studentsResponse.data || []);
        setDocuments(documentsResponse.data || []);
      } catch (error) {
        console.error('Unable to load admin dashboard', error);
      }
    };

    loadAdminData();
  }, [user]);

  const addDocument = async (event) => {
    event.preventDefault();
    try {
      const response = await api.post('/admin/documents', { title, section, content });
      setDocuments((prev) => [response.data, ...prev]);
      setTitle('');
      setSection('General');
      setContent('');
    } catch (error) {
      console.error('Unable to upload document', error);
    }
  };

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <Box className="admin-layout">
      <AppBar position="static" color="transparent" elevation={0} className="topbar">
        <Box className="topbar-content">
          <Typography variant="h6">Admin Dashboard</Typography>
          <Button variant="outlined" onClick={logout}>Logout</Button>
        </Box>
      </AppBar>

      <Grid container spacing={3} sx={{ p: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Upload document</Typography>
            <form onSubmit={addDocument}>
              <TextField fullWidth label="Title" value={title} onChange={(event) => setTitle(event.target.value)} margin="normal" />
              <TextField fullWidth label="Section" value={section} onChange={(event) => setSection(event.target.value)} margin="normal" />
              <TextField fullWidth multiline minRows={4} label="Document content" value={content} onChange={(event) => setContent(event.target.value)} margin="normal" />
              <Button type="submit" variant="contained">Upload</Button>
            </form>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Uploaded documents</Typography>
            <List>
              {documents.map((doc) => (
                <ListItem key={doc._id} divider>
                  <ListItemText primary={doc.title} secondary={doc.section} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Students</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Semester</TableCell>
                  <TableCell>CGPA</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.department}</TableCell>
                    <TableCell>{student.semester}</TableCell>
                    <TableCell>{student.cgpa}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

function AppContent() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/" element={user && user.role === 'admin' ? <Navigate to="/admin" replace /> : user ? <StudentDashboard /> : <Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
