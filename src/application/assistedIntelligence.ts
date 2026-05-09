import { ReviewSession, ValidationFinding } from "../domain/reviewSession";

export interface AssistedSuggestion {
  id: string;
  findingId?: string;
  type:
    | "correction"
    | "architecture"
    | "refactor"
    | "explanation"
    | "recurrence"
    | "pattern"
    | "comparison"
    | "recommendation";
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

export interface IntelligenceHotspot {
  target: string;
  kind: "file" | "module";
  comments: number;
  findings: number;
  critical: number;
  riskScore: number;
}

export interface IntelligenceCorrelation {
  target: string;
  comments: number;
  findings: number;
  openComments: number;
  criticalSignals: number;
  interpretation: string;
}

export interface AssistedIntelligenceReport {
  suggestions: AssistedSuggestion[];
  recurringErrors: Array<{ rule: string; count: number }>;
  patterns: string[];
  comparisons: string[];
  recommendations: string[];
  hotspots: IntelligenceHotspot[];
  moduleHotspots: IntelligenceHotspot[];
  correlations: IntelligenceCorrelation[];
  riskAnalysis: string[];
}

export function buildAssistedIntelligenceReport(
  currentSession: ReviewSession | undefined,
  sessions: ReviewSession[],
): AssistedIntelligenceReport {
  const findings = currentSession?.findings ?? [];
  const allFindings = sessions.flatMap((session) => session.findings ?? []);
  const recurringErrors = recurringRules(allFindings);
  const suggestions = [
    ...findings.flatMap((finding) =>
      suggestionsForFinding(finding, recurringErrors),
    ),
    ...recurringErrors.map((item, index) => ({
      id: `recurrence-${index + 1}`,
      type: "recurrence" as const,
      title: `Erro recorrente: ${item.rule}`,
      description: `A regra ${item.rule} apareceu ${item.count} vezes no histórico local.`,
      priority: item.count > 2 ? ("HIGH" as const) : ("MEDIUM" as const),
    })),
  ];
  const patterns = detectPatterns(allFindings);
  const comparisons = compareCurrentWithHistory(currentSession, sessions);
  const hotspots = buildFileHotspots(sessions);
  const moduleHotspots = buildModuleHotspots(sessions);
  const correlations = buildCorrelations(currentSession, sessions);
  const riskAnalysis = buildRiskAnalysis(
    currentSession,
    hotspots,
    moduleHotspots,
    correlations,
  );
  const recommendations = buildRecommendations(
    findings,
    recurringErrors,
    patterns,
    hotspots,
    correlations,
  );

  return {
    suggestions,
    recurringErrors,
    patterns,
    comparisons,
    recommendations,
    hotspots,
    moduleHotspots,
    correlations,
    riskAnalysis,
  };
}

function suggestionsForFinding(
  finding: ValidationFinding,
  recurringErrors: Array<{ rule: string; count: number }>,
): AssistedSuggestion[] {
  const priority = finding.severity;
  const recurring = recurringErrors.find((item) => item.rule === finding.rule);

  return [
    {
      id: `${finding.id}-correction`,
      findingId: finding.id,
      type: "correction",
      title: `Correção sugerida para ${finding.rule}`,
      description: correctionText(finding),
      priority,
    },
    {
      id: `${finding.id}-architecture`,
      findingId: finding.id,
      type: "architecture",
      title: `Direção arquitetural para ${finding.rule}`,
      description: architectureText(finding),
      priority,
    },
    {
      id: `${finding.id}-refactor`,
      findingId: finding.id,
      type: "refactor",
      title: `Refatoração recomendada em ${finding.file}`,
      description: `Isole a mudança em ${finding.file}:${finding.line} e mantenha histórico da correção na validação original.`,
      priority,
    },
    {
      id: `${finding.id}-explanation`,
      findingId: finding.id,
      type: "explanation",
      title: `Por que ${finding.rule} importa`,
      description: explanationText(finding, recurring?.count ?? 0),
      priority,
    },
  ];
}

function correctionText(finding: ValidationFinding): string {
  const map: Record<string, string> = {
    DIP: "Introduza uma abstração na camada interna e mova a implementação concreta para infraestrutura.",
    SRP: "Separe responsabilidades em casos de uso, serviços ou funções menores com um motivo único de mudança.",
    OCP: "Substitua condicionais por estratégia, polimorfismo ou registro extensível de handlers.",
    LSP: "Garanta que subclasses preservem o contrato da base sem lançar erro para comportamento esperado.",
    ISP: "Divida interfaces amplas em contratos menores usados por consumidores específicos.",
  };

  return (
    map[finding.rule] ??
    "Aplique a menor alteração que remova a violação e preserve o comportamento atual."
  );
}

function architectureText(finding: ValidationFinding): string {
  if (finding.description.includes("Clean Architecture")) {
    return "Mantenha dependências apontando para dentro: domínio independente, aplicação orquestrando contratos e infraestrutura nos detalhes.";
  }

  if (finding.description.includes("DDD")) {
    return "Reforce linguagem ubíqua, identidade de entidades, imutabilidade de value objects e isolamento do domínio.";
  }

  return "Prefira baixo acoplamento, alta coesão e dependências explícitas entre módulos.";
}

function explanationText(
  finding: ValidationFinding,
  recurrenceCount: number,
): string {
  const recurrence =
    recurrenceCount > 1
      ? ` Esta regra já apareceu ${recurrenceCount} vezes no histórico local.`
      : "";
  return `${finding.rule} foi marcado como ${finding.severity} porque impacta manutenção, rastreabilidade ou isolamento arquitetural.${recurrence}`;
}

function recurringRules(
  findings: ValidationFinding[],
): Array<{ rule: string; count: number }> {
  const counts = new Map<string, number>();
  findings.forEach((finding) =>
    counts.set(finding.rule, (counts.get(finding.rule) ?? 0) + 1),
  );

  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count || a.rule.localeCompare(b.rule));
}

