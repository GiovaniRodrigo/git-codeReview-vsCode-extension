# Code Review Extension

VS Code extension for navigating local Git branches, tags, commits, changed files, and diffs without leaving the editor.

## Current Scope

The implemented local Git flow includes:

- detects the open Git repository;
- lists local branches, remote branches, and tags;
- lazily lists recent commits for each ref;
- lists files changed by each commit;
- opens a native VS Code diff for a changed file;
- opens a review Webview for a branch, tag, or commit;
- shows commit metadata, changed-file statistics, search, filters, and multi-select checkboxes;
- detects GitHub remotes and lists pull requests with status and checks;
- supports GitHub review actions for comments, approvals, and change requests;
- tracks reviewed commits locally and shows unreviewed commits;
- compares branches and refreshes in the background.

Marketplace publishing requires a publisher token. Local packaging is available through `npm run package`.

## Development

```bash
npm install
npm run compile
npm run lint
npm test
npm run package
```

Open this folder in VS Code and run the extension host through the standard extension debugging flow. The `Git Review` view appears in the native Source Control container.
