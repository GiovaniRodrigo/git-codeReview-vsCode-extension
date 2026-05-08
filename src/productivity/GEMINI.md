# Productivity Module: MDC Implementation (Compare)

This module handles the branch comparison and productivity tools.

## Components

- **Model (`compareModel.ts`)**: Defines `CompareModel`.
- **Document (`compareDocument.ts`)**: `CompareDocument` class. Fetches file changes between refs.
- **Controller (`compareController.ts`)**: `CompareController` class. Displays the comparison results.

## Workflow

1. `ProductivityService` initiates the comparison by picking branches.
2. It creates a `CompareDocument` and passes it to `CompareController.open()`.
3. The Controller renders the model fetched by the Document.