function detectPatterns(findings: ValidationFinding[]): string[] {
  const patterns: string[] = [];
  const criticalCount = findings.filter(
    (finding) => finding.severity === "CRITICAL",
  ).length;
  const reopenedCount = findings.filter((finding) =>
    finding.statusHistory.some((entry) => entry.status === "REOPENED"),
  ).length;

  if (criticalCount >= 2)
    patterns.push("Concentração de violações críticas em revisões recentes.");
  if (reopenedCount >= 2)
    patterns.push("Correções têm sido reabertas com frequência.");
  if (recurringRules(findings).length)
    patterns.push(
      "Há regras arquiteturais recorrentes que merecem ação preventiva.",
    );

  return patterns;
}

function compareCurrentWithHistory(
  currentSession: ReviewSession | undefined,
  sessions: ReviewSession[],
): string[] {
  if (!currentSession) return [];

  const previous = sessions.filter(
    (session) => session.id !== currentSession.id,
  );
  if (!previous.length)
    return ["Sem revisões antigas suficientes para comparação."];

  const currentFindings = currentSession.findings?.length ?? 0;
  const averagePrevious =
    previous.reduce(
      (total, session) => total + (session.findings?.length ?? 0),
      0,
    ) / previous.length;
  const direction = currentFindings > averagePrevious ? "acima" : "abaixo";

  return [
    `A sessão atual está ${direction} da média histórica de findings (${currentFindings} vs ${averagePrevious.toFixed(1)}).`,
  ];
}

