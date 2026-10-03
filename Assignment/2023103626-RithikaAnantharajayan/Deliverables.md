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


 ## 1.4 Trust Boundaries

- **User → Application:** Users access the application through authenticated sessions.
- **Application → Firebase:** Only authenticated users can access their own plant and care data.
- **Application → Gemini AI:** User queries are sent to the AI service for generating plant-care responses.
- **AI → Database:** AI actions are validated and require user confirmation before modifying stored data.
- **Database:** Firestore security rules prevent users from accessing other users' data.

## Integrations

- **Firebase Authentication** – Handles user signup, login, and authentication.
- **Cloud Firestore** – Stores plants, care tasks, care history, and AI interaction data.
- **Gemini AI** – Provides AI-powered plant-care recommendations and agentic assistance.
- **Firebase Hosting** – Hosts and serves the deployed PlantCare AI web application.

  ------------------------------------------------------------------------------------------------------------------------------------------------

  ## 2.1 Agent Workflow Design

  ![PlantCare AI Agent Workflow Design](./PlantCare AI – Agent Workflow Design.png)

  ### 2.2 Roles

- **User:** Provides plant-care requests and confirms important actions.
- **AI Agent:** Understands requests, analyzes plant data, selects tools, and generates recommendations.
- **Agent Tools:** Retrieve plant data, care tasks, history, and create or update care plans.
- **Firebase:** Stores and manages user-specific plant and care data.

  ### 2.3 States

1. **Request Received** – User submits a request.
2. **Intent Understanding** – AI identifies what the user needs.
3. **Data Retrieval** – Relevant plant and care data is retrieved.
4. **Analysis** – AI analyzes the information.
5. **Action Decision** – Agent decides whether a tool/action is required.
6. **User Confirmation** – Required before modifying stored data.
7. **Action Execution** – Approved changes are made.
8. **Response** – Final recommendation or result is shown to the user.

   ### 2.4 Tools

- `getUserPlants()` – Retrieves the user's plants.
- `getPlantDetails()` – Retrieves details of a selected plant.
- `getUpcomingCareTasks()` – Retrieves upcoming and overdue tasks.
- `getCareHistory()` – Retrieves previous care activities.
- `createCarePlan()` – Creates a personalized care plan.
- `createVacationPlan()` – Creates a care plan for a specified vacation period.
- `updateCareTask()` – Updates a care task after confirmation.

  ### 2.5 Handoffs

  The AI Agent routes requests to the appropriate tool based on user intent.

- Plant information request → Plant Data Tool
- Care schedule request → Care Task Tool
- History request → Care History Tool
- Care plan request → Care Plan Tool
- Vacation request → Vacation Planning Tool
- Data modification request → Approval → Update Tool

  ### 2.6 Approvals

  The agent requires user confirmation before modifying stored data.

  Example:

  User: "Update my Money Plant's watering schedule."

  Agent: "I can update the watering schedule. Would you like me to proceed?"

- **Confirm** → Execute the update.
- **Cancel** → Do not modify the data.

  ### 2.7 Failure Paths

- **AI Failure:** Show an error message and allow the user to retry.
- **Database Failure:** Inform the user that the data could not be retrieved or updated.
- **Invalid Request:** Ask the user to provide more information.
- **Tool Failure:** Return a safe response without exposing internal errors.
- **Unauthorized Access:** Block access to data belonging to other users.
- **Cancelled Approval:** Stop the requested modification and keep the existing data unchanged.

  -----------------------------------------------------------------------------------------------------------------------------------------------

## 3.1 Deployment Strategy

### 3.2 Runtime

- React + Vite frontend runs as a production web application.
- Firebase Hosting serves the built application.
- Firebase Authentication handles user authentication.
- Cloud Firestore provides persistent data storage.
- Gemini AI provides AI-powered plant-care assistance.

### 3.3 Scaling

- Firebase Hosting automatically handles web traffic.
- Cloud Firestore can scale as the number of users and plants increases.
- AI requests are processed through the Gemini API based on user demand.

### 3.4 Resilience

- Firebase provides managed hosting and database services.
- Application errors are handled with user-friendly error messages.
- Failed AI or database requests can be retried.
- User data is persisted in Firestore to prevent loss during page refreshes.

### 3.5 Environments

- **Development:** Local development and testing using Vite.
- **Production:** Deployed application hosted on Firebase.
- Environment variables are used for configuration and API secrets.

### 3.6 Release

1. Test the application locally.
2. Run the production build using `npm run build`.
3. Verify the generated `dist` folder.
4. Deploy using Firebase CLI.
5. Verify the live application after deployment.


-------------------------------------------------------------------------------------------------------------------------------------------------

## 4.1 Security Model

### 4.2 Identity

- Firebase Authentication is used for user registration and login.
- Each authenticated user is assigned a unique user ID.
- Protected application features require authentication.

### 4.3 Authorization

- Firestore Security Rules control access to stored data.
- Users can access and modify only their own plants, care tasks, and care records.
- Unauthorized requests to other users' data are blocked.

### 4.4 Secrets

- API keys and sensitive configuration are stored in environment variables.
- Secrets are never hard-coded in the source code.
- `.env` files containing real credentials are excluded from GitHub.

### 4.5 Privacy

- User plant and care data is isolated by user ID.
- Only the information required to provide the requested service is accessed.
- The AI assistant should not access another user's private data.

### 4.6 Guardrails

- AI tool inputs are validated before execution.
- The agent does not silently modify important user data.
- User confirmation is required before data-changing actions.
- The AI uses cautious language for uncertain plant-care recommendations.
- Internal errors, credentials, and system details are not exposed to users.

### 4.7 Audit

- Important AI interactions can be recorded with request type, timestamp, and success/failure status.
- Care activities are stored as care records.
- Database changes are associated with the authenticated user.
- Monitoring metrics provide visibility into AI and application activity.

  ------------------------------------------------------------------------------------------------------------------------------------------------

  ## 5 Monitoring Dashboard Design

### 5.1 Health

Monitor the overall health of the application and its main services.

- Authentication status
- Firestore/database status
- AI service status
- Application availability
- Failed requests and errors

### 5.2 Trace

Track important application and AI activities.

- AI request type
- Request timestamp
- Tool/function used
- Request success or failure
- Response duration
- Recent care activities

### 5.3 Quality

Measure the quality and reliability of the AI assistant.

- Successful AI responses
- Failed AI requests
- Response time
- Care-plan generation success
- User feedback where available

### 5.4 Safety

Monitor security and AI safety controls.

- Unauthorized access attempts
- Failed authentication
- Blocked requests
- Data modification confirmations
- AI tool failures
- Sensitive information protection

### 5.5 Cost

Track resource usage to help control operational costs.

- Number of AI requests
- AI API usage
- Database operations
- Hosting usage
- Estimated AI service cost where available

### 5.6 Business Outcomes

Track whether the application is helping users manage their plants effectively.

- Total registered users
- Total plants managed
- Care tasks created
- Care tasks completed
- Plants requiring attention
- AI care plans generated
- Vacation plans generated

The monitoring dashboard provides a centralized view of application health, AI activity, safety, resource usage, and user outcomes.

  
