# Review Module: MDC Implementation

This module manages the code review interface and state.

## Components

- **Model (`reviewModel.ts`)**: Defines `ReviewModel`, `ReviewCommitModel`, and `ReviewFileModel`.
- **Document (`reviewDocument.ts`)**: `ReviewDocument` class. Manages the lifecycle of a review session, including git data fetching and local persistence of "reviewed" status.
- **Controller (`reviewController.ts`)**: `ReviewController` class. Manages the WebviewPanel and handles message passing.

## Implementation Notes

- Use `vscode.EventEmitter` in the Document to notify the Controller of changes.
- The Controller should not perform any data fetching; it should delegate everything to the Document.
- Diffs are opened via VS Code commands from the Controller.
