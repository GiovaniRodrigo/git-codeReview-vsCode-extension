import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import test from 'node:test';
import esbuild from 'esbuild';

await mkdir('.tmp-tests', { recursive: true });
await esbuild.build({
  entryPoints: ['src/application/assistedIntelligence.ts'],
  bundle: true,
  outfile: '.tmp-tests/assistedIntelligence.mjs',
  platform: 'node',
  format: 'esm'
});
await esbuild.build({
  entryPoints: ['src/domain/reviewSession.ts'],
  bundle: true,
  outfile: '.tmp-tests/assistedIntelligenceDomain.mjs',
  platform: 'node',
  format: 'esm'
});

const { buildAssistedIntelligenceReport } = await import('../.tmp-tests/assistedIntelligence.mjs');
const { createReviewSession, createValidationFinding, revalidateFinding } = await import('../.tmp-tests/assistedIntelligenceDomain.mjs');

const git = {
  currentBranch: 'feature/intelligence',
  baseBranch: 'main',
  changedFiles: ['src/application/reviewSessionService.ts'],
  commits: ['abc123 Initial commit']
};

test('builds correction architecture refactor and explanation suggestions', () => {
  const session = createValidationFinding(
    createReviewSession({ git, author: 'Developer', reviewer: 'Reviewer', id: 'review-1' }),
    {
      rule: 'DIP',
      severity: 'CRITICAL',
      description: 'SOLID: Camada depende de detalhe concreto.',
      file: 'src/application/reviewSessionService.ts',
      line: 12,
      commit: 'abc123',
      responsible: 'Reviewer',
      id: 'finding-1'
    }
  );

  const report = buildAssistedIntelligenceReport(session, [session]);

  assert.ok(report.suggestions.some((suggestion) => suggestion.type === 'correction'));
  assert.ok(report.suggestions.some((suggestion) => suggestion.type === 'architecture'));
  assert.ok(report.suggestions.some((suggestion) => suggestion.type === 'refactor'));
  assert.ok(report.suggestions.some((suggestion) => suggestion.type === 'explanation'));
  assert.ok(report.recommendations.some((item) => item.includes('críticos')));
});

test('finds recurring errors patterns comparisons and automatic recommendations', () => {
  const current = createValidationFinding(
    createReviewSession({ git, author: 'Developer', reviewer: 'Reviewer', id: 'review-current' }),
    {
      rule: 'SRP',
      severity: 'CRITICAL',
      description: 'Muitas responsabilidades.',
      file: 'src/a.ts',
      line: 1,
      commit: 'abc123',
      responsible: 'Reviewer',
      id: 'finding-current'
    }
  );
  const previousBase = createValidationFinding(
    createReviewSession({ git, author: 'Developer', reviewer: 'Reviewer', id: 'review-old' }),
    {
      rule: 'SRP',
      severity: 'CRITICAL',
      description: 'Recorrente.',
      file: 'src/b.ts',
      line: 1,
      commit: 'def456',
      responsible: 'Reviewer',
      id: 'finding-old'
    }
  );
  const previous = revalidateFinding(previousBase, 'finding-old', {
    reviewer: 'Reviewer',
    result: 'REOPENED',
    notes: 'Regressao.'
  });

  const report = buildAssistedIntelligenceReport(current, [current, previous]);

  assert.deepEqual(report.recurringErrors[0], { rule: 'SRP', count: 2 });
  assert.ok(report.patterns.length >= 1);
  assert.ok(report.comparisons[0].includes('média histórica'));
  assert.ok(report.recommendations.some((item) => item.includes('SRP')));
});
