import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('navigation badges and rule groups are derived from state instead of fixed mock values', async () => {
  const source = await readFile('webview-ui/src/main.jsx', 'utf8');

  assert.match(source, /buildNavigationBadges\(state\)/);
  assert.match(source, /buildRuleGroups\(state\)/);
  assert.doesNotMatch(source, /\['dashboard', Home, 'Dashboard', '82'\]/);
  assert.doesNotMatch(source, /\['conformities', CheckCircle2, 'Conformidades', '68'\]/);
  assert.doesNotMatch(source, /\['telemetry', BarChart3, 'Telemetria', '94%'\]/);
  assert.doesNotMatch(source, /\['history', Clock3, 'Histórico', '12'\]/);
  assert.doesNotMatch(source, /RuleItem color="green" label="Testes" count="18"/);
});

test('documentation describes the implemented stack and persistence strategy', async () => {
  const docs = await Promise.all([
    readFile('docs/ARQUITECTURE.md', 'utf8'),
    readFile('docs/ROADMAP.md', 'utf8'),
    readFile('docs/PERFORMACE.md', 'utf8'),
    readFile('docs/IA/CLEAN_CONTEXT.md', 'utf8')
  ]);
  const combined = docs.join('\n');

  assert.match(combined, /JSON local versionado|arquivo JSON local versionado|banco local JSON versionado/);
  assert.doesNotMatch(combined, /shadcn\/ui/);
  assert.doesNotMatch(combined, /Zustand/);
  assert.doesNotMatch(combined, /SQLite/);
  assert.doesNotMatch(combined, /IndexedDB/);
});

test('clean script preserves lockfiles for reproducible installs', async () => {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));

  assert.equal(pkg.scripts.clean.includes('package-lock.json'), false);
  assert.equal(pkg.scripts.clean.includes('webview-ui/package-lock.json'), false);
});
