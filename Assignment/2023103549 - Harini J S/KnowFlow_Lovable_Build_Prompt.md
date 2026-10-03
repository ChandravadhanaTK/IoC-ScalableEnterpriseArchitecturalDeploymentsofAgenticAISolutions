# Build Prompt: KnowFlow — AI Personal Knowledge Intelligence Platform

Build a complete, production-quality **KnowFlow** web application: an AI-powered personal knowledge management and research assistant that lets a user collect documents and notes, organize them into collections, have AI index and understand them, ask grounded questions with citations, compare documents, explore a knowledge graph, receive AI insights, and study from their own material.

KnowFlow is **not** "upload PDF → chat with PDF". It is a **Personal Knowledge Intelligence Platform** where the relationship **Documents → Chunks → Concepts → Collections → Knowledge Graph → AI Assistant** is visible throughout the product.

Alongside the application, you must also generate **five architecture deliverables** (Section 34) as Markdown files in the repo under `/docs`, plus an in-app **Monitoring Dashboard** (Section 35) and an in-app **Architecture & Docs** viewer. These are mandatory parts of the build, not optional extras.

Do not leave important features as static placeholder screens. Every button, tab, filter, and link must work.

---

## 1. Product Overview

**What it is:** A personal knowledge workspace combining a document library, notes, collections, semantic search, RAG-based Q&A with citations, summarization, comparison, a knowledge graph, AI insights, and study tools.

**Problem solved:** People accumulate PDFs, notes, papers, and guides across tools, cannot find or connect them, and generic chatbots answer without knowing or citing the user's own material.

**Users:** Students, researchers, software engineers, and lifelong learners who maintain a personal corpus of technical and academic material.

**What makes it different from a generic chatbot:**
- Answers are grounded in the user's own chunks and always cite document + section.
- The user controls the AI's scope: entire knowledge base, a collection, selected documents, the current document, or a single note.
- Knowledge is structured (chunks, concepts, relations), so the AI can connect, compare, and discover, not only answer.
- Every answer exposes its retrieval trace (which chunks, what scores) so users can trust it.

**Core workflow (show this as a visual stepper on the dashboard hero/onboarding card):**

```text
Collect → Organize → Process → Index → Search → Ask AI → Understand → Connect → Discover
```

**Demo story the build must support end to end:**

```text
Dashboard → open "Distributed Systems" collection → open "Raft Consensus" document
→ ask "What is the role of the leader in Raft?" → grounded answer with citations
→ click citation → reader opens at the cited section with the passage highlighted
→ ask "How is this different from Paxos?" → compare Raft vs Paxos
→ open Knowledge Graph → discover related concepts → open Monitoring to see the trace of that very query
```

---

## 2. Technology Stack

- React 18, TypeScript, Vite, Tailwind CSS 3, shadcn/ui, React Router 6, TanStack Query, React Hook Form + Zod, Lucide icons, Sonner toasts.
- Recharts for all charts.
- Knowledge graph: `react-force-graph-2d` or `d3-force` with SVG/canvas, supporting zoom, pan, drag, and selection.
- Markdown rendering: `react-markdown` + `remark-gfm`. Diagrams in docs viewer: `mermaid`.
- Backend: **Lovable Cloud (Supabase)** for Auth, Postgres, Storage, Row Level Security, and Edge Functions. Enable `pgvector` and structure chunk embeddings for it.
- AI: a provider-agnostic AI layer (Section 27). If a real LLM key/gateway is configured as a server-side secret, edge functions call it. Otherwise the **deterministic mock AI provider** runs on seeded data. The app must be fully demonstrable with zero external keys.
- Vitest + React Testing Library for tests.

Project structure (enforce separation of UI from logic):

```text
src/
  components/        UI components (no business logic)
  pages/             route-level pages
  features/          documents, notes, collections, assistant, search, graph, compare, insights, study, monitoring, docs
  services/
    ai/              AIProvider interface, MockAIProvider, EdgeFunctionAIProvider, provider factory
    rag/             queryUnderstanding, retriever, contextAssembler, generator, citationVerifier, pipeline
    ingestion/       extractor, chunker, embedder, indexer, processingPipeline
    telemetry/       trackEvent, trackAgentRun, metrics selectors
  data/seed/         seeded documents, concepts, relations, notes, conversations, telemetry
  hooks/ lib/ types/
docs/                five deliverables + README (Section 34)
supabase/            migrations, edge functions
```

---

## 3. Global Design System

Premium, modern, professional SaaS identity: AI/productivity focused, readable for long-form content, polished but restrained.

