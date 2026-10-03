# 🚀 TaskFlow RBAC System

A production-ready Role-Based Access Control (RBAC) Task Management System built using Node.js, Express.js, PostgreSQL, Prisma ORM, JWT Authentication, and Docker.

This project demonstrates real-world backend engineering concepts such as Authentication, Authorization, RBAC, Database Design, REST APIs, Validation, Pagination, Filtering, Swagger Documentation, and Scalable Architecture.

---

# 📖 Project Overview

TaskFlow RBAC System is a secure task management platform where users can create and manage their own tasks while administrators can access and manage all tasks across the system.

The application follows a layered backend architecture:

* Controllers Layer
* Services Layer
* Middleware Layer
* Database Layer (Prisma ORM)
* PostgreSQL Database

This separation improves maintainability, scalability, and code readability.

---

# ✨ Features

## Authentication

* User Registration
* User Login
* Password Hashing using bcryptjs
* JWT Token Authentication
* Protected Routes
* Current User Endpoint (`/auth/me`)

## Authorization (RBAC)

### USER

* Create Own Tasks
* View Own Tasks
* Update Own Tasks
* Delete Own Tasks

### ADMIN

* View All Tasks
* Manage All Tasks
* Access Any User's Tasks

## Task Management

* Create Task
* Get All Tasks
* Get Single Task
* Update Task
* Delete Task

## Advanced Features

* Pagination
* Task Status Filtering
* Input Validation
* Global Error Handling
* Swagger API Documentation
* Dockerized PostgreSQL
* Admin Seed Script

---

# 🛠 Tech Stack

## Backend

* Node.js
* Express.js

## Database

* PostgreSQL

## ORM

* Prisma ORM

## Authentication

* JWT (jsonwebtoken)
* bcryptjs

## Validation

* Zod

## Security

* Helmet
* CORS

## Logging

* Morgan

## API Documentation

* Swagger UI Express

## Infrastructure

* Docker
* Docker Compose

---

# 📦 Dependencies

## Production Dependencies

```json
{
  "@prisma/client": "^6.14.0",
  "bcryptjs": "^3.0.3",
  "cors": "^2.8.5",
  "dotenv": "^17.0.0",
  "express": "^5.1.0",
  "express-rate-limit": "^8.0.1",
  "helmet": "^8.1.0",
  "jsonwebtoken": "^9.0.2",
  "morgan": "^1.10.0",
  "swagger-ui-express": "^5.0.1",
  "zod": "^4.0.0"
}
```

## Development Dependencies

```json
{
  "nodemon": "^3.1.0",
  "prisma": "^6.14.0"
}
```

---

# 🗄 Database

Database Used:

**PostgreSQL 16**

Running inside Docker Container:

```bash
postgres:16
```

Prisma ORM is used to communicate with PostgreSQL.

---

# 🏗 System Architecture

```text
Client (Postman / Frontend)
             │
             ▼
      Express Server
             │
 ┌───────────┼───────────┐
 │           │           │
 ▼           ▼           ▼
Routes   Middleware   Controllers
             │
             ▼
          Services
             │
             ▼
         Prisma ORM
             │
             ▼
        PostgreSQL
```

---

# 📂 Project Structure

```text
TASKFLOW-RBAC-SYSTEM
│
├── backend
│   ├── prisma
│   │   ├── migrations
│   │   ├── schema.prisma
│   │   └── seed.js
│   │
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── routes
│   │   ├── services
│   │   ├── validators
│   │   ├── utils
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── .env
│   ├── package.json
│   └── README.md
│
├── frontend
│
└── docker-compose.yml
```

---

# 🗃 Database Schema

## User

| Field     | Type         |
| --------- | ------------ |
| id        | UUID         |
| name      | String       |
| email     | String       |
| password  | String       |
| role      | ADMIN / USER |
| createdAt | DateTime     |

## Task

| Field       | Type                              |
| ----------- | --------------------------------- |
| id          | UUID                              |
| title       | String                            |
| description | String                            |
| status      | PENDING / IN_PROGRESS / COMPLETED |
| userId      | UUID                              |
| createdAt   | DateTime                          |
| updatedAt   | DateTime                          |

---

# 📊 ER Diagram

