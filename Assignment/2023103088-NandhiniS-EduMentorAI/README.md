# EduMentor AI

## Agent-Based Learning & Assessment Platform

EduMentor AI is a web-based learning platform that helps students transform PDF study materials into interactive quizzes. The platform uses an agent-based workflow to generate questions, evaluate answers, and create personalized study plans based on student performance.

The system demonstrates Agent-Oriented AI concepts through three specialized agents working together to support learning and self-assessment.

---

## Features

### Authentication

- Student Registration
- Student Login
- Password Reset
- Secure Logout
- Protected Application Routes

### PDF Learning Library

- Upload PDF Study Materials
- View Uploaded PDFs
- Search PDFs
- Delete PDFs
- Store Documents in Supabase Storage

### Quiz Generation

- Generate Questions from Uploaded PDFs
- Select Difficulty Level
  - Easy
  - Medium
  - Hard
- Select Number of Questions
- Create Interactive Assessments

### Quiz System

- Timed Quizzes
- Progress Tracking
- Question Navigation
- Answer Submission
- Automated Evaluation

### Performance Tracking

- Quiz History
- Overall Accuracy
- Best Score
- Average Score
- Strong Topics
- Weak Topics

### Personalized Study Plans

- Identify Weak Areas
- Generate Study Recommendations
- Suggest Revision Activities
- Track Learning Progress

### Admin Panel

- View Registered Users
- Monitor Uploaded PDFs
- View Quiz Statistics
- Monitor Agent Activities
- View Platform Analytics

---

## Agent Architecture

EduMentor AI uses three collaborating agents.

### 1. Question Generation Agent

Responsibilities:

- Read extracted PDF text
- Identify important concepts
- Generate assessment questions
- Create quizzes from learning material

Generated Question Types:

- Fill in the Blank
- Keyword-Based Questions
- Short Answer Questions

---

### 2. Evaluation Agent

Responsibilities:

- Compare student answers with expected keywords
- Calculate scores
- Generate feedback
- Identify learning gaps

Outputs:

- Quiz Score
- Accuracy Percentage
- Feedback Summary
- Weak Concepts

---

### 3. Study Planner Agent

Responsibilities:

- Analyze student performance
- Detect weak topics
- Generate study plans
- Recommend revision schedules

Outputs:

- Recommended Topics
- Learning Goals
- Personalized Revision Plan

---

## Technology Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts
- Lucide React

### Backend

- Supabase Authentication
- PostgreSQL Database
- Supabase Storage

### Testing

- Vitest

---

## User Roles

### Student

Students can:

- Upload PDFs
- Generate Quizzes
- Attempt Quizzes
- View Results
- Access Study Plans
- Track Progress

### Admin

Admins can:

- View Users
- View PDFs
- Monitor Agent Activity
- View Analytics
- Manage Platform Data

---

## Application Modules

### Dashboard

Displays:

- Uploaded PDF Count
- Quiz Attempts
- Best Score
- Average Score
- Recent Activity
- Performance Summary

### PDF Library

Features:

- Upload Documents
- View Documents
- Search Documents
- Delete Documents

### Quiz Module

Features:

- Quiz Generation
- Quiz Attempt
- Automatic Evaluation
- Score Calculation

### Results Module

Displays:

- Quiz History
- Strong Topics
- Weak Topics
- Accuracy Statistics
- Previous Attempts

### Study Plan Module

Displays:

- Personalized Study Plan
- Weak Topics
- Recommended Tasks
- Revision Goals

### Profile Module

Displays:

- Student Information
- Quiz Statistics
- Average Score
- Best Score

### Admin Module

Displays:

- User Statistics
- Quiz Analytics
- Agent Logs
- Platform Metrics

---

## Database Schema

### Core Tables

- profiles
- user_roles
- pdf_documents
- generated_questions
- quiz_attempts
- quiz_answers
- quiz_results
- study_plans
- agent_logs
- audit_logs

---

## Security

The platform uses:

- Supabase Authentication
- Role-Based Access Control
- Protected Routes
- Row Level Security (RLS)
- User-Specific Data Access

Students can access only their own records, while administrators can manage platform-wide data.

---

## Project Workflow

```text
Student Uploads PDF
            |
            v
Question Generation Agent
            |
            v
Quiz Created
            |
            v
Student Attempts Quiz
            |
            v
Evaluation Agent
            |
            v
Result Generated
            |
            v
Study Planner Agent
            |
            v
Personalized Study Plan Created
```

---

## Current Limitations

- Quiz questions are generated from PDF text and are primarily fill-in-the-blank and keyword-based questions.
- Short-answer evaluation relies on keyword matching and may not fully measure conceptual understanding.
- Scanned PDFs without selectable text cannot be processed for quiz generation.
- Avatar upload functionality is not implemented.
- Learning streak tracking is not implemented.
- Weekly performance chart is not implemented.
- A dedicated AI Insights page is not implemented; only a brief insight is shown on the dashboard.
- Authentication, route protection, and upload-specific automated tests are not included.

---

## Future Enhancements

- AI-generated comprehension-based questions using LLM APIs.
- Advanced answer evaluation using semantic similarity.
- Support for scanned documents through OCR.
- Personalized AI tutoring assistant.
- Learning streaks and gamification.
- Advanced performance analytics.
- Enhanced study planning recommendations.

---

## Deployment

### Frontend

- Vercel

### Backend

- Supabase

### Environment Variables

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## Final Goal

EduMentor AI is designed to help students learn more effectively by converting study materials into interactive assessments and personalized study plans through an agent-based workflow. The platform demonstrates practical Agent-Oriented AI concepts using a Question Generation Agent, Evaluation Agent, and Study Planner Agent working together to support learning and performance improvement.

## Deployment Link : https://edumentor-ai-appl.vercel.app/

github link : https://github.com/Nandhini-s25/EduMentor_AI