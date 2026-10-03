# Agent Workflow Design

The AI Interview Preparation Portal uses six logical agents to support interview preparation, performance analysis, and personalized learning recommendations.

| Agent                          | Input                            | Main Work                            | Output                                        |
| ------------------------------ | -------------------------------- | ------------------------------------ | --------------------------------------------- |
| **Assessment Agent**           | User's level/topic               | Generates questions                  | Aptitude/reasoning/verbal/technical questions |
| **Interview Simulation Agent** | User profile + preparation level | Conducts mock interview              | Interview questions + conversation            |
| **Feedback Agent**             | User's answers                   | Evaluates answers                    | Mistakes + improvement suggestions            |
| **Performance Analysis Agent** | Test/interview results           | Calculates and analyzes performance  | Score, strengths, weaknesses                  |
| **Recommendation Agent**       | Weak areas + goals               | Creates personalized recommendations | Study plan, resources, practice topics        |
| **Progress Monitoring Agent**  | Historical activity              | Tracks preparation                   | Progress reports, completion status           |


## Workflow

1. User logs into the system.
2. User selects Aptitude Practice, Technical MCQ Test, or Mock Interview.
3. Assessment Agent or Interview Simulation Agent presents questions.
4. User submits answers.
5. Feedback Agent analyzes responses and provides suggestions.
6. Performance Analysis Agent evaluates scores and performance metrics.
7. Recommendation Agent generates personalized study recommendations.
8. Progress Monitoring Agent updates user progress and dashboard statistics.
9. Dashboard displays analytics, reports, and preparation status.

## Key Design Principles

- Separate responsibilities among agents.
- Store user progress and performance securely.
- Provide explainable AI-generated feedback.
- Support continuous learning and improvement.
- Allow users to track preparation history and performance trends.
- Ensure recommendations are educational guidance and not guaranteed outcomes.