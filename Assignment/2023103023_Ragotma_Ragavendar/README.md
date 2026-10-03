# 🎓 Campus Crisis Manager

A responsive, client-side web application designed to help students transform chaotic academic emergencies (overlapping exams, unresponsive teammates, tight deadlines, missing submissions) into clear, prioritized, step-by-step recovery plans and communication templates.

---

## 🌟 Overview & Key Features

**Campus Crisis Manager** helps students handle academic pressure using an automated 4-agent triage workflow:

1. **🧠 Situation Analyzer**: Detects urgency levels (*Low*, *Medium*, *High*, *Critical*), extracts core pressure points, and identifies missing critical details (e.g., exact submission cut-off times).
2. **⚡ Strategy Agent**: Evaluates options and recommends high-impact trade-offs (e.g., prioritizing a Minimum Viable Demo over non-essential features).
3. **📋 Recovery Planner**: Converts choices into time-bracketed, prioritized action steps (`NOW`, `NEXT`, `TODAY`, `AFTER`).
4. **💬 Communication Agent**: Generates context-aware draft communications for professors and teammates (Professor emails, extension requests, teammate handoffs, meeting requests) with adjustable tones (*Warm*, *Formal*, *Concise*).

### 🛠 Key Functionality
- **Automated Crisis Triage**: Input any situation narrative or choose sample scenarios to auto-detect category & severity.
- **Local History Persistence**: Saves past crisis analyses directly in browser LocalStorage (`campus-crisis-manager-history-v1`) without requiring accounts or backend databases.
- **Interactive Communication Generator**: Customize target audience, message tone, and variations with single-click copying to clipboard.
- **Responsive Navigation**: Full tabbed interface with Dashboard, How It Works, and Saved Crisis History views.

---

## 🏗️ Project Architecture & Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [React 19](https://react.dev/) + [TanStack Start](https://tanstack.com/router/latest) / Router |
| **Build Tooling** | [Vite](https://vitejs.dev/) + TypeScript 5 |
| **Styling & UI** | [Tailwind CSS v4](https://tailwindcss.com/) + Radix UI primitives + Lucide React Icons |
| **State & Analysis** | Deterministic Client-side Engine (`src/lib/crisis-analysis.ts`) |
| **Persistence** | Browser `localStorage` |

---

## 🚀 Quick Start & Installation

### Prerequisites
- Node.js (v18+) and `npm` or `bun`

### Setup Instructions

1. **Navigate to the project workspace:**
   ```bash
   cd pixel-perfect-view-4662
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Open in Browser:**
   Navigate to `http://localhost:3000` (or the local server URL displayed in your terminal).

---

## 📜 Available Scripts

- `npm run dev` - Launches Vite development server.
- `npm run build` - Builds production bundle.
- `npm run preview` - Previews the production build locally.
- `npm run test` - Runs Vitest unit and integration test suite.
- `npm run lint` - Runs ESLint code quality checks.
- `npm run format` - Formats code using Prettier.

---

## 📂 Folder Structure

```
.
├── pixel-perfect-view-4662/
│   ├── public/              # Static public assets
│   ├── src/
│   │   ├── components/      # UI components (Radix UI wrappers)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/
│   │   │   └── crisis-analysis.ts  # Core crisis analysis engine & communication builder
│   │   ├── routes/
│   │   │   ├── __root.tsx    # Root layout & page header/navigation
│   │   │   └── index.tsx     # Main Campus Crisis Manager application
│   │   └── test/            # Vitest suite
│   ├── package.json
│   └── vite.config.ts
├── README.md                # Project documentation
└── deliverables.md          # Project deliverables checklist & overview
```