- **Dark-first with a full light theme.** Theme toggle persists. Use CSS variables/semantic tokens only; no hardcoded colors in components.
- **Dark palette:** background deep navy-ink (`#0B1020`), surface `#121933`, elevated surface `#18213F`, border `rgba(148,163,255,0.14)`, text primary `#E8ECFF`, text secondary `#9AA4C7`.
- **Accents:** primary indigo/blue (`#4F7CFF`), secondary violet (`#8B6CFF`), plus semantic status colors: success green, warning amber, danger red, info cyan. Use a distinct accent per category (Research, Academics, Programming, DevOps, AI/ML, Projects, Personal) consistently across tags, charts, and graph nodes.
- **Typography:** Inter for UI; a readable serif or Inter at comfortable measure (65–75ch, 1.7 line height) for document reading; JetBrains Mono for code and chunk IDs.
- **Components:** rounded-xl cards, 1px subtle borders, restrained shadows, subtle hover lift, 150–250ms ease-out transitions, skeleton loaders, Lucide icons only.
- **Avoid:** neon, gaming aesthetics, heavy gradients, clutter, and generic ChatGPT styling. Use at most one subtle gradient (hero/onboarding card).
- Status badges: Processing (amber, animated), Ready (green), Failed (red), Queued (gray).
- Citation chips: small pill with a document icon, `Title · §Section` text, hover preview card with excerpt.
- Keyboard accessible, visible focus rings, WCAG AA contrast.

---

## 4. Authentication & User Management

- Pages: `/login`, `/signup`, `/forgot-password`, `/reset-password`. Email + password via Supabase Auth; optional Google OAuth button.
- Logout in the user menu. All app routes live under an authenticated layout; unauthenticated users redirect to `/login` and return to the intended route after login.
- A `profiles` row is auto-created by a DB trigger on signup.
- **Roles:** `user` and `admin`, stored in a separate `user_roles` table (never on `profiles`) with a `has_role(uid, role)` security-definer function. Admin unlocks the Monitoring Dashboard's system-wide views and the Audit Log. Regular users see monitoring scoped to their own data.
- **Seeded demo accounts** (create via seed script/migration, documented on the login page as "Try the demo"):
  - `demo@knowflow.app` / `Demo@12345` (user, fully seeded workspace)
  - `admin@knowflow.app` / `Admin@12345` (admin)
- A "Use demo account" button on the login page fills credentials.
- Each user can only access their own knowledge (RLS, Section 25/28).

---

## 5. Application Navigation

Persistent desktop sidebar (collapsible to icon-only, state persisted), top header with global search trigger (`Ctrl/Cmd+K`), notification bell with unread badge, theme toggle, and user menu. Active item has a left accent bar and filled icon.

| Group | Item | Route | Icon |
|---|---|---|---|
| Overview | Dashboard | `/app` | LayoutDashboard |
| Overview | Recent Activity | `/app/activity` | Activity |
| Knowledge | All Documents | `/app/documents` | Library |
| Knowledge | Notes | `/app/notes` | StickyNote |
| Knowledge | Collections | `/app/collections` | FolderKanban |
| Knowledge | Favorites | `/app/favorites` | Star |
| Knowledge | Recently Viewed | `/app/recent` | Clock |
| Intelligence | AI Assistant | `/app/assistant` | Sparkles |
| Intelligence | Semantic Search | `/app/search` | Search |
| Intelligence | Knowledge Graph | `/app/graph` | Network |
| Intelligence | Compare Documents | `/app/compare` | GitCompare |
| Intelligence | Insights | `/app/insights` | Lightbulb |
| Study | Study Mode | `/app/study` | GraduationCap |
| Study | Flashcards | `/app/study/flashcards` | Layers |
| Study | Questions | `/app/study/questions` | HelpCircle |
| System | Monitoring | `/app/monitoring` | Gauge |
| System | Architecture & Docs | `/app/docs` | BookOpenText |
| System | Notifications | `/app/notifications` | Bell |
| System | Settings | `/app/settings` | Settings |

Other routes: `/app/documents/:id` (reader), `/app/collections/:id`, `/app/notes/:id`, `/app/assistant/:conversationId`, `/app/graph?concept=:id`, `/app/compare?docs=a,b`.

**Mobile:** bottom tab bar with 5 items (Dashboard, Library, Assistant, Search, More). "More" opens a sheet with the remaining items. Sidebar becomes a drawer on tablet.

Include a branded 404 page and a "document not found" state.

---

## 6. Dashboard

Hero/onboarding card with the Collect → … → Discover stepper and quick actions (Upload, New Note, Ask AI).

**KPI cards (each clickable, navigating to its module):** Total Documents, Total Notes, Collections, Knowledge Concepts, AI Conversations. Each shows a delta vs last 30 days.

Sections:
- **Knowledge Growth:** Recharts line chart of documents and notes over the last 12 weeks.
- **Knowledge Distribution:** donut chart by category (Research, Academics, Programming, DevOps, AI/ML, Projects, Personal); clicking a slice filters the library.
- **Recent Activity:** uploaded document, created note, asked AI, created collection, compared documents; each links to its object.
- **AI Insights:** 3–4 generated observation cards (frequently discussed concepts, overlapping topics, growing areas, related documents) linking to `/app/insights`.
- **Continue Reading** strip and **Suggested Next Reads**.

---

## 7. Knowledge Library (`/app/documents`)

