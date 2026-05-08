import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import test from 'node:test';
import esbuild from 'esbuild';

await mkdir('.tmp-tests', { recursive: true });
await esbuild.build({
  entryPoints: ['src/application/reviewSessionService.ts'],
  bundle: true,
  outfile: '.tmp-tests/reviewSessionService.mjs',
  platform: 'node',
  format: 'esm'
});

const { ReviewSessionService } = await import('../.tmp-tests/reviewSessionService.mjs');

const git = {
  currentBranch: 'feature/session-list',
  baseBranch: 'main',
  changedFiles: ['src/extension.ts'],
  commits: ['abc123 Initial commit']
};

test('lists sessions and opens an existing review as current', async () => {
  const repository = new MemoryReviewSessionRepository();
  const service = new ReviewSessionService(repository, new StaticGitService(git));
  const first = await service.startReview('Developer', 'Reviewer');

  await service.startReview('Developer', 'Reviewer');
  const opened = await service.openReview(first.id);
  const state = await service.getDashboardState();

  assert.equal(opened.id, first.id);
  assert.equal(state.currentSession?.id, first.id);
  assert.equal(state.sessions.length, 1);
});

test('rejects opening a review session that does not exist', async () => {
  const service = new ReviewSessionService(new MemoryReviewSessionRepository(), new StaticGitService(git));

  await assert.rejects(() => service.openReview('missing-review'), /nao encontrada/);
});

test('updates review status and appends audit history', async () => {
  const service = new ReviewSessionService(new MemoryReviewSessionRepository(), new StaticGitService(git));
  const session = await service.startReview('Developer', 'Reviewer');

  const updated = await service.updateStatus(session.id, 'IN_REVIEW');

  assert.equal(updated.status, 'IN_REVIEW');
  assert.equal(updated.history.length, 2);
  assert.equal(updated.history[1].type, 'STATUS_CHANGED');
});

test('navigates review targets through the application layer', async () => {
  const service = new ReviewSessionService(new MemoryReviewSessionRepository(), new StaticGitService(git));
  const session = await service.startReview('Developer', 'Reviewer');

  const updated = await service.navigate(session.id, { kind: 'commit', ref: 'abc123' });

  assert.equal(updated.activeNavigation.kind, 'commit');
  assert.equal(updated.history.at(-1).type, 'NAVIGATION_CHANGED');
});

test('adds and edits comments through the application layer', async () => {
  const service = new ReviewSessionService(new MemoryReviewSessionRepository(), new StaticGitService(git));
  const session = await service.startReview('Developer', 'Reviewer');

  const withComment = await service.addComment(session.id, {
    body: 'Rever responsabilidade do modulo.',
    author: 'Reviewer',
    file: 'src/extension.ts',
    line: 12
  });
  const commentId = withComment.comments[0].id;
  const updated = await service.editComment(session.id, commentId, 'Separar em caso de uso.', 'Reviewer');

  assert.equal(updated.comments[0].body, 'Separar em caso de uso.');
  assert.equal(updated.comments[0].history.length, 1);
});

test('manages validation findings correction and revalidation through the application layer', async () => {
  const service = new ReviewSessionService(new MemoryReviewSessionRepository(), new StaticGitService(git));
  const session = await service.startReview('Developer', 'Reviewer');
  const withFinding = await service.createFinding(session.id, {
    rule: 'DIP',
    severity: 'CRITICAL',
    description: 'Dependencia concreta na aplicacao.',
    file: 'src/extension.ts',
    line: 10,
    commit: 'abc123',
    responsible: 'Developer'
  });
  const findingId = withFinding.findings[0].id;

  const fixed = await service.registerCorrection(session.id, findingId, {
    author: 'Developer',
    commit: 'def456',
    description: 'Inversao aplicada.'
  });
  const approved = await service.revalidate(session.id, findingId, {
    reviewer: 'Reviewer',
    result: 'APPROVED',
    notes: 'Correção validada.'
  });

  assert.equal(fixed.findings[0].status, 'FIXED');
  assert.equal(approved.findings[0].status, 'APPROVED');
  assert.equal(approved.findings[0].correctionAttempts.length, 1);
});

class StaticGitService {
  constructor(context) {
    this.context = context;
  }

  async getContext() {
    return this.context;
  }
}

class MemoryReviewSessionRepository {
  constructor() {
    this.current = undefined;
    this.sessions = [];
  }

  async getCurrent() {
    return this.current;
  }

  async getById(id) {
    return this.sessions.find((session) => session.id === id);
  }

  async list() {
    return this.sessions;
  }

  async saveCurrent(session) {
    this.current = session;
    this.sessions = [session, ...this.sessions.filter((item) => item.id !== session.id)];
  }
}