function buildRecommendations(
  findings: ValidationFinding[],
  recurringErrors: Array<{ rule: string; count: number }>,
  patterns: string[],
  hotspots: IntelligenceHotspot[] = [],
  correlations: IntelligenceCorrelation[] = [],
): string[] {
  const recommendations: string[] = [];

  if (
    findings.some(
      (finding) =>
        finding.severity === "CRITICAL" && finding.status !== "APPROVED",
    )
  ) {
    recommendations.push("Bloqueie aprovação até resolver findings críticos.");
  }

  if (recurringErrors.length) {
    recommendations.push(
      `Priorize uma melhoria sistêmica para ${recurringErrors[0].rule}.`,
    );
  }

  if (patterns.length) {
    recommendations.push(
      "Inclua uma checagem preventiva no fluxo de review para o padrão detectado.",
    );
  }

  if (hotspots.length) {
    recommendations.push(
      `Priorize revisão guiada no hotspot ${hotspots[0].target}, pois ele concentra ${hotspots[0].riskScore} pontos de risco.`,
    );
  }

  if (
    correlations.some(
      (item) => item.criticalSignals > 0 && item.openComments > 0,
    )
  ) {
    recommendations.push(
      "Cruze comentários abertos com Problems/Testes antes de aprovar a sessão.",
    );
  }

  if (!recommendations.length) {
    recommendations.push(
      "Mantenha a revisão incremental e registre decisões relevantes na timeline.",
    );
  }

  return recommendations;
}

function buildFileHotspots(sessions: ReviewSession[]): IntelligenceHotspot[] {
  const byFile = new Map<string, IntelligenceHotspot>();

  for (const session of sessions) {
    for (const comment of session.comments ?? []) {
      const item = ensureHotspot(byFile, comment.file, "file");
      item.comments += 1;
      if (comment.severity === "CRITICAL") item.critical += 1;
      if (comment.status !== "RESOLVED" && comment.status !== "APPROVED")
        item.riskScore += severityWeight(comment.severity);
    }

    for (const finding of session.findings ?? []) {
      const item = ensureHotspot(byFile, finding.file, "file");
      item.findings += 1;
      if (finding.severity === "CRITICAL") item.critical += 1;
      if (finding.status !== "APPROVED" && finding.status !== "FIXED")
        item.riskScore += severityWeight(finding.severity);
    }
  }

  return Array.from(byFile.values())
    .filter((item) => item.comments + item.findings > 0)
    .sort(
      (a, b) =>
        b.riskScore - a.riskScore ||
        b.critical - a.critical ||
        a.target.localeCompare(b.target),
    )
    .slice(0, 8);
}

function buildModuleHotspots(sessions: ReviewSession[]): IntelligenceHotspot[] {
  const byModule = new Map<string, IntelligenceHotspot>();

  for (const session of sessions) {
    for (const comment of session.comments ?? []) {
      const moduleName = moduleFromFile(comment.file);
      const item = ensureHotspot(byModule, moduleName, "module");
      item.comments += 1;
      if (comment.severity === "CRITICAL") item.critical += 1;
      if (comment.status !== "RESOLVED" && comment.status !== "APPROVED")
        item.riskScore += severityWeight(comment.severity);
    }

    for (const finding of session.findings ?? []) {
      const moduleName = moduleFromFile(finding.file);
      const item = ensureHotspot(byModule, moduleName, "module");
      item.findings += 1;
      if (finding.severity === "CRITICAL") item.critical += 1;
      if (finding.status !== "APPROVED" && finding.status !== "FIXED")
        item.riskScore += severityWeight(finding.severity);
    }
  }

  return Array.from(byModule.values())
    .filter((item) => item.comments + item.findings > 0)
    .sort(
      (a, b) =>
        b.riskScore - a.riskScore ||
        b.critical - a.critical ||
        a.target.localeCompare(b.target),
    )
    .slice(0, 8);
}

