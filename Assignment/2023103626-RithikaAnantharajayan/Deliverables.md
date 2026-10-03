## 1.1 Architecture Diagram

The PlantCare AI application follows a simple agentic architecture consisting of a React frontend, Firebase Authentication, Cloud Firestore, Gemini AI agent, Firebase Hosting, and monitoring.

![PlantCare AI Architecture Diagram](./PlantCare%20AI%20Architecture%20Diagram.png)




### 1.2 Architectural Layers

The PlantCare AI system is organized into the following architectural layers. Each layer has a specific responsibility, which keeps the application modular, secure, and easy to deploy.

#### 1. Presentation Layer

**Technology:** React + TypeScript + Tailwind CSS

This is the user-facing layer of the application. It provides the interface through which users interact with PlantCare AI.

**Responsibilities:**

* User registration and login interface
* Plant management interface
* Dashboard and care planner
* Care history
* AI assistant chat interface
* Monitoring dashboard
* Display of plant-care recommendations and tasks
* Responsive design for desktop, tablet, and mobile

The presentation layer communicates with the backend services and displays the results to the user.

---

#### 2. Authentication & Security Layer

**Technology:** Firebase Authentication + Firestore Security Rules

This layer manages user identity and access control.

**Responsibilities:**

* User registration and login
* User logout and session management
* Authentication of application users
* Protecting application routes
* Ensuring users can access only their own plant and care data
* Enforcing authorization through Firestore security rules

Each user's data is associated with their authenticated user ID.

---

#### 3. Agent / Intelligence Layer

**Technology:** Gemini AI

This is the intelligence layer of PlantCare AI and is responsible for the agentic behavior of the application.

**Responsibilities:**

* Understand natural-language user requests
* Identify the user's intent
* Retrieve relevant plant information
* Analyze plant-care requirements
* Generate personalized recommendations
* Create care plans
* Generate vacation care plans
* Identify plants requiring attention
* Respond to plant-care questions
* Determine when application tools/functions are required

Unlike a simple chatbot, the agent can use application data and tools to produce context-aware responses.

---

#### 4. Agent Tools / Application Logic Layer

This layer provides the functions that the AI agent can use to interact with application data.

**Example tools:**

* `getUserPlants()` – Retrieves the user's plants.
* `getPlantDetails(plantId)` – Retrieves details about a specific plant.
* `getUpcomingCareTasks()` – Retrieves upcoming and overdue care tasks.
* `getCareHistory(plantId)` – Retrieves previous care activities.
* `createCarePlan()` – Generates a personalized care plan.
* `createVacationPlan(days)` – Creates a care plan for a specified vacation period.
* `updateCareTask(taskId, status)` – Updates a care task after user confirmation.

**Responsibilities:**

* Provide controlled access to application data
* Execute actions requested by the AI agent
* Validate tool inputs
* Prevent unauthorized data access
* Require user confirmation before important data modifications

This layer acts as a controlled bridge between the AI agent and the application's data.

---

#### 5. Data Layer

**Technology:** Cloud Firestore

This layer stores the persistent application data.

**Main data entities:**

* Users
* Plants
* Care Tasks
* Care Records
* AI Interaction Logs

**Responsibilities:**

* Store plant information
* Store watering and care schedules
* Store care history
* Store AI interaction metrics
* Retrieve data required by the application and AI agent
* Maintain persistent user data

Firestore security rules ensure that users cannot access another user's private data.

---

#### 6. Deployment / Infrastructure Layer

**Technology:** Firebase Hosting

This layer provides the infrastructure required to make PlantCare AI available online.

**Responsibilities:**

* Host the production React application
* Serve the application over HTTPS
* Provide a publicly accessible application URL
* Support production deployment of the Vite build
* Connect the deployed frontend with Firebase services

The application is built using Vite and the generated `dist` directory is deployed through Firebase Hosting.

---

#### 7. Monitoring Layer

This layer provides visibility into application and AI activity.

**Responsibilities:**

* Display total users
* Track total plants and care tasks
* Track completed tasks
* Track AI requests
* Track successful and failed AI interactions
* Display recent AI activity
* Show basic application health indicators

The monitoring dashboard provides an overview of system activity for demonstration and operational visibility.

---

### Layer Interaction

The major interaction flow is:

**User → Presentation Layer → Authentication / Agent Layer → Agent Tools → Data Layer**

For an AI request:

**User → AI Assistant → Gemini AI Agent → Agent Tool → Firestore → Agent → User**

For a data modification:

**User → AI Agent → Proposed Action → User Confirmation → Agent Tool → Firestore**

For deployment:

**Source Code → Vite Build → Firebase Hosting → Production Web Application**

This layered architecture separates user interface, authentication, AI reasoning, application logic, data storage, deployment, and monitoring responsibilities, making PlantCare AI easier to maintain, secure, test, and deploy.



### 1.3 Architecture Components

- **User** – Interacts with the PlantCare AI application.
- **React + TypeScript Frontend** – Provides plant management, care planning, AI assistant, and monitoring interfaces.
- **Firebase Authentication** – Handles user registration, login, logout, and secure sessions.
- **Cloud Firestore** – Stores plant information, care tasks, care history, and AI interaction data.
- **Gemini AI Agent** – Understands user requests and generates personalized plant-care recommendations.
- **Firebase Hosting** – Hosts the deployed web application.
- **Monitoring Dashboard** – Displays application and AI usage metrics.

  

  
