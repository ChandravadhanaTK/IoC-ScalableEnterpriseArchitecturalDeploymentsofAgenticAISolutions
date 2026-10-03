\# TaskSphere – Application Build Prompt



\## Project Overview



Build a full-stack enterprise task management application called \*\*TaskSphere\*\*.



TaskSphere is a secure and scalable web application that allows users to create and manage their tasks, while administrators can manage users and tasks across the system. The application should provide authentication, role-based authorization, task management, search, filtering, pagination, dashboard statistics, and API documentation.



The application should follow a modular and scalable architecture with a separate frontend, backend, and relational database.



\## Objectives



The application should:



\* Provide secure user registration and login.

\* Authenticate users using JWT.

\* Implement role-based access control.

\* Allow normal users to manage their own tasks.

\* Allow administrators to manage tasks and users across the system.

\* Provide a dashboard showing task statistics.

\* Support task searching, filtering, and pagination.

\* Provide secure REST APIs.

\* Provide interactive API documentation using Swagger.

\* Use a relational PostgreSQL database.

\* Use an ORM for database operations.

\* Support containerized database deployment using Docker.

\* Provide a responsive and user-friendly interface.



\## User Roles



\### USER



A normal user should be able to:



\* Register an account.

\* Log in securely.

\* View their own tasks.

\* Create tasks.

\* Update their own tasks.

\* Delete their own tasks.

\* Search and filter their tasks.

\* View task statistics.



\### ADMIN



An administrator should be able to:



\* Log in securely.

\* View all users.

\* View all tasks.

\* Manage tasks across users.

\* Access tasks belonging to different users.

\* View overall task information.



\## Authentication and Security



Implement:



\* User registration.

\* User login.

\* JWT-based authentication.

\* Password hashing using bcrypt.

\* Protected API routes.

\* Authentication middleware.

\* Role-based authorization middleware.

\* Current-user endpoint.

\* Secure validation of request data.

\* Appropriate HTTP status codes and error responses.



Passwords must never be stored as plain text.



\## Task Management



Each task should contain information such as:



\* Unique task ID.

\* Task title.

\* Task description.

\* Task status.

\* User/owner ID.

\* Creation timestamp.

\* Last updated timestamp.



Supported task statuses:



\* PENDING

\* IN\_PROGRESS

\* COMPLETED



Users should be able to:



\* Create tasks.

\* View tasks.

\* View a specific task.

\* Update tasks.

\* Delete tasks.



\## Dashboard



Create a dashboard containing:



\* Total number of tasks.

\* Number of pending tasks.

\* Number of tasks in progress.

\* Number of completed tasks.

\* Task search.

\* Status filtering.

\* Pagination.

\* Responsive task table.

\* Loading states.

\* Empty states.



The interface should support both light and dark themes.



\## Search, Filtering and Pagination



The backend should support:



\* Search by task information.

\* Filtering by task status.

\* Pagination using page and limit parameters.



Example:



`GET /api/v1/tasks?page=1\&limit=10`



Status filtering should support values such as:



`PENDING`



`IN\_PROGRESS`



`COMPLETED`



\## REST API



Create RESTful API endpoints for authentication and task management.



\### Authentication



\* `POST /api/v1/auth/register`

\* `POST /api/v1/auth/login`

\* `GET /api/v1/auth/me`



\### Tasks



\* `POST /api/v1/tasks`

\* `GET /api/v1/tasks`

\* `GET /api/v1/tasks/:id`

\* `PUT /api/v1/tasks/:id`

\* `DELETE /api/v1/tasks/:id`



All protected endpoints should verify the user's JWT before processing the request.



\## Frontend Requirements



Build a responsive frontend using:



\* Next.js

\* React

\* JavaScript

\* Tailwind CSS

\* Axios

\* React Hook Form

\* Context API



Provide pages/components for:



\* Landing page.

\* Registration.

\* Login.

\* Dashboard.

\* Task creation.

\* Task editing.

\* Task listing.

\* Navigation.

\* Authentication state.

\* Error handling.

\* Loading states.



The frontend should communicate with the backend through REST APIs.



\## Backend Requirements



Build the backend using:



\* Node.js.

\* Express.js.

\* PostgreSQL.

\* Prisma ORM.

\* JWT.

\* bcrypt.

\* Zod validation.

\* Swagger.



Organize the backend into logical modules such as:



\* Configuration.

\* Controllers.

\* Middleware.

\* Routes.

\* Services.

\* Validators.

\* Utilities.



Keep business logic separate from route handling to make the application easier to maintain and scale.



\## Database



Use PostgreSQL as the relational database.



Create at least the following entities:



\### User



\* id

\* name

\* email

\* password

\* role

\* createdAt



\### Task



\* id

\* title

\* description

\* status

\* userId

\* createdAt

\* updatedAt



A user can have multiple tasks.



Use Prisma migrations and Prisma Client for database access.



\## API Documentation



Provide Swagger/OpenAPI documentation for the REST APIs.



The documentation should allow developers to understand and test the available endpoints.



The API documentation should include:



\* Authentication endpoints.

\* Task endpoints.

\* Request parameters.

\* Request bodies.

\* Response formats.

\* Authentication requirements.



\## Docker



Use Docker to simplify database setup.



Provide a Docker Compose configuration for PostgreSQL.



The application should be structured so that additional services can be containerized later.



\## Scalability Requirements



Design the application so that it can be extended for larger workloads.



Consider:



\* Stateless JWT-based authentication.

\* Database connection pooling.

\* Pagination for large datasets.

\* Efficient database queries.

\* Modular backend services.

\* Separation of frontend and backend.

\* Horizontal backend scaling.

\* Load balancing.

\* Redis caching as a future enhancement.

\* Read replicas for database scaling.

\* Microservice decomposition for future large-scale deployments.

\* Message queues for asynchronous processing.



These scalability mechanisms should be documented as architectural considerations rather than implemented unless explicitly required.



\## Error Handling



Implement consistent error handling for:



\* Invalid credentials.

\* Unauthorized requests.

\* Forbidden operations.

\* Invalid input.

\* Missing resources.

\* Database errors.

\* Server errors.



Return meaningful HTTP status codes and messages.



\## Project Structure



Use a structure similar to:



```text

TaskSphere/

├── backend/

│   ├── prisma/

│   ├── src/

│   │   ├── config/

│   │   ├── controllers/

│   │   ├── middleware/

│   │   ├── routes/

│   │   ├── services/

│   │   ├── validators/

│   │   ├── utils/

│   │   ├── app.js

│   │   └── server.js

│   └── package.json

│

├── frontend/

│   ├── app/

│   ├── components/

│   ├── context/

│   ├── lib/

│   ├── services/

│   └── package.json

│

├── docker-compose.yml

└── README.md

```



\## Expected Result



The final application should provide a complete enterprise-style task management platform with:



\* Secure authentication.

\* Role-based access control.

\* Task management.

\* Dashboard.

\* REST APIs.

\* PostgreSQL database.

\* Prisma ORM.

\* Search.

\* Filtering.

\* Pagination.

\* Swagger API documentation.

\* Docker support.

\* Responsive UI.

\* Modular and scalable architecture.



The application should be maintainable, secure, modular, and designed so that additional enterprise features can be added in the future.