Grid/list toggle. Each document shows: title, description, file type icon, author/source, upload date, collection, tags, processing status, favorite star, last accessed, page count.

- Search box, filters (type, category, collection, tag, status, favorites), sort (recent, title, last accessed, pages), multi-select with bulk actions.
- Row/card actions: **Open, Summarize, Ask AI, Compare, Add to Collection, Favorite, Rename, Delete** (with confirm dialog).
- "Ask AI" opens the Assistant pre-scoped to that document. "Compare" adds it to a compare selection tray.
- Tag editor with autocomplete; auto-tag suggestions from concepts.

---

## 8. Document Upload & Processing

Drag-and-drop upload dialog (also reachable from command palette and dashboard). Accept **PDF, DOCX, TXT, Markdown**; validate type and size (max 20 MB) with clear errors. Metadata form: title, author/source, category, collection, tags.

Show a visual processing pipeline per document with live progress:

```text
Uploading → Reading Document → Extracting Text → Chunking → Generating Embeddings → Indexing → Ready
```

- Each step shows status icon, duration, and logs (e.g., "Created 42 chunks, avg 380 tokens").
- With real files: store in Supabase Storage, run extraction (TXT/MD fully; PDF/DOCX via an edge function or client library), chunk by section/heading with overlap, and persist chunks. Embeddings are generated through the AI provider's `embed()` method (mock = deterministic hashed bag-of-concepts vector).
- Simulate at least one failure path: a file named `corrupt*.pdf` ends in **Failed** with a reason, a "Retry" button, and a notification.
- Processing runs as an agent workflow (Section 33) and emits telemetry (Section 35). On completion create a notification and activity log entry; if "automatic summaries/tagging" are enabled, generate them.

---

## 9. Document Reader (`/app/documents/:id`)

Three-panel desktop layout (resizable):
- **Left:** table of contents / section tree with scroll-spy and bookmarks list.
- **Center:** document content rendered by section with stable section anchors (`#sec-<id>`), comfortable reading typography, find-in-document, text highlighting in multiple colors (persisted), bookmarking.
- **Right "Intelligence" panel with tabs:** *Summary*, *Ask AI* (scoped to this document), *Notes*, *Concepts* (extracted concepts, clickable to graph), *Metadata*.

Text selection toolbar: **Ask AI about selection, Summarize selection, Highlight, Add note, Copy**.

**Citation navigation:** when arriving with `?section=<id>&chunk=<id>` (from a citation click), scroll to the section, expand it, and highlight the cited passage with a pulsing outline that fades after 4 seconds. Show a "Back to conversation" button.

Mobile: single-column reader with bottom sheet for TOC and a full-screen AI sheet.

---

## 10. Collections

Collections list with cards (name, description, doc count, cover color/icon). Create, rename, delete, add/remove documents, reorder documents via drag handles.

Collection detail page: description, document count, recent activity, **topic distribution chart**, **common concepts** chips, **AI-generated collection summary** (with regenerate), documents list, and an "Ask AI about this collection" button that opens the Assistant scoped to it.

Seeded: Distributed Systems, AI Engineering, DevOps, Programming, Research Papers, College Notes.

---

## 11. Notes

Notes list + editor (Markdown with live preview, toolbar, autosave with "Saved" indicator). Features: create/edit/delete, tags, **link to documents** and **link to concepts** (via `[[` autocomplete), backlinks panel, "Ask AI about this note", "Find related knowledge" (shows related chunks/documents/concepts with scores). A note can be selected as the AI scope.

---

## 12. AI Assistant (`/app/assistant`)

The central feature. Layout: conversation list (left, collapsible), chat (center), **Retrieval/Sources panel** (right, toggleable).

**Context selector (prominent, above input):** Entire Knowledge Base · Current Collection · Selected Documents · Current Document · Current Note. Selecting a scope opens a picker where relevant. The active scope shows as a persistent chip and is saved with the conversation. When launched from a reader, collection, or note, scope is prefilled.

**Suggested prompts** (context-aware): "Summarize this document." · "Explain this concept." · "Compare these documents." · "What are the common themes?" · "What are the contradictions?" · "Find related knowledge." · "Create study questions." · "What should I read next?"

**Answer rendering:**
- Streaming-style token reveal (simulated in mock mode).
- Markdown with inline numbered citation markers `[1]`, `[2]`, and a **Sources** footer of citation chips.
- Under each answer an expandable **"How I answered"** trace: query interpretation, scope used, retrieved chunks with scores, and the final context size.
- Message actions: copy, regenerate, save as note, thumbs up/down (feeds Monitoring quality metrics), follow-up suggestions.
- If retrieval confidence is below threshold, the assistant says it could not find support in the selected scope, suggests widening scope, and does **not** invent citations.

---

## 13. RAG / Retrieval Workflow

Implement as separate, testable services (no logic in components):

