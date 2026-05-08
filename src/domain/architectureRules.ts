export type ArchitectureRuleCategory = 'SOLID' | 'Clean Architecture' | 'DDD';

export interface SourceFile {
  path: string;
  content: string;
}

export interface ArchitectureRuleFinding {
  rule: string;
  category: ArchitectureRuleCategory;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  file: string;
  line: number;
}

export function analyzeArchitectureRules(files: SourceFile[]): ArchitectureRuleFinding[] {
  const findings = files.flatMap((file) => [
    ...solidRules(file),
    ...cleanArchitectureRules(file),
    ...dddRules(file)
  ]);

  return [...findings, ...detectCircularDependencies(files)];
}

function solidRules(file: SourceFile): ArchitectureRuleFinding[] {
  const findings: ArchitectureRuleFinding[] = [];
  const methodCount = countMatches(file.content, /\n\s*(?:public\s+|private\s+|protected\s+)?(?:async\s+)?[a-zA-Z_]\w+\s*\(/g);
  const imports = extractImports(file.content);

  if (methodCount > 12) {
    findings.push(finding(file, 'SRP', 'SOLID', 'HIGH', 'Arquivo concentra muitas responsabilidades pelo volume de metodos.', 1));
  }

  if (countMatches(file.content, /\b(case|if)\s*\([^)]*(type|kind|status|role)[^)]*\)/g) > 4) {
    findings.push(finding(file, 'OCP', 'SOLID', 'MEDIUM', 'Fluxo condicional por tipo/status sugere extensao por modificacao.', lineOf(file.content, /\b(case|if)\s*\(/)));
  }

  if (/\bextends\b/.test(file.content) && /throw new Error\(['"`](not implemented|unsupported|nao suportado)/i.test(file.content)) {
    findings.push(finding(file, 'LSP', 'SOLID', 'HIGH', 'Subclasse parece invalidar comportamento esperado com erro de nao suporte.', lineOf(file.content, /throw new Error/i)));
  }

  if (/interface\s+\w+[\s\S]*?{[\s\S]*?}/.test(file.content) && methodCount > 8) {
    findings.push(finding(file, 'ISP', 'SOLID', 'MEDIUM', 'Interface grande pode obrigar consumidores a depender de metodos desnecessarios.', lineOf(file.content, /interface\s+\w+/)));
  }

  if (
    /src\/(domain|application)\//.test(normalizePath(file.path))
    && imports.some((item) => /infrastructure|presentation|vscode|react/.test(item))
  ) {
    findings.push(finding(file, 'DIP', 'SOLID', 'CRITICAL', 'Camada de dominio/aplicacao depende de detalhe externo ou framework.', lineOf(file.content, /import\s+/)));
  }

  return findings;
}

function cleanArchitectureRules(file: SourceFile): ArchitectureRuleFinding[] {
  const findings: ArchitectureRuleFinding[] = [];
  const path = normalizePath(file.path);
  const imports = extractImports(file.content);

  if (/src\/domain\//.test(path) && imports.some((item) => /application|infrastructure|presentation|telemetry|vscode|react/.test(item))) {
    findings.push(finding(file, 'Dependência incorreta', 'Clean Architecture', 'CRITICAL', 'Dominio deve permanecer independente das demais camadas.', lineOf(file.content, /import\s+/)));
  }

  if (/src\/application\//.test(path) && imports.some((item) => /infrastructure|presentation|vscode|react/.test(item))) {
    findings.push(finding(file, 'Violação de camadas', 'Clean Architecture', 'HIGH', 'Aplicacao deve orquestrar contratos sem depender de infraestrutura ou UI.', lineOf(file.content, /import\s+/)));
  }

  if (imports.length > 12) {
    findings.push(finding(file, 'Acoplamento excessivo', 'Clean Architecture', 'MEDIUM', 'Arquivo possui muitas dependencias diretas.', 1));
  }

  return findings;
}

function dddRules(file: SourceFile): ArchitectureRuleFinding[] {
  const findings: ArchitectureRuleFinding[] = [];
  const path = normalizePath(file.path);

  if (/src\/domain\//.test(path) && /(user|order|payment|review|validation).*(user|order|payment|review|validation)/i.test(file.content)) {
    findings.push(finding(file, 'Bounded Context', 'DDD', 'MEDIUM', 'Arquivo de dominio mistura termos de contextos distintos.', 1));
  }

  if (/(class|interface)\s+\w*Entity\b/.test(file.content) && !/\bid\b/.test(file.content)) {
    findings.push(finding(file, 'Entidades', 'DDD', 'HIGH', 'Entidade deve possuir identidade explicita.', lineOf(file.content, /(class|interface)\s+\w*Entity\b/)));
  }

  if (/(class|interface)\s+\w*ValueObject\b/.test(file.content) && /\b(set|update|mutate)\w*\s*\(/.test(file.content)) {
    findings.push(finding(file, 'Value Objects', 'DDD', 'MEDIUM', 'Value Object deve preservar imutabilidade sem mutadores.', lineOf(file.content, /\b(set|update|mutate)\w*\s*\(/)));
  }

  if (/src\/domain\/.*service/i.test(path) && /(vscode|fetch\(|axios|infrastructure)/.test(file.content)) {
    findings.push(finding(file, 'Serviços de domínio', 'DDD', 'HIGH', 'Servico de dominio nao deve coordenar infraestrutura ou I/O externo.', lineOf(file.content, /(vscode|fetch\(|axios|infrastructure)/)));
  }

  return findings;
}

function detectCircularDependencies(files: SourceFile[]): ArchitectureRuleFinding[] {
  const byPath = new Map(files.map((file) => [normalizePath(file.path), file]));
  const findings: ArchitectureRuleFinding[] = [];

  files.forEach((file) => {
    const filePath = normalizePath(file.path);
    const imports = extractImports(file.content).map((item) => resolveImportPath(filePath, item));

    imports.forEach((importPath) => {
      const imported = byPath.get(importPath);
      if (!imported) return;

      const reverseImports = extractImports(imported.content).map((item) => resolveImportPath(importPath, item));
      if (reverseImports.includes(filePath) && filePath < importPath) {
        findings.push(finding(file, 'Dependência circular', 'Clean Architecture', 'HIGH', `Dependencia circular entre ${filePath} e ${importPath}.`, lineOf(file.content, /import\s+/)));
      }
    });
  });

  return findings;
}

function finding(
  file: SourceFile,
  rule: string,
  category: ArchitectureRuleCategory,
  severity: ArchitectureRuleFinding['severity'],
  description: string,
  line: number
): ArchitectureRuleFinding {
  return { rule, category, severity, description, file: file.path, line };
}

function extractImports(content: string): string[] {
  return Array.from(content.matchAll(/import\s+(?:[^'"`]+from\s+)?['"`]([^'"`]+)['"`]/g)).map((match) => match[1]);
}

function resolveImportPath(fromPath: string, importPath: string): string {
  if (!importPath.startsWith('.')) return importPath;

  const parts = fromPath.split('/');
  parts.pop();

  importPath.split('/').forEach((part) => {
    if (part === '..') parts.pop();
    else if (part !== '.') parts.push(part);
  });

  const resolved = parts.join('/');
  return /\.(ts|tsx|js|jsx)$/.test(resolved) ? resolved : `${resolved}.ts`;
}

function normalizePath(path: string): string {
  return path.replaceAll('\\', '/');
}

function countMatches(content: string, pattern: RegExp): number {
  return Array.from(content.matchAll(pattern)).length;
}

function lineOf(content: string, pattern: RegExp): number {
  const match = pattern.exec(content);
  if (!match?.index) return 1;
  return content.slice(0, match.index).split(/\r?\n/).length;
}
