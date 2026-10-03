# 🎨 TaskFlow RBAC System - Frontend

A modern **Task Management Dashboard** built using **Next.js 15 App Router**, **React**, **Tailwind CSS**, and **Axios**, designed to work with the **TaskFlow RBAC Backend API**.

The frontend provides a clean, responsive interface for authentication, role-based task management, and dashboard operations.

---

# 📖 Project Overview

TaskFlow RBAC Frontend is a responsive web application where users can:

* Register an account
* Login securely using JWT Authentication
* Access a protected dashboard
* Create tasks
* Edit tasks
* Delete tasks
* Search tasks
* Filter tasks by status
* View task statistics
* Toggle Dark Mode

The application communicates with the backend REST APIs using Axios.

---

# ✨ Features

## 🔐 Authentication

* User Registration
* User Login
* JWT Token Storage
* Protected Routes
* Logout

---

## 📊 Dashboard

* Total Tasks Card
* Pending Tasks
* In Progress Tasks
* Completed Tasks
* Search Tasks
* Status Filter
* Pagination
* Dark Mode
* Loading Spinner
* Empty State UI

---

## 📝 Task Management

* Create Task
* Edit Task
* Delete Task
* Status Badge
* Created Date Display

---

## 🎨 UI Features

* Responsive Design
* Modern Dashboard
* Dark / Light Mode
* Gradient Buttons
* Toast Notifications
* Mobile Friendly

---

# 🛠 Tech Stack

## Framework

* Next.js 15
* React 19

---

## Styling

* Tailwind CSS

---

## Form Handling

* React Hook Form

---

## API Client

* Axios

---

## Notifications

* React Hot Toast

---

## Authentication

* JWT Token
* Protected Routes

---

# 📂 Project Structure

```text
frontend/

│

├── app/

│   ├── dashboard/
│   │      page.jsx
│   │
│   ├── login/
│   │      page.jsx
│   │
│   ├── register/
│   │      page.jsx
│   │
│   ├── tasks/
│   │     ├── create/
│   │     │      page.jsx
│   │     │
│   │     └── edit/
│   │            [id]/
│   │               page.jsx
│   │
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.js
│   └── page.js
│
├── components/
│      Loader.jsx
│      ProtectedRoute.jsx
│
├── context/
│      AuthContext.jsx
│
├── lib/
│      axios.js
│
├── services/
│      auth.service.js
│      task.service.js
│
├── public/
│
├── .env.local
│
├── package.json
│
└── next.config.mjs
```

---

# 🔐 Authentication Flow

```text
Register

↓

Login

↓

Receive JWT Token

↓

Store Token in LocalStorage

↓

Axios Interceptor

↓

Protected API Calls

↓

Dashboard Access
```

---

# 📊 Dashboard Features

* Task Statistics
* Search Tasks
* Filter by Status
* Pagination
* Edit Task
* Delete Task
* Create Task
* Dark Mode

---

# 🌙 Dark Mode

The application supports:

* Dashboard
* Login Page
* Register Page
* Create Task Page
* Edit Task Page

Theme preference is stored in LocalStorage.

---

# 📡 Backend API

Default Backend URL:

```text
http://localhost:5000/api/v1
```

Configured inside:

```text
lib/axios.js
```

---

# ⚙ Environment Variables

Create:

```text
.env.local
```

Add:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone <repository-url>
```

---

## Move to Frontend

```bash
cd frontend
```

---

## Install Dependencies

```bash
npm install
```

---

## Start Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 📷 Suggested Screenshots

```text
screenshots/

login.png

register.png

dashboard.png

create-task.png

edit-task.png

dark-dashboard.png
```

---

# 🔮 Future Improvements

* Sidebar Navigation
* User Avatar
* Charts & Analytics
* SweetAlert Delete Modal
* Framer Motion Animations
* Profile Page
* Email Verification
* Forgot Password
* Notifications
* Progressive Web App (PWA)

---

# 👨‍💻 Author

**Rahul Meena**

Electronics & Communication Engineering Student

Full Stack Developer

Interested in Backend Engineering, Frontend Development, Databases, and Scalable Web Applications.

---

# ⭐ Highlights

* Next.js 15 App Router
* JWT Authentication
* Protected Routes
* CRUD Operations
* Search & Filtering
* Pagination
* Dark Mode
* Responsive Dashboard
* Modern UI
* Axios API Integration

---

## ⭐ If you like this project, consider giving it a Star on GitHub!
