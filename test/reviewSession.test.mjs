import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import test from 'node:test';
import esbuild from 'esbuild';

await mkdir('.tmp-tests', { recursive: true });
await esbuild.build({
  entryPoints: ['src/domain/reviewSession.ts'],
  bundle: true,
  outfile: '.tmp-tests/reviewSession.mjs',
  platform: 'node',
  format: 'esm'
});

const {
  addReviewComment,
  createReviewSession,
  editReviewComment,
  navigateReviewSession,
  updateReviewSessionGitContext
} = await import('../.tmp-tests/reviewSession.mjs');

const git = {
  currentBranch: 'feature/review-session',
  baseBranch: 'main',
  pullRequestId: '42',
  changedFiles: ['src/extension.ts'],
  commits: ['abc123 Initial commit']
};

test('creates an auditable review session from git context', () => {
  const session = createReviewSession({
    git,
    author: 'Developer',
    reviewer: 'Reviewer',
    now: new Date('2026-05-08T12:00:00.000Z'),
    id: 'review-1'
  });

  assert.equal(session.id, 'review-1');
  assert.equal(session.sourceBranch, 'feature/review-session');
  assert.equal(session.targetBranch, 'main');
  assert.equal(session.status, 'OPEN');
  assert.deepEqual(session.changedFiles, ['src/extension.ts']);
  assert.equal(session.history.length, 1);
  assert.equal(session.history[0].type, 'SESSION_CREATED');
});

test('rejects session creation without required branches', () => {
  assert.throws(
    () => createReviewSession({ git: { ...git, currentBranch: '' }, author: 'Developer', reviewer: 'Reviewer' }),
    /branch origem/
  );

  assert.throws(
    () => createReviewSession({ git: { ...git, baseBranch: '' }, author: 'Developer', reviewer: 'Reviewer' }),
    /branch destino/
  );
});

test('refreshes git context without deleting previous history', () => {
  const session = createReviewSession({
    git,
    author: 'Developer',
    reviewer: 'Reviewer',
    now: new Date('2026-05-08T12:00:00.000Z'),
    id: 'review-1'
  });

  const updated = updateReviewSessionGitContext(
    session,
    { ...git, changedFiles: ['src/extension.ts', 'package.json'] },
    new Date('2026-05-08T13:00:00.000Z')
  );

  assert.deepEqual(updated.changedFiles, ['src/extension.ts', 'package.json']);
  assert.equal(updated.history.length, 2);
  assert.equal(updated.history[0].type, 'SESSION_CREATED');
  assert.equal(updated.history[1].type, 'GIT_CONTEXT_REFRESHED');
});

test('adds code-linked comments with thread metadata and audit history', () => {
  const session = createReviewSession({
    git,
    author: 'Developer',
    reviewer: 'Reviewer',
    now: new Date('2026-05-08T12:00:00.000Z'),
    id: 'review-1'
  });

  const updated = addReviewComment(session, {
    body: 'Extrair dependencia concreta.',
    author: 'Reviewer',
    file: 'src/extension.ts',
    line: 10,
    commit: 'abc123',
    now: new Date('2026-05-08T12:10:00.000Z'),
    id: 'comment-1'
  });

  assert.equal(updated.comments.length, 1);
  assert.equal(updated.comments[0].threadId, 'comment-1');
  assert.equal(updated.comments[0].file, 'src/extension.ts');
  assert.equal(updated.history.at(-1).type, 'COMMENT_ADDED');
});

test('edits comments without deleting previous body', () => {
  const session = addReviewComment(
    createReviewSession({ git, author: 'Developer', reviewer: 'Reviewer', id: 'review-1' }),
    { body: 'Antes', author: 'Reviewer', file: 'src/extension.ts', line: 10, id: 'comment-1' }
  );

  const updated = editReviewComment(session, 'comment-1', 'Depois', 'Reviewer', new Date('2026-05-08T12:20:00.000Z'));

  assert.equal(updated.comments[0].body, 'Depois');
  assert.equal(updated.comments[0].history.length, 1);
  assert.equal(updated.comments[0].history[0].body, 'Antes');
  assert.equal(updated.history.at(-1).type, 'COMMENT_EDITED');
});

test('stores navigation target in the review session history', () => {
  const session = createReviewSession({ git, author: 'Developer', reviewer: 'Reviewer', id: 'review-1' });
  const updated = navigateReviewSession(
    session,
    { kind: 'file', ref: 'src/extension.ts', file: 'src/extension.ts' },
    new Date('2026-05-08T12:30:00.000Z')
  );

  assert.equal(updated.activeNavigation.kind, 'file');
  assert.equal(updated.activeNavigation.ref, 'src/extension.ts');
  assert.equal(updated.history.at(-1).type, 'NAVIGATION_CHANGED');
});
