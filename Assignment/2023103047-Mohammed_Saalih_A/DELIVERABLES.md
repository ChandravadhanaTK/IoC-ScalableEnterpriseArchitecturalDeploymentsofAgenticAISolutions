# Stonks Fish — Deliverables

## Product
**Stonks Fish — AI Chess Tutor**

Live application:
https://stonks-fish-chess-tutor.lovable.app/

The app is an agentic AI chess tutor designed to help users improve by:
- Analyzing pasted PGN games.
- Explaining chess moves in human language.
- Teaching openings selected by the user.
- Teaching defensive systems and defensive thinking.
- Asking questions before revealing answers when appropriate.
- Identifying recurring chess weaknesses.
- Providing interactive lessons and exercises.

## Core Deliverables

### 1. Game Analyzer
- PGN input.
- PGN validation and parsing.
- Interactive chessboard.
- Move-by-move navigation.
- AI explanation of moves.
- Tactical and positional observations.
- Coaching questions.
- General chess lessons extracted from the game.

### 2. Opening Coach
- Opening selection.
- Explanation of opening ideas.
- Development plans.
- Strategic plans and pawn breaks.
- Typical middlegame ideas.
- Common mistakes and traps.
- Interactive quizzes.

### 3. Defense Coach
- Defense selection.
- Typical opponent attacking plans.
- Defensive principles.
- Threat recognition.
- Defensive exercises.
- Interactive questions.

### 4. AI Chess Tutor
- Conversational chess coaching.
- Questions about games, openings, tactics, strategy, and weaknesses.
- Session-aware explanations.
- Socratic teaching where appropriate.

### 5. Learning Profile
Track learning information such as:
- Games analyzed.
- Lessons completed.
- Current learning focus.
- Recurring weaknesses.
- Recommended lessons.

Initial implementation can use local browser storage.

### 6. Vercel Deployment
The application should be deployable through:
**GitHub → Vercel**

Requirements:
- Next.js/React/TypeScript.
- Server-side AI calls.
- Environment variables for secrets.
- No exposed API keys.
- No separate Python backend.
- No VPS or Docker requirement.

## Important Product Constraint

**Do not use Stockfish or another chess engine as the teaching engine.**

The application should focus on AI-based explanation, reasoning, questioning, and coaching rather than numerical engine evaluations.

## Live App

The current application is available at:

https://stonks-fish-chess-tutor.lovable.app/

The live page describes the product as an AI chess coach whose game analyzer walks through games using chess ideas rather than engine numbers.