function buildCorrelations(
  currentSession: ReviewSession | undefined,
  sessions: ReviewSession[],
): IntelligenceCorrelation[] {
  const targetSessions = currentSession ? [currentSession] : sessions.slice(-3);
  const changedFiles = new Set(
    targetSessions.flatMap((session) => session.changedFiles ?? []),
  );
  for (const session of targetSessions) {
    for (const comment of session.comments ?? [])
      changedFiles.add(comment.file);
    for (const finding of session.findings ?? [])
      changedFiles.add(finding.file);
  }

  return Array.from(changedFiles)
    .map((file) => {
      const comments = targetSessions
        .flatMap((session) => session.comments ?? [])
        .filter((comment) => comment.file === file);
      const findings = targetSessions
        .flatMap((session) => session.findings ?? [])
        .filter((finding) => finding.file === file);
      const openComments = comments.filter(
        (comment) =>
          comment.status !== "RESOLVED" && comment.status !== "APPROVED",
      ).length;
      const criticalSignals = [...comments, ...findings].filter(
        (item) => item.severity === "CRITICAL" || item.severity === "HIGH",
      ).length;
      const interpretation = buildCorrelationText(
        file,
        comments.length,
        findings.length,
        openComments,
        criticalSignals,
      );

      return {
        target: file,
        comments: comments.length,
        findings: findings.length,
        openComments,
        criticalSignals,
        interpretation,
      };
    })
    .filter((item) => item.comments + item.findings > 0)
    .sort(
      (a, b) =>
        b.criticalSignals - a.criticalSignals ||
        b.openComments - a.openComments ||
        a.target.localeCompare(b.target),
    )
    .slice(0, 8);
}

function buildRiskAnalysis(
  currentSession: ReviewSession | undefined,
  hotspots: IntelligenceHotspot[],
  moduleHotspots: IntelligenceHotspot[],
  correlations: IntelligenceCorrelation[],
): string[] {
  const risks: string[] = [];
  const criticalOpen =
    currentSession?.comments?.filter(
      (comment) =>
        comment.severity === "CRITICAL" &&
        comment.status !== "RESOLVED" &&
        comment.status !== "APPROVED",
    ).length ?? 0;
  const criticalFindings =
    currentSession?.findings?.filter(
      (finding) =>
        finding.severity === "CRITICAL" &&
        finding.status !== "FIXED" &&
        finding.status !== "APPROVED",
    ).length ?? 0;

  if (criticalOpen || criticalFindings) {
    risks.push(
      `Risco alto: ${criticalOpen + criticalFindings} sinal(is) crítico(s) ainda impactam a sessão atual.`,
    );
  }

  if (hotspots[0]?.riskScore >= 8) {
    risks.push(
      `Hotspot de arquivo: ${hotspots[0].target} concentra comentários/findings com risco ${hotspots[0].riskScore}.`,
    );
  }

  if (moduleHotspots[0]?.riskScore >= 10) {
    risks.push(
      `Hotspot de módulo: ${moduleHotspots[0].target} merece revisão preventiva antes do merge.`,
    );
  }

  if (
    correlations.some(
      (item) => item.openComments > 0 && item.criticalSignals > 0,
    )
  ) {
    risks.push(
      "Há correlação entre comentários abertos e sinais críticos/altos no mesmo arquivo.",
    );
  }

  if (!risks.length) {
    risks.push(
      "Nenhum risco arquitetural relevante detectado com os dados locais atuais.",
    );
  }

  return risks;
}

function ensureHotspot(
  map: Map<string, IntelligenceHotspot>,
  target: string,
  kind: "file" | "module",
): IntelligenceHotspot {
  const existing = map.get(target);
  if (existing) return existing;
  const created: IntelligenceHotspot = {
    target,
    kind,
    comments: 0,
    findings: 0,
    critical: 0,
    riskScore: 0,
  };
  map.set(target, created);
  return created;
}

function moduleFromFile(file: string): string {
  const parts = file.split("/").filter(Boolean);
  if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
  return parts[0] ?? file;
}

function severityWeight(severity: string): number {
  const map: Record<string, number> = {
    LOW: 1,
    MEDIUM: 3,
    HIGH: 5,
    CRITICAL: 8,
  };
  return map[severity] ?? 1;
}

function buildCorrelationText(
  file: string,
  comments: number,
  findings: number,
  openComments: number,
  criticalSignals: number,
): string {
  if (openComments > 0 && criticalSignals > 0) {
    return `${file} possui comentários abertos e sinais altos/críticos; revisar antes de aprovar.`;
  }
  if (comments > 0 && findings > 0) {
    return `${file} tem comentários humanos e findings automáticos no mesmo ponto de atenção.`;
  }
  if (comments > 0) {
    return `${file} concentra discussão humana de review.`;
  }
  return `${file} concentra findings automáticos sem comentários vinculados ainda.`;
}
