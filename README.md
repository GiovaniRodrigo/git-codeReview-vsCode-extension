# Code Review Design Extension

Professional VS Code extension for architectural code review, Pull Request analysis, and engineering telemetry with Material Design 3.

## Features

- **Architectural Analysis**: Detect SOLID, Clean Architecture, and DDD violations.
- **Git Integration**: Review commits, branches, and Pull Requests directly in VS Code.
- **Smart Diff**: Visualize architectural impact per layer and file.
- **Telemetry**: Track quality score, error frequency, and correction time.
- **Collaboration**: Register findings with severity, status, and audit history.
- **Audit & Persistence**: Versioned local database with NDJSON audit logs.
- **Onboarding**: Interactive guided tour for new users.

## Usage

1. Open the **Code Review** icon in the Activity Bar.
2. Use the **Dashboard** to see an executive overview of your project's quality.
3. Start a **Review Session** to analyze current changes.
4. Navigate through **Git Review** to comment on specific lines and commits.
5. Export reports and audit logs for compliance.

## Commands

- `Code Review: Abrir Dashboard` (`Ctrl+Alt+R`)
- `Code Review: Iniciar Revisão` (`Ctrl+Alt+Shift+R`)
- `Code Review: Exportar Auditoria` (`Ctrl+Alt+E`)
- `Code Review: Exportar Banco Local` (`Ctrl+Alt+D`)
- `Code Review: Criar Backup` (`Ctrl+Alt+B`)
- `Code Review: Sincronizar Remoto` (`Ctrl+Alt+S`)

## Architecture

This extension follows **Clean Architecture** principles:
- `domain`: Core business rules and entities.
- `application`: Use cases and orchestration.
- `infrastructure`: Git, VS Code API, and persistence.
- `presentation`: React Webview with Material Design 3.

## License

MIT © 2026 Code Review Team
