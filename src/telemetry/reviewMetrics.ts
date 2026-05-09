import { ReviewSession, ValidationFinding } from '../domain/reviewSession';

export interface ReviewMetrics {
  qualityScore: number;
  findingsCount: number;
  commentsCount: number;
  openCommentsCount: number;
  criticalCount: number;
  highCount: number;
  reopenedCount: number;
  recurrenceRate: number;
  averageCorrectionHours: number;
  approvalsCount: number;
  correctionsCount: number;
  eventsCount: number;
  ruleFrequency: Array<{ rule: string; count: number }>;
  reviewerCount: Array<{ rule: string; count: number }>;
  developerCount: Array<{ rule: string; count: number }>;
  timeline: Array<{ date: string; findings: number; corrections: number; approvals: number; reopenings: number }>;
}

export function calculateReviewMetrics(sessions: ReviewSession[]): ReviewMetrics {
  const findings = sessions.flatMap((session) => session.findings ?? []);
  const comments = sessions.flatMap((session) => session.comments ?? []);
  const findingsCount = findings.length;
  const commentsCount = comments.length;
  const openCommentsCount = comments.filter((comment) => comment.status !== 'RESOLVED' && comment.status !== 'APPROVED').length;
  const criticalCount = findings.filter((finding) => finding.severity === 'CRITICAL').length;
  const highCount = findings.filter((finding) => finding.severity === 'HIGH').length;
  const reopenedCount = findings.filter((finding) => finding.statusHistory.some((entry) => entry.status === 'REOPENED')).length;
  const correctionsCount = findings.reduce((total, finding) => total + finding.correctionAttempts.length, 0);
  const approvalsCount = findings.filter((finding) => finding.status === 'APPROVED').length;
  const recurrenceRate = findingsCount ? round((countRecurringRules(findings) / findingsCount) * 100) : 0;
  const averageCorrectionHours = averageCorrectionTime(findings);
  const eventsCount = sessions.reduce((total, session) => total + session.history.length, 0);

  return {
    qualityScore: calculateQualityScore(findings, comments),
    findingsCount,
    commentsCount,
    openCommentsCount,
    criticalCount,
    highCount,
    reopenedCount,
    recurrenceRate,
    averageCorrectionHours,
    approvalsCount,
    correctionsCount,
    eventsCount,
    ruleFrequency: frequency(findings.map((finding) => finding.rule)),
    reviewerCount: frequency(sessions.map((session) => session.reviewer)),
    developerCount: frequency(findings.map((finding) => finding.responsible)),
    timeline: buildTimeline(findings)
  };
}

function calculateQualityScore(findings: ValidationFinding[], comments: ReviewSession['comments']): number {
  const commentPenalty = comments.reduce((total, comment) => {
    const severityPenalty = comment.severity === 'CRITICAL' ? 20 : comment.severity === 'HIGH' ? 12 : comment.severity === 'MEDIUM' ? 7 : 3;
    const statusRelief = comment.status === 'APPROVED' ? 0.15 : comment.status === 'RESOLVED' ? 0.35 : 1;
    return total + severityPenalty * statusRelief;
  }, 0);

  const penalty = commentPenalty + findings.reduce((total, finding) => {
    const severityPenalty = finding.severity === 'CRITICAL' ? 22 : finding.severity === 'HIGH' ? 14 : finding.severity === 'MEDIUM' ? 7 : 3;
    const statusRelief = finding.status === 'APPROVED' ? 0.2 : finding.status === 'FIXED' ? 0.5 : 1;
    const reopenPenalty = finding.statusHistory.filter((entry) => entry.status === 'REOPENED').length * 5;
    return total + severityPenalty * statusRelief + reopenPenalty;
  }, 0);

  return Math.max(0, Math.min(100, Math.round(100 - penalty)));
}

function countRecurringRules(findings: ValidationFinding[]): number {
  const counts = new Map<string, number>();
  findings.forEach((finding) => counts.set(finding.rule, (counts.get(finding.rule) ?? 0) + 1));
  return findings.filter((finding) => (counts.get(finding.rule) ?? 0) > 1).length;
}

function averageCorrectionTime(findings: ValidationFinding[]): number {
  const durations = findings.flatMap((finding) => {
    const createdAt = Date.parse(finding.createdAt);
    return finding.correctionAttempts
      .map((attempt) => Date.parse(attempt.createdAt) - createdAt)
      .filter((duration) => Number.isFinite(duration) && duration >= 0);
  });

  if (!durations.length) return 0;

  const averageMs = durations.reduce((total, duration) => total + duration, 0) / durations.length;
  return round(averageMs / 1000 / 60 / 60);
}

function frequency(values: string[]): Array<{ rule: string; count: number }> {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));

  return Array.from(counts.entries())
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count || a.rule.localeCompare(b.rule));
}

function buildTimeline(findings: ValidationFinding[]): ReviewMetrics['timeline'] {
  const byDate = new Map<string, { date: string; findings: number; corrections: number; approvals: number; reopenings: number }>();

  findings.forEach((finding) => {
    const createdDate = toDateKey(finding.createdAt);
    const createdBucket = getTimelineBucket(byDate, createdDate);
    createdBucket.findings += 1;

    finding.correctionAttempts.forEach((attempt) => {
      getTimelineBucket(byDate, toDateKey(attempt.createdAt)).corrections += 1;
    });

    finding.revalidations.forEach((revalidation) => {
      const bucket = getTimelineBucket(byDate, toDateKey(revalidation.createdAt));
      if (revalidation.result === 'APPROVED') bucket.approvals += 1;
      if (revalidation.result === 'REOPENED') bucket.reopenings += 1;
    });
  });

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function getTimelineBucket(
  map: Map<string, { date: string; findings: number; corrections: number; approvals: number; reopenings: number }>,
  date: string
): { date: string; findings: number; corrections: number; approvals: number; reopenings: number } {
  const existing = map.get(date);
  if (existing) return existing;

  const bucket = { date, findings: 0, corrections: 0, approvals: 0, reopenings: 0 };
  map.set(date, bucket);
  return bucket;
}

function toDateKey(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
