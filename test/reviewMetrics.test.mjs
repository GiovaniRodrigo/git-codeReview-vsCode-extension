import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import test from 'node:test';
import esbuild from 'esbuild';

await mkdir('.tmp-tests', { recursive: true });
await esbuild.build({
  entryPoints: ['src/telemetry/reviewMetrics.ts'],
  bundle: true,
  outfile: '.tmp-tests/reviewMetrics.mjs',
  platform: 'node',
  format: 'esm'
});
await esbuild.build({
  entryPoints: ['src/domain/reviewSession.ts'],
  bundle: true,
  outfile: '.tmp-tests/reviewMetricsDomain.mjs',
  platform: 'node',
  format: 'esm'
});

const { calculateReviewMetrics } = await import('../.tmp-tests/reviewMetrics.mjs');
const {
  createReviewSession,
  createValidationFinding,
  registerCorrectionAttempt,
  revalidateFinding
} = await import('../.tmp-tests/reviewMetricsDomain.mjs');

const git = {
  currentBranch: 'feature/telemetry',
  baseBranch: 'main',
  changedFiles: ['src/extension.ts'],
  commits: ['abc123 Initial commit']
};

test('calculates quality score frequency recurrence and correction time', () => {
  const base = createReviewSession({
    git,
    author: 'Developer',
    reviewer: 'Reviewer',
    now: new Date('2026-05-08T10:00:00.000Z'),
    id: 'review-1'
  });
  const withFirst = createValidationFinding(base, {
    rule: 'DIP',
    severity: 'CRITICAL',
    description: 'Dependencia concreta.',
    file: 'src/extension.ts',
    line: 10,
    commit: 'abc123',
    responsible: 'Reviewer',
    now: new Date('2026-05-08T11:00:00.000Z'),
    id: 'finding-1'
  });
  const withSecond = createValidationFinding(withFirst, {
    rule: 'DIP',
    severity: 'HIGH',
    description: 'Outra recorrencia.',
    file: 'src/extension.ts',
    line: 20,
    commit: 'abc123',
    responsible: 'Reviewer',
    now: new Date('2026-05-08T12:00:00.000Z'),
    id: 'finding-2'
  });
  const fixed = registerCorrectionAttempt(withSecond, 'finding-1', {
    author: 'Developer',
    commit: 'def456',
    description: 'Corrigido.',
    now: new Date('2026-05-08T15:00:00.000Z')
  });
  const approved = revalidateFinding(fixed, 'finding-1', {
    reviewer: 'Reviewer',
    result: 'APPROVED',
    notes: 'Ok.',
    now: new Date('2026-05-08T16:00:00.000Z')
  });
  const reopened = revalidateFinding(approved, 'finding-2', {
    reviewer: 'Reviewer',
    result: 'REOPENED',
    notes: 'Voltou.',
    now: new Date('2026-05-09T10:00:00.000Z')
  });

  const metrics = calculateReviewMetrics([reopened]);

  assert.equal(metrics.findingsCount, 2);
  assert.equal(metrics.criticalCount, 1);
  assert.equal(metrics.highCount, 1);
  assert.equal(metrics.reopenedCount, 1);
  assert.equal(metrics.recurrenceRate, 100);
  assert.equal(metrics.averageCorrectionHours, 4);
  assert.equal(metrics.ruleFrequency[0].rule, 'DIP');
  assert.equal(metrics.ruleFrequency[0].count, 2);
  assert.equal(metrics.timeline.length, 2);
});

test('returns zeroed metrics for empty history', () => {
  const metrics = calculateReviewMetrics([]);

  assert.equal(metrics.qualityScore, 100);
  assert.equal(metrics.findingsCount, 0);
  assert.equal(metrics.recurrenceRate, 0);
  assert.deepEqual(metrics.timeline, []);
});