```text
User Question
→ Query Understanding   (intent: qa | summarize | compare | explain | related | study | next-read; entity/concept extraction; scope resolution)
→ Knowledge Retrieval   (hybrid: keyword/BM25-style + semantic vector similarity, restricted to scope)
→ Re-ranking            (score fusion, concept boost, de-duplication, diversity across documents)
→ Context Assembly      (top-k chunks within token budget, ordered by document and section)
→ AI Generation         (provider.generate with grounding instructions)
→ Citation Verification (each claim marker must map to an assembled chunk; drop or flag unsupported claims)
→ Grounded Answer + Citations + Trace
```

- `retrieve(query, scope, mode, k)` returns chunks with `{chunkId, documentId, section, page, text, keywordScore, semanticScore, finalScore}`.
- With Supabase: a SQL function `match_chunks(query_embedding, scope_filter, k)` using pgvector cosine similarity, called from an edge function `rag-query`. In mock mode, run the same pipeline over seeded chunks in memory using deterministic vectors.
- Every pipeline stage records latency and results to the trace used by the UI and Monitoring.

---

## 14. Citation System

Every grounded answer has citations containing: **document title, section (and page where applicable), excerpt, chunk ID**. No fake URLs.

- Inline `[n]` markers are hoverable (preview card with excerpt) and clickable.
- Clicking opens `/app/documents/:id?section=...&chunk=...` with the passage highlighted (Section 9).
- Citations are stored in the `citations` table linked to the message so history reopens with working citations.
- If a cited document was deleted, show "Source no longer available" gracefully.

---

## 15. Semantic Search (`/app/search`)

Mode toggle: **Keyword · Semantic · Hybrid** (default Hybrid). Scope filters: documents, notes, concepts, collections; category and tag filters.

Each result shows: title, matching passage with highlighted terms, **relevance score bar**, category, tags, and a **"Why this matched"** reason (e.g., "Semantically related: 'leader election' ↔ 'choosing a coordinator'; shares concepts: Consensus, Quorum"). Include a one-click "Show keyword-only results" comparison so the value of semantic retrieval is visible (e.g., query "how do nodes agree on a value" finds Raft/Paxos even without those exact words). Seed synonym/concept maps to make this work deterministically.

---

## 16. Knowledge Graph (`/app/graph`)

Interactive graph of documents, concepts, technologies, algorithms, topics, and notes. Node color by type, size by degree. Edge types: **discusses, related to, references, contrasts with, belongs to, depends on** (distinct styles + legend).

Features: zoom, pan, drag, search/focus node, filter by node type/collection/relation type, select node → side panel.

Concept side panel: **definition, related concepts, source documents (clickable), AI explanation** (generated via the AI layer with citations), and "Ask AI about this concept". Document node → open reader. Support `?concept=` deep links and loading/empty states.

---

## 17. Document Comparison (`/app/compare`)

Select 2–4 documents (picker with search). Generate a structured comparison:
common themes, differences, methodologies, concepts, results, limitations, conflicting claims, unique information. Render as a side-by-side matrix with expandable rows, each cell carrying citations. Include an **"AI explains the major differences"** narrative and an "Ask follow-up" button that opens the Assistant with both documents as scope. Seed strong comparisons for Raft vs Paxos, Docker vs Kubernetes, CAP vs Eventual Consistency.

---

## 18. AI Summaries

Every document has four tabs: **TL;DR, Short Summary, Detailed Summary, Technical Summary**. For research-style documents add a structured card: **Problem, Methodology, Dataset, Results, Limitations, Future Work**. Summaries cite sections. Support selected-section summarization from the reader. Cache summaries, show "generated at", and a Regenerate action with loading state. Mock mode returns deterministic seeded summaries.

---

## 19. Knowledge Insights (`/app/insights`)

Cards grouped by type: **Related Knowledge, Repeated Concepts, Knowledge Gaps, Contradictions, Emerging Interests, Suggested Reading**. Each insight has a title, explanation, confidence, supporting sources (clickable), and actions: Dismiss, Save as note, Ask AI. "Refresh insights" runs the Insight Agent with visible progress. New insights create notifications.

---

## 20. Study Mode (`/app/study`)

Pick a document or collection → generate **flashcards, MCQs, short-answer, and conceptual questions** with difficulty (Easy/Medium/Hard) and count.

- Flashcard view (flip, "Got it / Review again"); quiz view with scoring and explanations that cite sources.
- Session results: score, time, progress over time chart, **weak topics** (by concept), and **review recommendations** linking to the relevant sections.
- Persist sessions, questions, and flashcards. Spaced-repetition-style "due for review" list. Study reminder notification.

---

## 21. Conversation History

Conversation list with title (auto-generated from first question, renameable), date, scope/context, message count, last activity. Reopen, rename, delete (confirm), search within conversations, and group by Today/This week/Earlier.

---

## 22. Global Search & Command Palette

`Ctrl/Cmd+K` opens a modal. Typing searches documents, notes, collections, concepts, and conversations with grouped results and keyboard navigation. With an empty query show quick actions:
**Upload Document, Create Note, Ask AI, Search Knowledge, Create Collection, Open Recent Document, Start Study Session, Open Monitoring**. Support `>` prefix for commands.

