# Room Organization Assistant — Application Workflow

## Overview

The application supports two Gemini-assisted flows: generating a cleanup plan from a room description and answering a user's question about the current plan. Task status changes are handled in the browser and saved as part of the cleanup plan in LocalStorage.

## Workflow Diagram

```mermaid
flowchart TD
    Start([Open application]) --> Restore["Load room description and plan<br/>from LocalStorage"]
    Restore --> Dashboard["Show dashboard"]

    Dashboard --> Describe["User opens Describe My Room"]
    Describe --> Validate{"Description non-empty?"}
    Validate -- No --> ValidationError["Show input validation message"]
    ValidationError --> Describe
    Validate -- Yes --> RequestPlan["Send room description to Gemini"]
    RequestPlan --> PlanOK{"Usable Gemini response?"}
    PlanOK -- No --> PlanError["Show generation error"]
    PlanError --> Describe
    PlanOK -- Yes --> SavePlan["Set plan and description in app state<br/>and LocalStorage"]
    SavePlan --> PlanView["Show cleanup plan"]

    PlanView --> UpdateTask["User updates task status"]
    UpdateTask --> Recalculate["Recalculate completion and remaining work"]
    Recalculate --> SaveProgress["Save updated plan to LocalStorage"]
    SaveProgress --> PlanView

    PlanView --> Ask["User asks a question"]
    Ask --> SendQuestion["Send question, room description,<br/>and current plan to Gemini"]
    SendQuestion --> AnswerOK{"Gemini response received?"}
    AnswerOK -- Yes --> ShowAnswer["Append assistant reply to in-memory chat"]
    AnswerOK -- No --> ChatError["Append assistant error message"]
    ShowAnswer --> PlanView
    ChatError --> PlanView

    Dashboard --> NewCleanup["User selects Start New Cleanup"]
    PlanView --> NewCleanup
    NewCleanup --> Confirm{"User confirms?"}
    Confirm -- No --> KeepCurrent([Keep current cleanup and view])
    Confirm -- Yes --> Clear["Clear saved plan and description;<br/>reset app state"]
    Clear --> Dashboard
```

## Workflow Details

1. At startup, the app loads the saved room description and cleanup plan from browser LocalStorage.
2. The user enters a room description. Blank descriptions are rejected by the input form.
3. The app calls Gemini through `src/services/aiService.ts`. The service requests a JSON cleanup plan and normalizes returned task fields.
4. On success, the app saves the description and generated plan, then displays the cleanup plan. If generation fails, the app displays an error and the user can retry.
5. Task actions update status values (`NOT_STARTED`, `IN_PROGRESS`, or `COMPLETED`). The app calculates progress from completed tasks and saves the changed plan.
6. When the user submits a question, the app sends it with the room description and current plan to Gemini. The assistant response or a recoverable error is added to the chat in memory.
7. Starting a new cleanup requires browser confirmation. Confirmation clears the plan and description and resets the view; cancellation leaves the saved cleanup intact.

## Scope Note

This is a direct request/response interaction with Gemini. It is not an autonomous agent loop and does not include a separate automatic re-planning workflow. The user can edit the room description and request a new generated plan through the existing form.
