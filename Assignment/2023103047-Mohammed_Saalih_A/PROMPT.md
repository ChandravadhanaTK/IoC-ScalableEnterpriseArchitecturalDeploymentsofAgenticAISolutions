# Stonks Fish — Lovable Build Prompt

Build a production-ready web app called **“Stonks Fish — Chess Tutor”**.

## CORE IDEA

This is an **Agentic AI chess tutor**, NOT a chess engine.

The goal is to make the user significantly better at chess by having an AI chess coach:

- Analyze the user's pasted PGN games.
- Explain the user's moves in simple human language.
- Identify mistakes, inaccuracies, missed opportunities, and recurring weaknesses.
- Teach openings and defenses chosen by the user.
- Ask the user questions and make them think instead of simply giving answers.
- Adapt lessons based on the user's mistakes and chosen learning goals.

**DO NOT use Stockfish or any chess engine.**

The intelligence should come from the AI agent reasoning about the chess position and the game context.

The application must be designed specifically for **deployment on Vercel** and should work as a normal GitHub → Vercel deployment.

---

## TECH STACK

Use:

- Next.js
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- chess.js ONLY for chessboard representation, PGN parsing, move validation, FEN generation, and legal move handling.
- Vercel AI SDK / server-side AI API calls for the tutor agent.
- An LLM API through environment variables.

Do NOT create a separate Python backend.

All AI API calls must happen server-side through Next.js API routes/server actions.

Never expose the AI API key to the browser.

---

## MAIN USER EXPERIENCE

The application should have 4 major sections:

1. **Game Analyzer**
2. **Opening Coach**
3. **Defense Coach**
4. **AI Chess Tutor**

Use a clean dark chess-themed interface.

App name:

**STONKS FISH**

Subtitle:

**Your AI Chess Coach**

---

## 1. GAME ANALYZER

Allow the user to paste a complete PGN.

Example:

[PGN TEXTAREA]

[Analyze Game]

After submitting:

### Parse the PGN

Use chess.js to:

- Parse the PGN.
- Extract moves.
- Reconstruct every position.
- Generate FEN after every move.
- Display the game on an interactive chessboard.

Do not use Stockfish.

### GAME ANALYSIS UI

Use a two-column layout.

LEFT:

Interactive chessboard.

RIGHT:

AI Tutor panel.

Below the board:

Move list:

1. e4 e5
2. Nf3 Nc6
3. Bb5 a6
...

Allow the user to click any move.

When a move is selected:

- Show the corresponding board position.
- Send the relevant position and move context to the AI tutor.
- Ask the AI to explain what happened.

The AI should explain:

### MOVE EXPLANATION

**Your move:** Nf3

**What you were trying to do:**
Explain the likely chess idea.

**What was good:**
Explain the positive aspects.

**What could be improved:**
Explain the strategic/tactical issue.

**What you should have considered:**
Give the user a thinking process rather than simply saying "play X".

**Chess lesson:**
Explain the general principle.

Avoid engine-like statements such as:

"Stockfish evaluation: +1.7"

Never mention engine evaluation.

---

## BLUNDER DETECTION

The AI should identify potential:

- Blunders
- Tactical mistakes
- Missed captures
- Hanging pieces
- Weak squares
- Poor development
- King safety problems
- Pawn structure mistakes
- Bad exchanges
- Premature attacks
- Passive play
- Opening mistakes
- Endgame mistakes

However, do not pretend the AI has an exact engine evaluation.

Use language such as:

"Your move appears to create a tactical problem because..."

instead of:

"This move is objectively -2.3."

---

## HUMAN-LIKE COACHING

The agent should behave like a strong chess coach.

Instead of immediately giving the answer:

User:
"Why was this move bad?"

Agent:

"Before I tell you, look at your opponent's last move. What changed about the position?"

Then allow the user to answer.

The agent should teach the user to:

1. Identify threats.
2. Look for forcing moves.
3. Check captures.
4. Check checks.
5. Look for opponent threats.
6. Evaluate king safety.
7. Compare candidate moves.
8. Think about positional consequences.

The goal is **learning**, not merely producing answers.

---

## 2. OPENING COACH

Create an Opening Coach page.

Allow the user to select:

- Opening
- Side
- Difficulty
- Learning mode

Examples:

- Italian Game
- Spanish / Ruy Lopez
- Sicilian Defense
- French Defense
- Caro-Kann
- Queen's Gambit
- King's Indian Defense
- Nimzo-Indian
- English Opening
- London System
- Scandinavian Defense
- Pirc Defense

The user can choose:

"I want to learn the Sicilian Defense as Black."

The AI agent creates a structured lesson.

### OPENING LESSON

Teach:

#### 1. Opening idea

Explain WHY the opening exists.

#### 2. Typical development

Explain normal piece placement.

#### 3. Strategic plans

Explain:

- Pawn breaks
- Piece placement
- King safety
- Good/bad exchanges
- Typical attacks
- Typical weaknesses

#### 4. Common traps

Explain common tactical patterns.

#### 5. Typical middlegames

Explain what positions the opening tries to reach.

#### 6. Interactive quiz

Ask questions such as:

"Your opponent has just played d4. What is your first priority?"

Give multiple choices.

Then explain the answer.

---

## 3. DEFENSE COACH

Create a Defense Coach.

The user can choose a defense they want to learn.

Example:

"I want to learn how to defend against the King's Indian Attack."

The agent teaches:

- Typical attacking plans
- Defensive setup
- What threats to watch for
- Which pieces should be exchanged
- Dangerous pawn breaks
- King safety
- Defensive resources
- Common mistakes

Then generate interactive positions/questions.

Example:

"You are defending this position. Your opponent is preparing Qh5. What should you consider?"

