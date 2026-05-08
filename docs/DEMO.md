# Demo

## Local Git Review

1. Open a Git repository in VS Code.
2. Open the Source Control container.
3. Use the `Git Tree` group to inspect the current branch, HEAD, upstream, sync state, and working tree counts.
4. Use the `Git Review` view to expand local branches, remote branches, or tags.
5. Use `Code Review: Fetch Remote Branches` to run `git fetch --all --prune` and refresh remote refs.
6. Expand a commit to see changed files.
7. Select `Open File Diff` for the native VS Code diff.
8. Select `Open GitHub Style Diff` for the patch-style review panel.
9. Select `Open Review` on a branch, tag, or commit to use filters, search, statistics, and multi-select.
10. Select `Create Review Process` on a branch, tag, or commit to save the review flow.
11. Use `Code Review: Resume Review Process` to reopen a saved review later.
12. Use the risk filter and ordered file list to review high-risk dependency, config, deletion, and large-source changes first.
13. Mark files as reviewed and switch the review status filter to focus on remaining unreviewed files.
14. Hover TreeView items, filters, metrics, and action buttons to inspect contextual tooltips.

## GitHub Pull Requests

1. Use `Code Review: Sign In to GitHub`.
2. Refresh the `Git Review` view.
3. Expand `Pull Requests` to see PRs, state, and checks.
4. Use PR actions to comment, approve, or request changes.

## GitLab Merge Requests

1. Use `Code Review: Link GitLab`.
2. Paste a GitLab Personal Access Token with read access to the project.
3. Refresh the `Git Review` view.
4. Expand `Merge Requests` to see MRs and open them in GitLab.
5. Use MR actions to approve or request changes (if available for the repository).

## AI Assistance (Planned)

1. Enable AI assistance in extension settings.
2. Open a Pull Request or Merge Request.
3. Use the `Analyze with IA` action to get summaries and review suggestions based on diffs.

## Productivity

- Use `Code Review: Compare Branches` to open the interactive compare panel, filter changed files, and open per-file diffs.
- Use `Mark Commit Reviewed` and `Show Unreviewed Commits` to keep local review progress.
- Background refresh detects new commits in the active repository.

## Optional Telemetry

1. Set `codeReview.telemetry.enabled` to `true`.
2. Set `codeReview.telemetry.endpoint` to an API endpoint that accepts JSON `POST` requests.
3. Run any Code Review command and inspect the API receiver for a minimal command telemetry event.
