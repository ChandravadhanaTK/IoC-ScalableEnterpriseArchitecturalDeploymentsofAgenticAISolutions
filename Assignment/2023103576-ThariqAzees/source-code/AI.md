# SkillBridge AI — AI Systems Architecture

SkillBridge AI integrates five modular AI services to enhance the freelancing experience across profiles, matching, proposals, community safety, and career guidance.

---

## 1. Profile Enhancer (`/api/ai/enhance-profile`)

- **Inputs**: Current headline, bio, skills list, experience level, portfolio work.
- **Model**: `gpt-4o-mini` with JSON output format.
- **Output**: Improved headline, improved bio, recommended skills, actionable career suggestions.
- **Safety**: Changes are presented in an interactive Review Modal (`AIProfileEnhancerModal`). The user must explicitly accept modifications before updating their profile.

---

## 2. Project Compatibility Matcher (`/api/ai/match`)

- **Inputs**: Freelancer skills, experience level, portfolio technologies vs Project required skills, experience level, title.
- **Algorithm**:
  $$\text{Coverage} = \frac{|\text{Direct Skills}| + 0.6 \times |\text{Portfolio Skills}|}{|\text{Required Skills}|}$$
  $$\text{Level Fit} = \max(0, 1 - |\text{Level Gap}| \times 0.4)$$
  $$\text{Score} = \min(97, \text{Math.round}((\text{Coverage} \times 0.85 + \text{Level Fit} \times 0.15) \times 100))$$
- **Output**: Numerical match percentage (e.g., 94%) and exact match reasons (*✓ Next.js matches your skills*, *✓ Similar portfolio work*).

---

## 3. Proposal Generator (`/api/ai/generate-proposal`)

- **Inputs**: Project title, project description, required skills, freelancer name, skills, experience level, portfolio projects.
- **Output**: Client-focused cover letter.
- **User Flow**: Displayed inside `AIProposalModal`. Freelancers can edit proposal text, set proposed price ($ USD), and set expected timeline before submission.

---

## 4. Community Moderation Engine (`/api/ai/moderate-post`)

- **Inputs**: Post body text, category.
- **Pipeline**:
  1. Automated regex heuristics scan for suspicious links and spam phrases.
  2. OpenAI moderation endpoint classifies content into `SAFE`, `REVIEW`, or `BLOCK`.
- **Enforcement**:
  - `SAFE` → Post status `PUBLISHED` (visible immediately).
  - `REVIEW` → Post status `PENDING_REVIEW` (sent to `/admin` review queue).
  - `BLOCK` → Rejected.

---

## 5. Freelancing Assistant (`/api/ai/assistant`)

- **Inputs**: Multi-turn conversation messages array.
- **Output**: Structured advice covering pricing strategies, portfolio building, client communication, and upskilling.
