# Changelog

All notable changes to the Git Code Review VS Code Extension will be documented in this file.

## [0.0.1] - 2026-05-08

### Added

#### Core Features
- **Git Repository Navigation**: Browse local Git branches, tags, commits, changed files, and diffs directly from VS Code
- **Code Review Explorer**: Dedicated SCM view for comprehensive code review workflows
- **Commit Management**: View commit details, diffs, and mark commits as reviewed
- **File Diff Viewer**: 
  - Standard diff view
  - GitHub-style diff view with enhanced visual formatting
  
#### GitHub Integration
- **GitHub Authentication**: Sign in to GitHub directly from the extension
- **Pull Request Management**:
  - View and open pull requests
  - Approve pull requests
  - Request changes on pull requests
  - Comment on pull requests
  - Direct PR linking and navigation

#### GitLab Integration
- **GitLab Authentication**: Link GitLab accounts
- **Merge Request Management**:
  - View and open merge requests
  - Approve merge requests
  - Request changes (unapprove) on merge requests
  - Comment on merge requests
- **Custom GitLab Domains**: Support for self-hosted GitLab instances

#### Review Process Management
- **Create Review Process**: Initialize structured code review workflows
- **Resume Review Process**: Continue previous review sessions
- **Complete Review Process**: Mark reviews as finished
- **Track Reviewed Files**: Mark individual commits as reviewed
- **Show Unreviewed Commits**: Filter and display unreviewed items

#### Advanced Features
- **Branch Comparison**: Compare different branches side-by-side
- **Remote Branch Fetching**: Automatically fetch and sync remote branches
- **Review Comments**: Add inline comments to specific files during review
- **Telemetry Support**: Optional analytics with configurable HTTPS endpoints

#### AI Features (Preview)
- **AI Analysis**: Enable/disable AI-powered features
- **Code Summaries**: Automatic generation of change summaries (mock provider)
- **Suggestions**: AI-assisted review suggestions

#### Configuration Options
- Telemetry settings (enabled/disabled)
- Telemetry endpoint configuration
- GitLab custom domain support
- AI provider selection
- AI feature toggles

#### Keybindings
- `Ctrl+Alt+R` / `Cmd+Alt+R`: Refresh code review explorer
- `Ctrl+Alt+C` / `Cmd+Alt+C`: Compare branches
- `Ctrl+Alt+V` / `Cmd+Alt+V`: Run compliance validation
- `Ctrl+Alt+A` / `Cmd+Alt+A`: Apply architecture corrections
- `Ctrl+Alt+T` / `Cmd+Alt+T`: Show telemetry history
- `Ctrl+Alt+I` / `Cmd+Alt+I`: Run AI review

### Requirements
- VS Code 1.90.0 or higher
- Git installed locally

### Credits
- Created by: CodeReviewExtension
- Repository: https://github.com/GiovaniRodrigo/git-codeReview-vsCode-extension

---

**Initial Release**: Full-featured local Git code review extension with GitHub and GitLab integration capabilities.