---

## 23. Notifications

Bell dropdown + `/app/notifications` page: document processing complete, processing failure, new AI insight, knowledge connection discovered, study reminder, and (admin) system alert. Mark read/unread, mark all read, filter by type, deep links to the relevant object.

---

## 24. Settings

Tabs: **Profile** (name, email, avatar upload), **AI Preferences** (response length, explanation depth, citation display: inline/footer/both, response style, default scope, retrieval top-k advanced option), **Knowledge Preferences** (auto-tagging, auto-summaries, default collection), **Appearance** (theme, layout density), **Data** (export all knowledge as JSON/Markdown zip; delete all knowledge with typed confirmation), **Security** (change password, active sessions).

---

## 25. Database / Data Model

All tables in `public`, with `user_id uuid references auth.users on delete cascade`, `created_at`, `updated_at` unless noted. **RLS enabled on every table in the same migration** with policies restricting access to `auth.uid() = user_id` (child tables check ownership via parent). Add GRANTs explicitly.

| Table | Key fields |
|---|---|
| profiles | id (= auth uid), full_name, email, avatar_url, preferences jsonb |
| user_roles | user_id, role (`user`/`admin`); `has_role()` security-definer function |
| documents | id, title, description, file_type, file_path, author_source, category, page_count, word_count, status (queued/processing/ready/failed), failure_reason, is_favorite, last_accessed_at, summary_cache jsonb, collection_id nullable |
| document_chunks | id, document_id, chunk_index, section_id, section_title, page, content, token_count, embedding `vector(384)`; HNSW/ivfflat index on embedding, GIN index on `to_tsvector(content)` |
| collections | id, name, description, color, icon, summary_cache |
| collection_documents | collection_id, document_id, position (unique pair) |
| notes | id, title, content_md, is_favorite |
| note_links | note_id, target_type (document/concept/note), target_id |
| tags / document_tags / note_tags | tag name unique per user; join tables |
| concepts | id, name, definition, category, aliases text[], embedding |
| concept_mentions | concept_id, chunk_id, document_id, strength |
| knowledge_relations | id, source_type, source_id, target_type, target_id, relation (discusses/related_to/references/contrasts_with/belongs_to/depends_on), weight |
| highlights / bookmarks | document_id, section_id, chunk_id, range, color, note |
| conversations | id, title, scope_type, scope_ids uuid[], message_count, last_activity_at |
| messages | id, conversation_id, role, content, trace jsonb, feedback (up/down/null), latency_ms, token_in, token_out |
| citations | id, message_id, chunk_id, document_id, section_title, page, excerpt, marker_index |
| insights | id, type, title, body, confidence, source_refs jsonb, status (new/dismissed/saved) |
| study_sessions | id, source_type, source_id, difficulty, score, total, duration_s, weak_concepts jsonb |
| study_questions | id, session_id, type, prompt, options jsonb, answer, explanation, chunk_id, user_answer, is_correct |
| flashcards | id, document_id, front, back, ease, due_at |
| activity_log | id, action, object_type, object_id, metadata jsonb |
| notifications | id, type, title, body, link, is_read |
| agent_runs | id, workflow, status, trigger, started_at, finished_at, latency_ms, cost_usd, token_in, token_out, error |
| agent_steps | id, run_id, agent, step, state, input_summary, output_summary, tool, latency_ms, retries, error |
| telemetry_events | id, event_type, metric, value numeric, dimensions jsonb, created_at |
| guardrail_events | id, run_id, check (grounding/pii/prompt_injection/scope), result, details jsonb |
| audit_log | id, actor_id, action, target, details jsonb, created_at (admin-readable) |

Add indexes on `(user_id, created_at)`, foreign keys, and the vector/FTS indexes above. Storage bucket `documents` is private with policies scoped to `user_id/` path prefixes.

---

## 26. Seeded Demo Data

On first login of the demo account (and via a "Reset demo data" button in Settings → Data), populate an interconnected workspace. Each document must contain **real, substantive multi-section text (at least 6–10 sections, 3–6 chunks per section-group)** so search, citations, summaries, comparisons, and the graph all work.

**Distributed Systems:** Introduction to Distributed Systems · **Raft Consensus** (sections: Overview, Terms & Roles, Leader Election, Log Replication, Safety, Membership Changes — include that the leader handles all client requests, replicates log entries via AppendEntries, sends heartbeats, and is elected by majority vote in a term) · **Paxos Made Simple** (proposers/acceptors/learners, prepare/accept phases, comparison points with Raft) · CAP Theorem · Eventual Consistency.

**AI / ML:** Retrieval-Augmented Generation · Transformer Architecture · Vector Databases (embeddings, ANN, HNSW, cosine similarity).

**DevOps:** Docker Fundamentals · Kubernetes Architecture · CI/CD Guide.

**Programming:** Java Concurrency · Python Best Practices.

