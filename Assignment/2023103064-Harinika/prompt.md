\# AI IT Helpdesk - Application Generation Prompt



\## Role



You are an enterprise solution architect and full-stack AI application developer.



\## Objective



Design and implement an AI-powered IT Helpdesk and Support System using an agentic AI architecture.



The system should allow employees to submit IT support issues and automatically analyse, classify, troubleshoot, resolve, or escalate those issues using multiple specialized AI agents.



\## Application Requirements



Build a full-stack web application with:



\- React frontend

\- Node.js and Express backend

\- Modular agent architecture

\- REST APIs

\- Responsive dashboard

\- Ticket management

\- AI-assisted issue classification

\- AI-assisted knowledge retrieval

\- AI-assisted resolution recommendation

\- Escalation to an IT administrator when the system cannot confidently resolve an issue



\## Agent Architecture



Implement the following agents:



\### 1. Triage Agent



Responsibilities:



\- Analyse the employee's support request.

\- Identify the issue category.

\- Determine ticket priority.

\- Assign an initial confidence score.

\- Categories may include:

&#x20; - Network

&#x20; - Hardware

&#x20; - Software

&#x20; - Account

&#x20; - Security

&#x20; - General IT



\### 2. Knowledge Agent



Responsibilities:



\- Analyse the classified issue.

\- Search the available IT knowledge base.

\- Identify relevant troubleshooting guidance.

\- Return the most relevant knowledge article.



\### 3. Resolution Agent



Responsibilities:



\- Combine the triage result and knowledge retrieved.

\- Generate a recommended troubleshooting procedure.

\- Estimate resolution confidence.

\- Resolve the issue automatically when confidence is sufficient.

\- Escalate the issue to an IT administrator when confidence is low.



\## Workflow



The application should implement the following workflow:



Employee

→ Support Ticket

→ Triage Agent

→ Knowledge Agent

→ Resolution Agent

→ Resolution / Escalation

→ IT Administrator



\## Employee Features



The employee should be able to:



1\. Enter their name.

2\. Enter an IT issue title.

3\. Describe the problem.

4\. Submit the support ticket.

5\. View the AI classification.

6\. View ticket priority.

7\. View AI confidence.

8\. View the relevant knowledge article.

9\. View the recommended resolution.



\## Administrator Features



Provide an IT administrator dashboard showing:



\- Total tickets

\- Open tickets

\- Resolved tickets

\- Escalated tickets

\- High-priority tickets

\- Average AI confidence

\- Recent support tickets

\- Ticket category

\- Ticket priority

\- Ticket status

\- AI resolution confidence



The administrator should also be able to update an unresolved ticket to Resolved.



\## Security Requirements



The architecture should consider:



\- Authentication

\- Role-based access control

\- Employee and administrator roles

\- Secure API communication

\- Input validation

\- Protection of sensitive information

\- Secure storage of credentials

\- Environment variables for secrets

\- Audit logging

\- Least-privilege access



\## Deployment Requirements



The application should be designed so that it can be deployed using:



\- Frontend container

\- Backend container

\- Database

\- Reverse proxy/API gateway

\- Cloud hosting

\- HTTPS

\- Environment-specific configuration



\## Monitoring Requirements



The monitoring design should track:



\- API health

\- Request latency

\- Error rate

\- Ticket volume

\- Agent execution time

\- Agent failure rate

\- AI confidence

\- Escalation rate

\- Resolution rate

\- System resource usage



\## Expected Output



Generate:



1\. A scalable system architecture.

2\. An agent workflow design.

3\. A deployment strategy.

4\. A security model.

5\. A monitoring dashboard design.

6\. A functional full-stack prototype.

7\. Clear documentation explaining the architecture and implementation.



\## Quality Requirements



The solution should be:



\- Modular

\- Maintainable

\- Scalable

\- Secure

\- Observable

\- Easy to demonstrate

\- Suitable for enterprise IT support scenarios



The final application should provide a clear demonstration of how multiple specialized agents collaborate to automate IT support while allowing human escalation when required.

