# SkillBridge AI — Database Schema & Data Modeling

SkillBridge AI uses Prisma ORM with PostgreSQL. The schema supports all 15 core entities, foreign key constraints, cascade deletes, indices, and a `pgvector` column for semantic embeddings.

---

## Entity Relationship Summary

```text
User (1) ── (0..1) Profile (1) ── (0..*) PortfolioProject
User (1) ── (0..*) Project (1) ── (0..*) Application
User (1) ── (0..*) Post (1) ── (0..*) Comment / Like / Moderation
Skill (1) ── (0..*) UserSkill / ProjectSkill
```

---

## Table Schemas

### 1. `User`
- `id`: UUID Primary Key
- `email`: String (Unique)
- `username`: String (Unique)
- `name`: String
- `role`: Enum (`FREELANCER`, `CLIENT`, `ADMIN`)
- `suspended`: Boolean (Default false)
- `createdAt`: DateTime

### 2. `Profile`
- `id`: UUID Primary Key
- `userId`: Foreign Key → `User.id` (Unique, Cascade)
- `headline`: String (Optional)
- `bio`: String (Optional)
- `avatarUrl`: String (Optional)
- `experienceLevel`: String (Optional)
- `hourlyRate`: Int (Optional)
- `availability`: String (Optional)
- `links`: Json (Optional)
- `embedding`: Unsupported("vector(1536)") (Optional pgvector)

### 3. `Project`
- `id`: UUID Primary Key
- `clientId`: Foreign Key → `User.id` (Cascade)
- `title`: String
- `description`: String
- `budgetMin`: Int
- `budgetMax`: Int
- `deadline`: DateTime
- `experienceLevel`: String
- `status`: String (Default "OPEN")
- `createdAt`: DateTime

### 4. `Application`
- `id`: UUID Primary Key
- `projectId`: Foreign Key → `Project.id` (Cascade)
- `freelancerId`: Foreign Key → `User.id` (Cascade)
- `proposal`: String
- `proposedPrice`: Int
- `expectedDays`: Int
- `status`: Enum (`SUBMITTED`, `VIEWED`, `SHORTLISTED`, `ACCEPTED`, `REJECTED`)
- `createdAt`: DateTime

### 5. `Post`
- `id`: UUID Primary Key
- `authorId`: Foreign Key → `User.id` (Cascade)
- `type`: Enum (`QUESTION`, `ADVICE`, `SHOWCASE`, `COLLABORATION`, `DISCUSSION`)
- `category`: String
- `body`: String
- `status`: Enum (`PUBLISHED`, `PENDING_REVIEW`, `REMOVED`)
- `createdAt`: DateTime

### 6. Auxiliary Entities
- `Comment`: Post comments
- `Like`: Composite primary key `[postId, userId]`
- `Notification`: User notifications with `read` state
- `AiModerationResult`: 1-to-1 moderation outcome for posts
- `AiRecommendation`: Cached project match recommendations
- `AiGeneratedProposal`: Saved proposal generation drafts