Also seed: 6 collections, ~40 concepts with definitions/aliases (Consensus, Leader Election, Quorum, Log Replication, Replication, Partition Tolerance, Embedding, Chunking, HNSW, Attention, Container, Pod, Pipeline, Thread Safety, etc.), ~120 relations (including `Raft contrasts_with Paxos`, `RAG depends_on Vector Databases`, `Kubernetes depends_on Container`), 8 notes linked to documents/concepts, 6 conversations with cited answers, 10 insights (include a gap on "Byzantine fault tolerance" and a contradiction about consistency terminology), study sessions, notifications, 30 days of activity, and **30 days of telemetry, agent runs, and guardrail events** for the Monitoring Dashboard. Include one document in `failed` state and one in `processing` state to demonstrate those UIs. Do not use random lorem ipsum.

---

## 27. AI / Mock AI Architecture

```ts
interface AIProvider {
  embed(texts: string[]): Promise<number[][]>;
  generate(req: { task: Task; query: string; context: Chunk[]; prefs: AIPrefs }): AsyncIterable<Token> | Promise<GeneratedAnswer>;
  summarize(docOrChunks, level): Promise<Summary>;
  compare(docs): Promise<Comparison>;
  explainConcept(concept, context): Promise<Explanation>;
  generateInsights(corpusStats): Promise<Insight[]>;
  generateStudyItems(source, opts): Promise<StudyItem[]>;
}
```

- `MockAIProvider`: deterministic, template- and knowledge-driven. Answers are **composed from retrieved chunks and seeded concept definitions**, vary by query, scope, and preferences, and include citation markers. No hardcoded canned responses inside React components. Unknown topics return a graceful "not found in your knowledge" answer.
- `EdgeFunctionAIProvider`: calls Supabase edge functions (`rag-query`, `summarize`, `compare`, `insights`, `study-generate`) which call a real LLM using server-side secrets (e.g., `LLM_API_KEY`). Never call LLMs from the browser.
- A provider factory chooses based on config; a visible badge in Settings and Monitoring shows "Mock AI" vs "Live AI".
- Embeddings: mock = deterministic 384-dim vectors derived from concept/token hashing so semantically related text scores higher; real = provider embedding API stored in pgvector.

---

## 28. Security

- All `/app/*` routes protected; RLS on every table; users cannot read other users' documents, chunks, or conversations.
- No API keys in the client; the Supabase service role key is used only inside edge functions; secrets live in server-side environment.
- Validate all inputs with Zod (client and edge functions); sanitize rendered Markdown (no raw HTML/script).
- Uploaded file validation (type, size, magic bytes where feasible); private storage with signed URLs.
- Prompt-injection defense: retrieved document text is treated as untrusted data, delimited in prompts, and never allowed to alter system instructions; guardrail events are logged.
- Rate limiting on AI edge functions; audit log for admin actions and sensitive events (export, delete-all, role changes).
- Full Security Model is documented in `docs/04-security-model.md` (Section 34).

---

## 29. Responsive Design

- **Desktop:** persistent sidebar, three-panel reader, assistant with sources panel, full-width graph.
- **Tablet:** collapsible drawer navigation, adaptive two-panel layouts.
- **Mobile:** bottom navigation, single-column reader, full-screen assistant, stacked filters in sheets, graph with touch pan/pinch zoom.
- No horizontal overflow at any breakpoint; tables/code/charts scroll inside their own containers.

---

## 30. Loading / Empty / Error States

Provide polished, designed states (skeletons, illustrations via icons, clear CTAs) for: document processing, AI generation (typing/streaming indicator), search loading, graph loading, empty library, empty collections, empty notes, no search results (with suggestions), failed document processing (with Retry), AI unavailable (fallback offer to use Mock/cached), deleted/missing documents, network errors (retry), and empty monitoring data. Add a global error boundary. Never show blank screens.

---

## 31. Testing

Vitest + React Testing Library covering: authentication and route guards, document upload validation, processing pipeline states (success and failure), chunker, retriever (keyword, semantic, hybrid, scope restriction), query understanding, context assembly, citation verifier (rejects unsupported claims), collection management, note management, AI context selection, citation rendering and navigation, document comparison, knowledge graph data builder, study mode scoring, conversation history, global search, telemetry aggregation selectors, and the architecture docs viewer. Add a regression test that the demo query "What is the role of the leader in Raft?" returns a cited answer referencing the Raft Consensus document's Leader Election/Log Replication sections.

Requirements: TypeScript passes, production build passes, all tests pass, all routes load, no console errors.

---

## 32. Deployment

- Configure for **Lovable deployment** with Lovable Cloud (Supabase): auth settings, migrations, storage bucket and policies, RLS, edge functions, and required environment variables (`LLM_API_KEY` optional; the app must run without it in Mock mode).
- Provide `.env.example` (no secrets) and a `docs/03-deployment-strategy.md` describing environments, release flow, scaling, and resilience (Section 34).
- Never expose service-role credentials or database passwords. Protected routes stay gated after publish.

---

## 33. Agent Workflow Design

