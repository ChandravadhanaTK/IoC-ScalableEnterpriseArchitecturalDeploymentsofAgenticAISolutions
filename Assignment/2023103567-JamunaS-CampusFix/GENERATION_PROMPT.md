# Generation Prompt – CampusFix (AI-Powered Campus Issue Management System)

## Project Overview
Build a complete, production-ready full-stack web application called **"CampusFix – AI-Powered Campus Issue Management System"**.

---

## Core Specifications & System Requirements

### 1. Zero-Barrier Student Registration & Authentication
- **Registration Fields**: Full Name, College Email, Password, Confirm Password, Department, Academic Year.
- **Strict Verification Rules**:
  - DO NOT use Aadhaar verification.
  - DO NOT use government ID verification.
  - DO NOT require any ID upload or identity verification.
  - DO NOT use OTP verification.
  - DO NOT require email verification.
  - Registration must work immediately with simple email + password.
  - The application must work end-to-end without requiring any external verification service.
- **Security**: Hash passwords with bcrypt (`bcryptjs`), issue signed JSON Web Tokens (JWT), and redirect directly to Student Dashboard.

### 2. Student Portal & Dashboard
- **Analytics KPIs**: Total Issues, Pending Issues, In Progress Issues, Resolved Issues.
- **Quick Actions**: Report New Issue, Track Issues by Reference ID, Student Profile, Sign Out.
- **Complaints Feed**: Table & card layout with status badges, priority levels, category tags, timestamps, and modal detail inspection.

### 3. Issue Submission & AI-Assisted Classification
- **Report Form**: Issue Title, Detailed Description, Category (11 categories: Hostel, Classroom, Laboratory, Library, Canteen, Transport, Electricity, Water, Internet, Cleanliness, Other), Campus Location, Urgency Priority (Low, Medium, High, Critical), and Optional Image Upload.
- **AI Classification Engine**:
  - Automatically evaluate title and description using `@google/genai` with `gemini-3.8-flash`.
  - Intelligently suggest Category, Priority level, and Responsible Campus Department (e.g., Plumbing & Civil Maintenance, Electrical Works, Network & IT Infrastructure, Sanitation).
  - Include an automatic rule-based fallback classifier with keyword scoring for 100% offline reliability.
- **Persistence**: Automatically assign unique reference ID (`CF-2026-XXXX`), set status to `Pending`, write audit log, and notify student.

### 4. Interactive Live Issue Tracking
- Search any issue by Reference ID.
- Visual status progress stepper: `Pending` → `Assigned` → `In Progress` → `Resolved` (or `Rejected`).
- Full chronological audit log displaying status changes, responsible department, and official administrative inspection remarks.

### 5. Administrator Dispatch Console & Analytics
- Dedicated role-protected admin portal (`admin@campusfix.edu` / `AdminPassword123!` with 1-click demo button).
- **Analytics Dashboard**: Distribution charts for Category breakdown, Priority severity matrix, and Resolution funnel.
- **Ticket Management**: Search and filter by status, priority, or category. Escalate statuses, assign handling departments, and append official remarks with immediate in-app student notification.

### 6. In-App Notification System
- Bell dropdown with live unread badge count.
- Triggers notifications on ticket submission, crew assignment, status changes, and admin remarks.

### 7. Full-Stack Tech Stack & Persistence
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Node.js, Express.js, JWT, bcryptjs, CORS.
- **Database**: Dual-mode MongoDB layer (connects to remote MongoDB when `MONGODB_URI` is provided; falls back to persistent embedded JSON database `data/db_*.json` with BSON indexing).
- **AI Integration**: Google GenAI SDK (`@google/genai`).
