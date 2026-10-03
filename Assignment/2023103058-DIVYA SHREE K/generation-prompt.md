# QuizMate AI - Reconstructed Generation Prompt

This file is a reconstruction of the prompt used to generate the app, based on the features, architecture, and implementation patterns present in the project.

---

## Prompt

Build a polished, production-ready AI-powered learning and quiz application called QuizMate AI using React, TypeScript, and Vite.

The app should feel modern, premium, and highly usable, with a clean dashboard-driven interface and a strong educational product aesthetic. Use a visually appealing design with soft gradients, glassmorphism-style cards, a bold hero section, and vibrant colored badges and stat panels. Make the experience feel like a real SaaS product, not a basic template.

### Core product concept
Create an intelligent study companion that helps students prepare for exams by:
- generating custom quizzes from multiple subjects
- supporting MCQ, True/False, and Mixed question types
- tracking quiz performance over time
- identifying weak topics and recommending what to revise
- creating personalized study plans based on exam date and learning gaps
- offering a conversational AI-style learning assistant for natural-language requests
- storing the user session and results locally in browser storage

### Key user flows
1. Landing page with a premium educational brand and clear call-to-action
2. Authentication flow where a user enters their name and email and logs in
3. Dashboard showing:
   - total quizzes completed
   - average score
   - overall accuracy
   - number of weak topics
   - recent quizzes
   - personalized recommendations
4. Quiz generation page with:
   - subject selection
   - topic input or optional filtering
   - difficulty selection
   - number of questions
   - question type selection
5. Quiz taking experience with questions, multiple choice answers, explanations, and score calculation
6. Results page summarizing performance and showing metrics by quiz
7. Progress/history page with performance chart and learning trends across sessions
8. Study planner page where user enters an exam date and receives a day-by-day schedule
9. Profile page where user account information is displayed
10. AI assistant page where user enters natural-language prompts like:
   - "Quiz me on Newton's laws"
   - "Create a study plan for 2 weeks"
   - "What should I revise?"
   - "Analyze my performance"

### Functional requirements
- Support the following subjects: Mathematics, Physics, Chemistry, Computer Science, and General Knowledge
- Each subject should have topic-based question banks
- Generate quiz questions dynamically based on subject, topic, difficulty, and count
- Difficulty levels: Easy, Medium, Hard
- Allow quiz generation with 5, 10, 15, or 20 questions
- Show explanations for each question after completion
- Calculate percentage, total score, and accuracy correctly
- Persist user, quiz results, and study plans using localStorage
- AI assistant should parse user intent and decide whether to:
  - create a quiz
  - analyze performance
  - recommend weak topics
  - generate a study plan
  - explain quiz concepts
  - respond generally

### Study planner requirements
- User can provide an exam date, selected subjects, weak topics, and daily study hours
- App should generate a study schedule with date-based daily sessions
- Include review days, mock test days, and final review casing logic where relevant
- Study plan should be saved and viewable in the planner/history flow

### UI and UX requirements
- Build a high-quality educational app with intuitive page navigation
- Use a left sidebar or top navigation structure for section switching
- Include modern card layouts, descriptive headers, and polish in all screens
- Use icons from lucide-react
- Keep the app fully interactive and self-contained without needing external UI frameworks beyond standard React ecosystem tools
- Ensure the app works without external backends; local browser state is acceptable for this MVP

### Technical constraints
- Use React + TypeScript with a Vite project structure
- Prefer clean component structure using reusable page and shared UI patterns
- Use path aliases like @/ instead of long relative imports
- Keep state centralized with context providers where appropriate
- Use localStorage for persistence
- Keep the code modular and easy to extend
- Avoid unnecessary packages beyond the default project stack and lucide-react

### Content and domain behavior
The app should feel educational and exam-focused. Questions should be academically relevant and cover knowledge areas that students commonly study.

The AI functionality does not need real LLM integration; it should behave as a rule-based smart assistant that understands common prompts and generates quiz configurations, recommendations, and study plans from the app's internal data.

### Deliverables
Produce a complete frontend application with:
- landing page
- auth page
- dashboard
- quiz generation screen
- quiz taking screen
- results screen
- progress analytics screen
- history screen
- study planner screen
- profile screen
- AI assistant interaction workflow

The result should be a complete, polished, student-focused learning product that feels production-ready and visually premium.

---

## Short version

Create a premium React + TypeScript learning app called QuizMate AI with a modern dashboard, AI quiz generation, performance tracking, recommendation engine, personalized study plan generation, and local persistence. It should support multiple subjects, difficulty levels, generated quizzes, explanations, analytics, and a natural-language assistant that can create quizzes and study plans. Use a polished educational SaaS design, lucide-react icons, clean context-based state management, and localStorage storage.
