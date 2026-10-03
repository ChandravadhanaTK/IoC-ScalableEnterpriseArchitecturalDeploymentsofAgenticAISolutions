# PlantCare AI — AI-Powered Agentic Plant Care Assistant

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore-FFA611.svg)](https://firebase.google.com/)
[![Gemini API](https://img.shields.io/badge/Gemini_API-1.5_Flash-4285F4.svg)](https://aistudio.google.com/)

**PlantCare AI** is a complete, production-ready, enterprise-grade web application developed for an academic enterprise-architecture capstone. It empowers users to manage their plants, track care activities, schedule proactive maintenance, formulate vacation survival strategies, and interact with an autonomous **Agentic AI Assistant**.

> *"Your intelligent companion for healthier, happier plants."*

---

## 1. Project Overview

PlantCare AI bridges real-time botanical collection management with autonomous AI agent reasoning. The system does not merely answer botanical trivia; it executes a genuine **Agentic Workflow**:
- Retrieves stored plant data and care intervals.
- Inspects pending and overdue tasks.
- Reasons over transpiration needs and travel durations.
- Selects and executes specific internal tools (`getUserPlants`, `createVacationPlan`, `updateCareTask`, etc.).
- Enforces **Human-in-the-Loop Confirmation** before committing any database modifications.
- Formulates cautious, evidence-based diagnostic guidance without false certainty.

---

## 2. Key Features

### 🌿 Botanical Collection Management ("My Plants")
- Add, edit, delete, and view comprehensive plant profiles.
- Fields: Name, Species/Type, Environment (Indoor/Outdoor), Location, Last Watered Date, Watering Frequency (days), and Care Notes.
- Form validation preventing invalid intervals or empty titles.
- Filter by care status (*Healthy*, *Care Due*, *Overdue*) and environment (*Indoor*, *Outdoor*).
- 1-Click "Load Sample Plants" (*Money Plant*, *Tulsi*, *Aloe Vera*, *Snake Plant*).

### 💧 Automated Water Flow & Schedule Recalibration
- **"Mark as Watered"** action:
  1. Records care activity event in `careRecords`.
  2. Updates `lastWatered` date to today.
  3. Recalculates `nextWateringDate` based on `wateringFrequency`.
  4. Resolves pending watering tasks for this plant.
  5. Schedules next cycle task in the Care Planner.

### 📅 Proactive Care Planner
- Chronological timeline grouping: **TODAY**, **TOMORROW**, **IN 3 DAYS**, **LATER THIS MONTH**, **OVERDUE**, and **COMPLETED**.
- Interactive checkbox toggle with instant state persistence.
- "Add Custom Task" modal for specialized pruning, misting, soil checks, or fertilizing.

### 📜 Historical Care Activity Audit ("Care History")
- Comprehensive audit trail recording Plant Name, Action, Execution Date, and Feedback Notes.
- Filter logs by plant or search by action keywords.

### 🤖 Autonomous Agentic AI Assistant
- Dedicated chat interface with memory and suggested prompt chips.
- Direct tool integration (`getUserPlants`, `getPlantDetails`, `getUpcomingCareTasks`, `getCareHistory`, `createCarePlan`, `createVacationPlan`, `updateCareTask`).
- Visualized **Tools Executed** tags for complete transparency.
- Interactive **Human-in-the-Loop** confirmation cards (`[Confirm Action]` / `[Cancel]`).
- Cautious diagnostic language for leaf discoloration and health issues (*"One possible cause..."*, *"Consider checking..."*).

### 📊 Observability & Monitoring Dashboard
- Application-level metrics: Registered users, active plants, care tasks, completion percentage, AI requests, success rate, and latency.
- Real-time application health probes for **Authentication**, **Cloud Database**, and **AI Assistant Engine**.
- Live audit table of recent AI interactions with tool signatures and duration.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript |
| **Build Tool & Bundler** | Vite 8.3 |
| **Styling & Design System** | Tailwind CSS 3.4 (Forest, Sage & Earth color palette) |
| **Authentication** | Firebase Authentication (Email/Password + 1-Click Demo Login) |
| **Cloud Database** | Cloud Firestore (Document store with strict security rules) |
| **AI Agent Engine** | Google Gemini API (Gemini 1.5 Flash) + Local Autonomous Reasoning Engine |
| **Deployment / Hosting** | Firebase Hosting / Firebase App Hosting |
| **Testing** | Node test runner with `vite-node` verification suite |

---

## 4. Architecture Overview

```
User (Browser)
   ↓ [HTTPS]
React 19 Frontend SPA (Vite + Tailwind)
   ├── AuthContext (Firebase Auth / Demo Session)
   ├── PlantContext (Cloud Firestore Sync / Local Mirror)
   └── Agentic Assistant Engine
          ├── Google Gemini 1.5 Flash API
          ├── Agent Tool Suite (getUserPlants, createVacationPlan, etc.)
          └── Human-in-the-Loop Confirmation Gate
                 ↓ [request.auth.uid == resource.data.userId]
      Cloud Firestore Database (Users, Plants, CareTasks, CareRecords, AIInteractions)
```

For complete enterprise architecture diagrams and specifications, see:
- [`docs/architecture.md`](docs/architecture.md)

---

## 5. Agent Workflow

The agent adheres strictly to the capstone reasoning pipeline:

```
USER REQUEST 
   ↓
UNDERSTAND REQUEST
   ↓
IDENTIFY REQUIRED INFORMATION
   ↓
READ RELEVANT PLANT DATA (getUserPlants, getPlantDetails, etc.)
   ↓
ANALYZE BOTANICAL STATE
   ↓
DECIDE ACTION / RECOMMENDATION
   ↓
GENERATE RESULT
   ↓
DATA MUTATION REQUIRED?
   ├── YES ──> Present [Confirm] / [Cancel] ──> On Confirm ──> COMMIT TO FIRESTORE
   └── NO  ──> Formulate Cautious Botanical Response
   ↓
LOG TELEMETRY & DELIVER TO USER
```

For the complete workflow diagram and error handling paths, see:
- [`docs/agent-workflow.md`](docs/agent-workflow.md)

---

## 6. Database Structure (Cloud Firestore)

| Collection | Schema Key Fields | Description |
| :--- | :--- | :--- |
| `users` | `uid`, `email`, `displayName`, `createdAt` | User identity profile |
| `plants` | `id`, `userId`, `name`, `species`, `environment`, `location`, `lastWatered`, `wateringFrequency`, `nextWateringDate`, `status`, `notes`, `isDemo` | Botanical collection records |
| `careTasks` | `id`, `userId`, `plantId`, `plantName`, `taskType`, `dueDate`, `status`, `completedAt`, `notes` | Scheduled maintenance tasks |
| `careRecords` | `id`, `userId`, `plantId`, `plantName`, `action`, `date`, `notes` | Historical care activity logs |
| `aiInteractions` | `id`, `userId`, `requestType`, `promptSummary`, `timestamp`, `toolsUsed`, `durationMs`, `success` | Observability audit traces |

---

## 7. Security Model & Rules

Every Firestore collection is shielded by strict user-level data isolation:
```javascript
// Example from firestore.rules
match /plants/{plantId} {
  allow read, delete: if request.auth != null && resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
  allow update: if request.auth != null && resource.data.userId == request.auth.uid && request.resource.data.userId == request.auth.uid;
}
```
Key security features:
- **Zero Cross-Tenant Leakage**: All reads/writes enforced by UID claims.
- **Environment Isolation**: Secrets stored exclusively in `.env` (never hard-coded).
- **Tool Argument Validation**: Prevents malicious parameter injection.
- **Safe Fallback**: Local simulation mode protects against external service downtime.

For full threat analysis and rules, see:
- [`docs/security.md`](docs/security.md)

---

## 8. Deployment Steps

### Quick Start (Local Development)
```bash
# 1. Install dependencies
npm install

# 2. Run automated test suite
npx vite-node tests/verify_app.mjs

# 3. Start local development server
npm run dev
```

### Production Build & Preview
```bash
# Compile optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

### Deploy to Firebase Hosting
```bash
# 1. Login to Firebase CLI
npx firebase-tools login

# 2. Select project
npx firebase-tools use --add your-firebase-project-id

# 3. Deploy rules and static assets
npx firebase-tools deploy --only firestore:rules,hosting
```

For full deployment documentation and diagrams, see:
- [`docs/deployment.md`](docs/deployment.md)

---

## 9. Environment Variables Required

Create a `.env` file in the root directory (based on `.env.example`):

```bash
# Firebase Client SDK Configuration
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Google Gemini API Key
VITE_GEMINI_API_KEY=AIzaSy...
```

*(Note: In-app key configuration is also available directly via the Key icon in the navigation bar!)*

---

## 10. Testing Performed

The project features a comprehensive end-to-end verification test suite (`tests/verify_app.mjs`) covering:
1. **Status Computation**: Tests `Overdue`, `Care Due`, and `Healthy` calculations across date boundaries.
2. **Sample Data Integrity**: Verifies generation of Money Plant, Tulsi, Aloe Vera, and Snake Plant with realistic schedules.
3. **Plant CRUD & Watering Recalibration**: Tests updating `lastWatered`, advancing `nextWateringDate`, logging `CareRecord`, and creating the next task.
4. **Care Planner Timeline**: Verifies bucketing into Overdue, Today, Tomorrow, In 3 Days, and Later.
5. **Agentic AI Tools**: Tests `getUserPlants`, `getUpcomingCareTasks`, `getPlantDetails`, `createVacationPlan`, `runAgentQuery`, and human confirmation execution.
6. **Multi-User Data Isolation**: Validates that User B cannot read User A's botanical records.

### Verification Results
```text
--- PlantCare AI Verification Suite ---
RESULTS: 37 Passed, 0 Failed
```

---

## 11. Live Deployment & Demonstration

- **Local Preview URL**: `http://localhost:5173/`
- **Demo Access**: Click **"1-Click Instant Demo Login"** on the Login page to instantly explore all features with sample plants.
- **Production Hosting Target**: Firebase Hosting (`https://plantcare-ai-capstone.web.app`)