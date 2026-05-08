import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import test from 'node:test';
import esbuild from 'esbuild';

await mkdir('.tmp-tests', { recursive: true });
await esbuild.build({
  entryPoints: ['src/domain/architectureRules.ts'],
  bundle: true,
  outfile: '.tmp-tests/architectureRules.mjs',
  platform: 'node',
  format: 'esm'
});

const { analyzeArchitectureRules } = await import('../.tmp-tests/architectureRules.mjs');

test('detects SOLID violations', () => {
  const findings = analyzeArchitectureRules([
    {
      path: 'src/application/userService.ts',
      content: `
        import { SqlUserRepository } from '../infrastructure/sqlUserRepository';
        export class Child extends Parent { save() { throw new Error('not implemented'); } }
      `
    }
  ]);

  assert.ok(findings.some((finding) => finding.rule === 'DIP'));
  assert.ok(findings.some((finding) => finding.rule === 'LSP'));
});

test('detects clean architecture violations and circular dependencies', () => {
  const findings = analyzeArchitectureRules([
    {
      path: 'src/domain/a.ts',
      content: "import { B } from './b'; import * as vscode from 'vscode';"
    },
    {
      path: 'src/domain/b.ts',
      content: "import { A } from './a';"
    }
  ]);

  assert.ok(findings.some((finding) => finding.rule === 'Dependência incorreta'));
  assert.ok(findings.some((finding) => finding.rule === 'Dependência circular'));
});

test('detects DDD violations', () => {
  const findings = analyzeArchitectureRules([
    {
      path: 'src/domain/paymentValueObject.ts',
      content: 'export class PaymentValueObject { updateAmount(value) { this.value = value; } }'
    },
    {
      path: 'src/domain/orderEntity.ts',
      content: 'export class OrderEntity { total = 0; }'
    },
    {
      path: 'src/domain/reviewService.ts',
      content: 'export class ReviewService { sync() { return fetch("/api"); } }'
    }
  ]);

  assert.ok(findings.some((finding) => finding.rule === 'Value Objects'));
  assert.ok(findings.some((finding) => finding.rule === 'Entidades'));
  assert.ok(findings.some((finding) => finding.rule === 'Serviços de domínio'));
});