KnowFlow is built as a set of cooperating, observable agents. Implement them as explicit workflow definitions (a typed registry in `src/services/agents/`) so they run in the app, emit traces, and are documented in `docs/02-agent-workflow-design.md` and visualized in-app.

| Agent | Role | Tools | Triggers |
|---|---|---|---|
| Ingestion Agent | Validate, read, and extract text from uploads | file reader, parser | document upload |
| Chunking & Indexing Agent | Section-aware chunking, embeddings, index write | chunker, embed(), vector store | after ingestion |
| Concept Extraction Agent | Extract concepts, aliases, relations | concept extractor, graph writer | after indexing |
| Query Understanding Agent | Intent, scope, concept detection | classifier | each question |
| Retrieval Agent | Hybrid retrieval and re-ranking | match_chunks, FTS | after understanding |
| Answer Agent | Grounded generation | provider.generate | after context assembly |
| Citation Verifier Agent | Verify every claim marker maps to context | verifier | before returning answer |
| Comparison Agent | Structured multi-doc comparison | retriever, provider.compare | compare request |
| Insight Agent | Related/gap/contradiction/emerging detection | graph stats, provider | schedule or manual refresh |
| Study Agent | Flashcards and questions, weak-topic analysis | provider.generateStudyItems | study request |

For each workflow define: **states** (`queued → running → awaiting_approval? → succeeded | failed | retrying | cancelled`), **handoffs** (which agent passes what payload to which), **retry policy** (e.g., 2 retries with backoff for extraction/embedding), **timeouts**, **human approval points** (e.g., Delete-all-knowledge, bulk delete, applying AI auto-tags in bulk, and "AI suggests merging duplicate concepts"), and **failure paths** (failed extraction → document `failed` + notification + Retry; low retrieval confidence → "not found" answer; verifier failure → regenerate once, then return answer with unsupported claims removed and a visible warning; AI provider down → fallback to Mock/cached and flag in Monitoring).

**In-app visualization:** an `/app/monitoring` tab ("Agent Traces") plus a workflow diagram (state machine/sequence view) showing each run's steps, durations, tool calls, retries, approvals, and failure branches. The Assistant's "How I answered" trace uses the same data.

---

## 34. Required Capstone Deliverables (Generate as Files)

While building the app, **generate the following five documents as Markdown files in `/docs`**, written specifically for the application you actually built (use real route names, table names, services, and components, not generic text). Use Mermaid diagrams where noted. Also create `docs/README.md` indexing them, and offer a "Download .md" button for each in the in-app **Architecture & Docs** viewer (`/app/docs`), which renders them with Markdown + Mermaid, a left-hand doc index, and anchor navigation. If practical, also provide a "Download all as .zip" action. Keep docs in sync with the implemented code.

**1. `docs/01-architecture-diagram.md` — Architecture Diagram**
- Layered architecture (Mermaid `flowchart`): Presentation (React app) → Application/Services (rag, ingestion, ai, telemetry) → AI Layer (AIProvider, Mock, EdgeFunction) → Data Layer (Postgres + pgvector, Storage) → External (LLM/embedding API).
- Component diagram of major frontend features and their service dependencies.
- **Trust boundaries** clearly marked: browser (untrusted), authenticated app session, edge functions (trusted server), database with RLS, external LLM provider; what data crosses each boundary.
- Integration points and data flow sequence diagram for: (a) document ingestion, (b) a RAG question with citation click-through.
- Tech stack table and key design decisions (ADR-style: why hybrid retrieval, why provider abstraction, why RLS).

**2. `docs/02-agent-workflow-design.md` — Agent Workflow Design**
- Agent catalog (roles, tools, inputs/outputs) as in Section 33.
- State machine diagrams (Mermaid `stateDiagram-v2`) for ingestion and RAG query workflows.
- Handoff sequence diagrams, approval gates (who approves what), retry/timeout policy, and a failure-path matrix (failure → detection → fallback → user-visible behavior → telemetry emitted).

**3. `docs/03-deployment-strategy.md` — Deployment Strategy**
- Runtime topology (Lovable-hosted frontend, Lovable Cloud/Supabase, edge functions, storage).
- Environments (local/dev, preview, production), configuration and secrets management, migration and seed process, release/rollback process, feature flags (Mock vs Live AI).
- Scaling and resilience: pgvector index strategy, chunk batching, queueing of long ingestion jobs, caching of summaries/insights, rate limits, backup/restore, graceful degradation when the LLM is unavailable, and a roadmap for scaling to larger corpora.

**4. `docs/04-security-model.md` — Security Model**
- **Identity:** auth flows, sessions, password reset, roles in `user_roles`.
- **Authorization:** RLS policy table per table, storage policies, admin-only surfaces.
- **Secrets:** where each secret lives and who can read it.
- **Privacy:** data ownership, per-user isolation, what is sent to the LLM (only assembled context), export/delete-my-data flows, PII handling.
- **Guardrails:** prompt-injection handling for retrieved content, grounding/citation enforcement, scope enforcement, output sanitization, rate limiting.
- **Audit:** what is logged, retention, who can view.
- Threat model table (STRIDE-style) with mitigations and residual risks.

