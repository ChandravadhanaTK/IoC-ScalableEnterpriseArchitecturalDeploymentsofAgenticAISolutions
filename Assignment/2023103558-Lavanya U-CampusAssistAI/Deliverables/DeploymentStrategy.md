# Deployment Strategy — CampusAssist AI

## 1. Deployment Model

CampusAssist AI is deployed as a web application using Lovable's hosted deployment environment.

Live application:

https://campus-support-ai.lovable.app/

## 2. Environments

### Development
Application changes are created and tested in the Lovable project environment.

### Production
The published Lovable application is available through the public deployment URL.

## 3. Release Flow

```text
Develop / Modify
       |
       v
Build
       |
       v
Test Core Workflow
       |
       v
Publish
       |
       v
Production URL
```

## 4. Pre-Deployment Checks

- Application builds successfully.
- Main page loads.
- Issue input works.
- Triage Agent executes.
- Action Agent executes.
- Final recommendation is displayed.
- Error/retry states are available.
- No frontend API secrets are exposed.

## 5. Resilience

The application provides:
- Loading states
- Error states
- Retry actions
- Failed-agent status
- No automatic irreversible actions

## 6. Scalability Considerations

For a larger production deployment, the system can be extended with:
- Persistent database storage
- Authentication
- Rate limiting
- Centralized logging
- Dedicated AI service
- Monitoring and alerting
- Separate staging environment

These are future enterprise extensions and are not required for the current lightweight implementation.
