# College Academic Agent

A full-stack academic assistant for students, built with Express, MongoDB native driver, local RAG, and React + Material UI.

## Features

- Student authentication and JWT-secured access
- Student profile, attendance, marks, timetable, assignment, and academic calendar APIs
- Rule-based agentic orchestration with document search and calculations
- Local document retrieval using lightweight embedding similarity
- Admin dashboard for uploading academic policies and managing student information
- React front-end chat experience with citations and tool traces

## Local setup

1. Copy `.env.example` to `.env` and adjust values.
2. Start MongoDB locally on `mongodb://127.0.0.1:27017`.
3. Start backend:
   - `npm install`
   - `npm run dev`
4. Start frontend:
   - `cd frontend`
   - `npm install`
   - `npm run dev`

## Demo login

- Student: `student@college.edu` / `student123`
- Admin: `admin@college.edu` / `admin123`

## API overview

- `POST /api/auth/login`
- `POST /api/auth/admin/login`
- `GET /api/student/profile/:studentId`
- `GET /api/student/attendance/:studentId`
- `GET /api/student/marks/:studentId`
- `GET /api/student/assignments/:studentId`
- `GET /api/student/timetable/:studentId`
- `GET /api/student/calendar`
- `POST /api/chat`
- `GET /api/admin/students`
- `POST /api/admin/documents`

## Notes

This project uses a local in-memory fallback when MongoDB is unavailable, while still using the MongoDB native driver for the real database path.