**5. `docs/05-monitoring-dashboard-design.md` — Monitoring Dashboard Design**
- Purpose and audiences (user vs admin), metric catalog with definitions, formulas, data source tables, and alert thresholds across the six dashboard tabs described in Section 35.
- Wireframe description per tab, drill-down paths, refresh cadence, and how telemetry is emitted from the code (event names and dimensions).
- Alert rules and example runbook entries.

Each doc should include: purpose, scope, diagrams/tables, assumptions, and open risks. Aim for concise but complete (roughly 1.5–4 pages each).

---

## 35. Monitoring Dashboard (`/app/monitoring`)

A real, working dashboard backed by `telemetry_events`, `agent_runs`, `agent_steps`, `guardrail_events`, and `messages` (seeded with 30 days of data and updated live as the user uses the app: every question, upload, search, and study session emits telemetry). Time-range selector (24h / 7d / 30d), auto-refresh toggle, and CSV export. Regular users see only their own data; admins get a **System (all users)** toggle.

Tabs:
1. **Health:** processing success rate, failed documents, p50/p95 latency for retrieval/generation/ingestion (Recharts line + stat cards), error rate, AI provider status (Mock/Live), index size (chunks, vectors), queue depth. Status banner with healthy/degraded/down.
2. **Trace Explorer (Agent Traces):** table of agent runs (workflow, status, duration, cost, trigger) → click opens a run detail with step timeline/waterfall, tool calls, retries, guardrail results, and a link to the originating conversation message.
3. **Retrieval & Answer Quality:** average citations per answer, grounding/citation-verified rate, "not found" rate, retrieval score distribution, top-k hit rate, thumbs-up/down ratio, most cited documents, low-confidence queries list.
4. **Safety & Guardrails:** counts of injection attempts flagged, ungrounded claims removed, scope violations blocked, PII flags; event table with severity badges and filters.
5. **Cost & Usage:** tokens in/out, estimated cost per day, cost per question, calls by task type (QA, summarize, compare, insights, study), cache hit rate, top cost drivers; budget progress bar with alert at 80%.
6. **Business / Outcomes:** active days, documents added, questions asked, study sessions completed, average study score trend, insights acted on (saved vs dismissed), knowledge growth, "time to first useful answer", and retention-style streak.

Add an **Alerts** panel (threshold rules from the monitoring doc, e.g., p95 generation latency > 8s, failure rate > 5%, grounded-answer rate < 85%, budget > 80%) with acknowledge actions that create notifications. Every chart card has a title, metric definition tooltip, loading skeleton, and empty state.

---

## 36. Final User Experience & Acceptance Criteria

On first open of the demo account the evaluator immediately sees a populated workspace, and the full demo story in Section 1 works with connected navigation.

The build is complete only if all of the following are true:

- Responsive UI with dark and light themes using semantic tokens only; no horizontal overflow
- Working authentication, protected routes, demo accounts, admin role
- Functional navigation with no dead links or broken buttons
- Document library, upload with realistic multi-stage processing (including a failure path), reader with TOC, highlights, bookmarks, selection actions
- Collections and notes fully functional (CRUD, links, backlinks, AI scope)
- AI Assistant with working context selector, suggested prompts, streaming-style answers, citations, and "How I answered" trace
- RAG pipeline implemented as separate services with hybrid retrieval and citation verification
- Citation click-through highlights the exact passage in the reader
- Semantic search with keyword/semantic/hybrid modes and match reasons
- Interactive knowledge graph with concept side panel
- Document comparison, AI summaries (4 levels + research structure), insights, study mode with stored sessions, conversation history, global search with command palette, notifications, settings
- Database schema with RLS on every table, pgvector-ready chunks, storage policies, and seed data
- Mock AI provider behind an `AIProvider` interface, swappable for real LLM edge functions
- Agent workflows defined with states, handoffs, approvals, and failure paths, visible in the Trace Explorer
- **Monitoring Dashboard with all six tabs working on seeded + live telemetry**
- **Five `/docs` deliverables generated, accurate to the built app, with Mermaid diagrams, viewable and downloadable in-app at `/app/docs`**
- Loading, empty, and error states everywhere
- Tests pass, TypeScript passes, production build succeeds, no avoidable console errors

---

## Final Instruction to Lovable

Build the entire application as one cohesive product, then generate the five documentation deliverables and the monitoring dashboard based on **what you actually built**. Prioritize, in order: (1) functional end-to-end workflows, (2) source-grounded AI/knowledge interaction, (3) information architecture and polish, (4) realistic interconnected seed data, (5) maintainable service architecture ready for a real LLM/RAG backend, (6) accurate architecture/security/deployment/monitoring documentation, (7) responsive behavior. If something cannot be fully real (e.g., live LLM), implement the deterministic mock behind the same interfaces rather than leaving a placeholder.