The user answers.

The AI evaluates the reasoning and explains the position.

---

## 4. AI CHESS TUTOR

Create a persistent conversational tutor.

The user can ask questions such as:

- "Why do I keep losing after castling?"
- "Teach me how to attack a king."
- "I always lose against the Sicilian."
- "Explain positional chess."
- "What should I look for before every move?"
- "Teach me pawn structures."
- "Give me a tactical exercise."
- "Quiz me on the Italian Game."

The AI should remember the context of the current session.

---

## AGENT BEHAVIOR

Implement the AI as a **Chess Coach Agent**.

The agent should have these responsibilities:

### GAME ANALYSIS AGENT

Input:

- PGN
- Move number
- Current FEN
- Previous move
- Next move
- Player color
- Game metadata

Output:

- Move explanation
- Tactical/positional observations
- Coaching question
- General lesson
- Suggested improvement

### OPENING COACH AGENT

Input:

- Opening
- Side
- Skill level

Output:

- Opening lesson
- Strategic plans
- Typical positions
- Questions
- Exercises

### DEFENSE COACH AGENT

Input:

- Defense selected
- Opponent's opening/attack
- Skill level

Output:

- Threat identification
- Defensive plans
- Defensive exercises
- Questions

### TUTOR AGENT

Maintain conversation context and adapt explanations to the user's questions.

---

## IMPORTANT AGENT RULE

The AI must NOT simply dump chess theory.

It should teach through:

**Observe → Think → Answer → Explain → Practice → Repeat**

Whenever appropriate, ask the learner to think before revealing the answer.

Example:

AI:

"Look at the position. Your opponent's queen and bishop are pointing toward your king. What is the first defensive question you should ask?"

User answers.

AI:

"Correct. Now identify the square that is most vulnerable."

This makes the application feel like an actual tutor rather than ChatGPT inside a webpage.

---

## LEARNING PROFILE

Create a simple learner profile stored locally initially.

Track:

- Games analyzed
- Opening studied
- Defense studied
- Common mistakes
- Tactical weaknesses
- Positional weaknesses
- Current learning level
- Recent lessons

Example:

**Your Chess Profile**

Games analyzed: 12

Common weaknesses:
- Missing opponent threats
- Weak king safety
- Premature attacks

Strong areas:
- Opening development
- Tactical patterns

Recommended lesson:

**"Train: Opponent Threat Recognition"**

This can initially use localStorage rather than requiring a database.

Keep the architecture easy to upgrade later.

---

## DASHBOARD

Create a dashboard with:

**STONKS FISH**

"Your AI Chess Coach"

Cards:

[Analyze a Game]

[Learn an Opening]

[Master a Defense]

[Ask Your Chess Coach]

Then:

### Your Progress

Games analyzed: X

Lessons completed: X

Current focus: X

Weaknesses detected:

- X
- X
- X

Recommended next lesson:

[Start Lesson]

---

## UI DESIGN

Make the UI modern and premium.

Theme:

- Dark background
- Chess-board inspired styling
- Clean typography
- Minimal animations
- Green accent for positive feedback
- Red/orange accent for mistakes
- White/gray text

Do NOT make it look like a generic AI chatbot.

The chessboard should be visually prominent.

Responsive design:

- Desktop
- Tablet
- Mobile

On mobile:

Chessboard appears above the tutor panel.

---

## API ARCHITECTURE

Create server-side endpoints such as:

/api/analyze-game

/api/chess-tutor

/api/opening-coach

/api/defense-coach

The browser sends the relevant chess context to the server.

The server calls the LLM.

Never expose API keys.

Use environment variables:

AI_API_KEY

Do not hardcode secrets.

---

## CHESS POSITION CONTEXT

When asking the AI about a move, provide structured context such as:

FEN:
...

Previous move:
...

Current move:
...

Next move:
...

Player:
White/Black

Move number:
...

The AI should reason from the provided position rather than inventing board state.

---

## ERROR HANDLING

Handle:

- Invalid PGN
- Empty PGN
- Malformed PGN
- Unsupported notation
- AI API failure
- Rate limits
- Empty AI responses

Show friendly errors.

Example:

"That PGN could not be parsed. Please check that the game notation is complete."

---

## DEMO MODE

Include a sample PGN so the user can immediately try the application.

Button:

**Try Sample Game**

Populate the analyzer with a famous/standard chess game PGN.

---

## IMPORTANT CONSTRAINTS

DO NOT:

- Use Stockfish.
- Use any chess engine.
- Create a Python backend.
- Create a separate Node/Express server.
- Require a VPS.
- Require Docker.
- Require WebSockets.
- Put API keys in frontend code.
- Pretend the AI has engine-level numerical evaluation.
- Build unnecessary authentication initially.
- Add unnecessary database infrastructure.

The entire application should be deployable through:

GitHub → Vercel

---

## VERCEL REQUIREMENT

Make sure the project works with standard Vercel deployment.

The final project should be able to:

1. Run locally with npm install.
2. Run with npm run dev.
3. Build with npm run build.
4. Deploy directly from GitHub to Vercel.
5. Use Vercel environment variables for the AI API key.

Provide a clear README containing:

- Installation
- Environment variables
- Local development
- GitHub deployment
- Vercel deployment
- How to configure the AI API key

---

## FINAL PRODUCT GOAL

The application should feel like:

**"A personal chess coach that watches how I think, finds my weaknesses, explains my games, teaches openings and defenses, and makes me solve chess positions myself."**

It should NOT feel like:

"ChatGPT + chessboard."

Prioritize the actual coaching experience and interactive learning loop over unnecessary features.

Build the complete working application with clean reusable components and a maintainable project structure.
