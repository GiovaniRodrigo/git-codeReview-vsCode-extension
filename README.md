# Code Review Extension

VS Code extension for navigating local Git branches, tags, commits, changed files, and diffs without leaving the editor.

## Current Scope

The implemented MVP focuses on local Git only:

- detects the open Git repository;
- lists local branches, remote branches, and tags;
- lazily lists recent commits for each ref;
- lists files changed by each commit;
- opens a native VS Code diff for a changed file.

GitHub pull requests and review actions are planned for later roadmap phases.

## Development

```bash
npm install
npm run compile
npm test
```

Open this folder in VS Code and run the extension host through the standard extension debugging flow. The `Git Review` view appears in the native Source Control container.
