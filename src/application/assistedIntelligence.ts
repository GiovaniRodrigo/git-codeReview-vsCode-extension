import { ReviewSession, ValidationFinding } from '../domain/reviewSession';

export interface AssistedSuggestion {
  id: string;
  findingId?: string;
  type: 'correction' | 'architecture' | 'refactor' | 'explanation' | 'recurrence' | 'pattern' | 'comparison' | 'recommendation';
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AssistedIntelligenceReport {
  suggestions: AssistedSuggestion[];
  recurringErrors: Array<{ rule: string; count: number }>;
  patterns: string[];
  comparisons: string[];
  recommendations: string[];
}

export function buildAssistedIntelligenceReport(currentSession: ReviewSession | undefined, sessions: ReviewSession[]): AssistedIntelligenceReport {
  const findings = currentSession?.findings ?? [];
  const allFindings = sessions.flatMap((session) => session.findings ?? []);
  const recurringErrors = recurringRules(allFindings);
  const suggestions = [
    ...findings.flatMap((finding) => suggestionsForFinding(finding, recurringErrors)),
    ...recurringErrors.map((item, index) => ({
      id: `recurrence-${index + 1}`,
      type: 'recurrence' as const,
      title: `Erro recorrente: ${item.rule}`,
      description: `A regra ${item.rule} apareceu ${item.count} vezes no histórico local.`,
      priority: item.count > 2 ? 'HIGH' as const : 'MEDIUM' as const
    }))
  ];
  const patterns = detectPatterns(allFindings);
  const comparisons = compareCurrentWithHistory(currentSession, sessions);
  const recommendations = buildRecommendations(findings, recurringErrors, patterns);

  return { suggestions, recurringErrors, patterns, comparisons, recommendations };
}

function suggestionsForFinding(finding: ValidationFinding, recurringErrors: Array<{ rule: string; count: number }>): AssistedSuggestion[] {
  const priority = finding.severity;
  const recurring = recurringErrors.find((item) => item.rule === finding.rule);

  return [
    {
      id: `${finding.id}-correction`,
      findingId: finding.id,
      type: 'correction',
      title: `Correção sugerida para ${finding.rule}`,
      description: correctionText(finding),
      priority
    },
    {
      id: `${finding.id}-architecture`,
      findingId: finding.id,
      type: 'architecture',
      title: `Direção arquitetural para ${finding.rule}`,
      description: architectureText(finding),
      priority
    },
    {
      id: `${finding.id}-refactor`,
      findingId: finding.id,
      type: 'refactor',
      title: `Refatoração recomendada em ${finding.file}`,
      description: `Isole a mudança em ${finding.file}:${finding.line} e mantenha histórico da correção na validação original.`,
      priority
    },
    {
      id: `${finding.id}-explanation`,
      findingId: finding.id,
      type: 'explanation',
      title: `Por que ${finding.rule} importa`,
      description: explanationText(finding, recurring?.count ?? 0),
      priority
    }
  ];
}

function correctionText(finding: ValidationFinding): string {
  const map: Record<string, string> = {
    DIP: 'Introduza uma abstração na camada interna e mova a implementação concreta para infraestrutura.',
    SRP: 'Separe responsabilidades em casos de uso, serviços ou funções menores com um motivo único de mudança.',
    OCP: 'Substitua condicionais por estratégia, polimorfismo ou registro extensível de handlers.',
    LSP: 'Garanta que subclasses preservem o contrato da base sem lançar erro para comportamento esperado.',
    ISP: 'Divida interfaces amplas em contratos menores usados por consumidores específicos.'
  };

  return map[finding.rule] ?? 'Aplique a menor alteração que remova a violação e preserve o comportamento atual.';
}

function architectureText(finding: ValidationFinding): string {
  if (finding.description.includes('Clean Architecture')) {
    return 'Mantenha dependências apontando para dentro: domínio independente, aplicação orquestrando contratos e infraestrutura nos detalhes.';
  }

  if (finding.description.includes('DDD')) {
    return 'Reforce linguagem ubíqua, identidade de entidades, imutabilidade de value objects e isolamento do domínio.';
  }

  return 'Prefira baixo acoplamento, alta coesão e dependências explícitas entre módulos.';
}

function explanationText(finding: ValidationFinding, recurrenceCount: number): string {
  const recurrence = recurrenceCount > 1 ? ` Esta regra já apareceu ${recurrenceCount} vezes no histórico local.` : '';
  return `${finding.rule} foi marcado como ${finding.severity} porque impacta manutenção, rastreabilidade ou isolamento arquitetural.${recurrence}`;
}

function recurringRules(findings: ValidationFinding[]): Array<{ rule: string; count: number }> {
  const counts = new Map<string, number>();
  findings.forEach((finding) => counts.set(finding.rule, (counts.get(finding.rule) ?? 0) + 1));

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count || a.rule.localeCompare(b.rule));
}

function detectPatterns(findings: ValidationFinding[]): string[] {
  const patterns: string[] = [];
  const criticalCount = findings.filter((finding) => finding.severity === 'CRITICAL').length;
  const reopenedCount = findings.filter((finding) => finding.statusHistory.some((entry) => entry.status === 'REOPENED')).length;

  if (criticalCount >= 2) patterns.push('Concentração de violações críticas em revisões recentes.');
  if (reopenedCount >= 2) patterns.push('Correções têm sido reabertas com frequência.');
  if (recurringRules(findings).length) patterns.push('Há regras arquiteturais recorrentes que merecem ação preventiva.');

  return patterns;
}

function compareCurrentWithHistory(currentSession: ReviewSession | undefined, sessions: ReviewSession[]): string[] {
  if (!currentSession) return [];

  const previous = sessions.filter((session) => session.id !== currentSession.id);
  if (!previous.length) return ['Sem revisões antigas suficientes para comparação.'];

  const currentFindings = currentSession.findings?.length ?? 0;
  const averagePrevious = previous.reduce((total, session) => total + (session.findings?.length ?? 0), 0) / previous.length;
  const direction = currentFindings > averagePrevious ? 'acima' : 'abaixo';

  return [`A sessão atual está ${direction} da média histórica de findings (${currentFindings} vs ${averagePrevious.toFixed(1)}).`];
}

function buildRecommendations(findings: ValidationFinding[], recurringErrors: Array<{ rule: string; count: number }>, patterns: string[]): string[] {
  const recommendations: string[] = [];

  if (findings.some((finding) => finding.severity === 'CRITICAL' && finding.status !== 'APPROVED')) {
    recommendations.push('Bloqueie aprovação até resolver findings críticos.');
  }

  if (recurringErrors.length) {
    recommendations.push(`Priorize uma melhoria sistêmica para ${recurringErrors[0].rule}.`);
  }

  if (patterns.length) {
    recommendations.push('Inclua uma checagem preventiva no fluxo de review para o padrão detectado.');
  }

  if (!recommendations.length) {
    recommendations.push('Mantenha a revisão incremental e registre decisões relevantes na timeline.');
  }

  return recommendations;
}
