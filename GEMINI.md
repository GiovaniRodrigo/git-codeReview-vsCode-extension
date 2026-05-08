# Project Architecture: Model-Document-Controller (MDC)

This project follows the **Model-Document-Controller (MDC)** architectural pattern to ensure clear separation of concerns, testability, and maintainability.

## Layers

### 1. Model (`*Model.ts`)
- **Location**: Resides within the feature directory (e.g., `src/review/reviewModel.ts`).
- **Role**: Pure data structures (Interfaces) and transformation functions.
- **Constraints**:
    - Must be **immutable**.
    - Must NOT contain business logic that requires external dependencies (Git, VS Code API, etc.).
    - Functions should be **pure** (Input Model -> Output Model).

### 2. Document (`*Document.ts`)
- **Location**: Resides within the feature directory (e.g., `src/review/reviewDocument.ts`).
- **Role**: The "Single Source of Truth" for a specific entity or session.
- **Responsibilities**:
    - Data fetching (via Services).
    - State management (e.g., tracking "reviewed" status).
    - Persistence orchestration.
    - Emitting events (using an event emitter) when the Model changes.
- **Constraints**:
    - Does NOT know about the UI (Webviews, Panels).
    - Should be easily unit-testable in isolation.

### 3. Controller (`*Controller.ts`)
- **Location**: Resides within the feature directory (e.g., `src/review/reviewController.ts`).
- **Role**: Orchestrates the interaction between the VS Code UI and the Document.
- **Responsibilities**:
    - Managing the `WebviewPanel` lifecycle.
    - Subscribing to Document events to trigger UI re-renders.
    - Forwarding UI commands (messages) to the Document.
- **Constraints**:
    - Should be as "thin" as possible.
    - Complex state logic must be delegated to the Document.

## Workflow

1.  **User Action**: User clicks a button in the Webview.
2.  **Message**: Webview sends a message to the **Controller**.
3.  **Command**: Controller calls a method on the **Document**.
4.  **Update**: Document updates its internal state and/or fetches new data.
5.  **Event**: Document notifies the Controller that the data has changed.
6.  **Render**: Controller receives the notification and updates the Webview HTML.