```text
User
 ├── id
 ├── name
 ├── email
 ├── password
 ├── role
 └── createdAt
       │
       │ 1
       │
       ▼
Task
 ├── id
 ├── title
 ├── description
 ├── status
 ├── userId
 ├── createdAt
 └── updatedAt
```

---

# 🔐 Authentication Flow

```text
User Login
    │
    ▼
Validate Credentials
    │
    ▼
Generate JWT
    │
    ▼
Return Token
    │
    ▼
Protected Request
    │
    ▼
Verify JWT
    │
    ▼
Access Granted
```

---

# 🛡 RBAC Flow

```text
Request
   │
   ▼
JWT Middleware
   │
   ▼
Get User Role
   │
   ▼
ADMIN ?
 ├── YES → Access All Resources
 │
 └── NO
       │
       ▼
 Check Ownership
       │
       ▼
 Allow / Deny
```

---

# 📡 API Endpoints

## Authentication APIs

### Register

```http
POST /api/v1/auth/register
```

### Login

```http
POST /api/v1/auth/login
```

### Current User

```http
GET /api/v1/auth/me
```

---

## Task APIs

### Create Task

```http
POST /api/v1/tasks
```

### Get Tasks

```http
GET /api/v1/tasks
```

### Get Single Task

```http
GET /api/v1/tasks/:id
```

### Update Task

```http
PUT /api/v1/tasks/:id
```

### Delete Task

```http
DELETE /api/v1/tasks/:id
```

---

# 🔎 Pagination

Example:

```http
GET /api/v1/tasks?page=1&limit=5
```

Response:

```json
{
  "pagination": {
    "total": 20,
    "page": 1,
    "limit": 5,
    "totalPages": 4
  }
}
```

---

# 🔍 Filtering

Example:

```http
GET /api/v1/tasks?status=PENDING
```

Supported Values:

* PENDING
* IN_PROGRESS
* COMPLETED

---

# 📄 Swagger Documentation

![Swagger UI](../assets/swagger.png)

After starting the server:

```bash
npm run dev
```

Open:

```text
http://localhost:5000/api-docs
```

Swagger UI allows interactive API testing directly from the browser.

---

# 🧪 Testing

The application was tested using:

* Postman
![Postman Testing](../assets/postman-tests.png)
* Swagger UI

### Tested Scenarios

✅ Registration

✅ Login

✅ JWT Authentication

✅ Protected Routes

✅ Create Task

✅ Get Tasks

✅ Get Task By ID

✅ Update Task

✅ Delete Task

✅ Pagination

✅ Filtering

✅ RBAC

✅ Admin Access

---

# ⚙ Environment Variables

Create `.env`

```env
PORT=5000

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/taskflow?schema=public"

JWT_SECRET=mySuperSecretKey
```

---

# 🚀 Installation

### Clone Repository

```bash
git clone <repository-url>
```

### Install Dependencies

```bash
npm install
```

### Run PostgreSQL

```bash
docker compose up -d
```

### Run Migration

```bash
npx prisma migrate dev
```

### Generate Prisma Client

```bash
npx prisma generate
```

### Seed Admin User

```bash
npm run seed
```

### Start Server

```bash
npm run dev
```

---

# 👤 Admin Credentials

```text
Email: admin@taskflow.com
Password: admin123
```

---

# 📈 Scalability Considerations

## Horizontal Scaling

Deploy multiple Node.js instances behind a load balancer.

## Database Scaling

* Read Replicas
* Query Optimization
* Connection Pooling

## Redis Caching

Frequently accessed task data can be cached to reduce database load.

## Microservice Migration Strategy

Future services can be separated into:

* Authentication Service
* User Service
* Task Service
* Notification Service

---

# 🔮 Future Enhancements

* Refresh Token Authentication
* Redis Cache
* Unit Testing
* Integration Testing
* CI/CD Pipeline
* Kubernetes Deployment
* Email Verification
* Password Reset
* Activity Logs

---

# 👨‍💻 Author

**Rahul Meena**

Electronics & Communication Engineering Student

Backend Developer | Full-Stack Developer

Interested in Backend Engineering, Distributed Systems, Databases, and Scalable Web Applications.
