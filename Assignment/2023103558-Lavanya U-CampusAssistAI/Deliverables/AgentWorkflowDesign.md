# Agent Workflow Design — CampusAssist AI

## 1. Workflow

```text
Student Issue
     |
     v
Triage Agent
     |
     v
Action Agent
     |
     v
AI Recommendation
```

## 2. Triage Agent

### Role
Analyze the student's campus issue.

### Inputs
- Issue description

### Outputs
- Category
- Priority
- Reasoning
- Confidence

### Categories
- Academic
- Hostel
- Technical
- Transport
- Administration
- Other

### Priority
- Low
- Medium
- High
- Critical

## 3. Action Agent

### Role
Use the triage result to recommend the next operational action.

### Inputs
- Original issue
- Category
- Priority
- Triage reasoning

### Outputs
- Recommended department
- Recommended action
- Escalation status

## 4. Workflow States

- Pending
- Processing
- Completed
- Failed

## 5. Failure Handling

If an agent fails:
1. Display the failed step.
2. Preserve the error state.
3. Allow the user to retry.
4. Do not show a false successful recommendation.

## 6. Human/Student Review

The final result is explicitly labelled **AI Recommendation**. Important matters should be verified with the appropriate campus department.

## 7. Example

Input:

> My hostel Wi-Fi has not been working since yesterday.

Possible output:

- Category: Technical
- Priority: Medium
- Department: Campus IT Services / Network Support
- Escalation: Not needed
- Confidence: High

The exact output may vary with the AI analysis.
