export const en = {
  dashboard: {
    title: "Review Executive View",
    subtitle: "Consolidated summary of score, status, comments, and general session health.",
    hero: {
      scoreLabel: "Score based on comments",
      description: "The score consolidates public comments, severity, resolved items, VS Code problems, and test failures.",
      statusPR: "Session/PR Status",
      openComments: "Open Comments",
      changedFiles: "Changed Files"
    },
    summary: {
      score: "Score",
      quality: "general quality",
      status: "Status",
      decision: "current decision",
      comments: "Comments",
      open: "open",
      blocks: "Blocks",
      problemsTests: "Problems + tests"
    },
    timeline: "Session Summary",
    timelineDesc: "This area does not replace Diagnostics. It only shows the general state for decision making.",
    nextActions: "Next Actions",
    updateContext: "Update Context",
    exportReport: "Export Report",
    runReview: "Run Review"
  },
  diagnostics: {
    title: "Technical Issues Found",
    subtitle: "Errors, warnings, tests, findings, and comments linked to file/line for operational correction.",
    summary: {
      findings: "Findings",
      technicalItems: "technical items",
      problems: "Problems",
      vscode: "VS Code",
      tests: "Tests",
      failing: "failing",
      files: "Files",
      changed: "changed"
    },
    table: {
      title: "Files, lines and violations",
      subtitle: "Use this screen to find the cause of the problem, open file/diff and associate comments with the correct snippet."
    },
    commentsTitle: "Technical comments"
  },
  navigation: {
    title: "Navigation",
    subtitle: "Session shortcuts for commits, diffs, files, comments, and validations.",
    tabs: {
      changes: "Changes",
      activity: "Activity",
      quality: "Quality"
    },
    labels: {
      dashboard: "Dashboard",
      analysis: "Diagnostics",
      intelligence: "Intelligence",
      comments: "Comments",
      collaboration: "Collaboration",
      conformities: "Conformities",
      telemetry: "Telemetry",
      history: "History",
      settings: "Settings",
      commit: "Commit",
      diff: "Diff",
      file: "File",
      comment: "Comment",
      validation: "Validation"
    }
  },
  collaboration: {
    title: "Reviewer/Developer Flow",
    subtitle: "Communication, partial approvals, and merge blocking.",
    workflowState: {
      blocked: "BLOCKED",
      waitingDev: "WAITING DEV",
      waitingReviewer: "WAITING REVIEWER",
      ready: "READY FOR APPROVAL"
    },
    summary: {
      waitingDev: "Waiting dev",
      pendingCorrections: "pending corrections",
      waitingReviewer: "Waiting reviewer",
      pendingValidations: "pending validations",
      blocks: "Blocks",
      preventMerge: "prevent merge",
      notifications: "Notifications",
      unreadMentions: "unread mentions"
    },
    roles: "Review Roles",
    pendingByPerson: "Pending by person",
    threads: "Threads and replies",
    approveFile: "Approve file",
    approveModule: "Approve module",
    updateBlock: "Update block"
  },
  settings: {
    title: "Operational Settings",
    subtitle: "Local database, backup, remote sync, cache, lazy loading, and future adapters.",
    actions: {
      localDatabase: "Local DB",
      backup: "Backup",
      removeSession: "Remove session",
      syncRemote: "Remote Sync"
    },
    summary: {
      cache: "Cache",
      lazyLoading: "Lazy loading",
      batch: "Batch",
      async: "Async"
    },
    integrations: {
      title: "Prepared Integrations",
      subtitle: "Adapters ready for configuration without coupling credentials to the extension core."
    }
  },
  common: {
    update: "Update",
    refresh: "Refresh",
    revalidate: "Revalidate",
    create: "Create",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    loading: "Loading...",
    noData: "No data available.",
    reviewer: "Reviewer",
    developer: "Developer",
    admin: "Admin",
    status: {
      open: "OPEN",
      inReview: "IN REVIEW",
      needsChanges: "NEEDS CHANGES",
      fixed: "FIXED",
      approved: "APPROVED",
      reopened: "REOPENED",
      resolved: "RESOLVED"
    }
  }
};
