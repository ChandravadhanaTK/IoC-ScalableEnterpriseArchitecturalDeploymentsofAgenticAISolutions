# Monitoring Dashboard Design

## Existing View

The authenticated Dashboard provides users with preparation statistics, assessment results, interview performance metrics, progress tracking, and personalized recommendations.

## Signals

Track user activity, assessment completion rates, mock interview sessions, average scores, subject-wise performance, recommendation usage, login activity, AI feedback generation, and progress updates.

Monitor:

- Aptitude test completion and scores
- Technical assessment performance
- Mock interview participation
- AI feedback requests and responses
- Study recommendation usage
- Dashboard access frequency
- Authentication and session errors
- Application and AI service failures

UX and Privacy

Display key metrics such as:

- Total tests completed
- Average score
- Recent performance trends
- Subject-wise strengths and weaknesses
- Interview readiness status
- Last activity timestamp

Do not expose user answers, authentication credentials, session tokens, personal information, or internal AI prompts in monitoring logs.

Separate student-facing analytics from administrator-only operational logs and system diagnostics.

Alerts and Monitoring

Generate alerts for:

- Repeated assessment submission failures
- Authentication errors
- AI feedback service interruptions
- Data synchronization failures
- Unusual application error rates
- Extended service downtime

Monitoring thresholds should be adjusted according to user activity and system usage patterns. The dashboard focuses on application health, user engagement, and learning progress visibility.