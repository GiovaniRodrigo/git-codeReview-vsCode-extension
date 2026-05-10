export const ptBr = {
  dashboard: {
    title: "Visão Executiva do Review",
    subtitle: "Resumo consolidado de score, status, comentários e saúde geral da sessão.",
    hero: {
      scoreLabel: "Score baseado em comentários",
      description: "O score consolida comentários públicos, severidade, itens resolvidos, problems do VS Code e falhas de testes.",
      statusPR: "Status da Sessão/PR",
      openComments: "Comentários Abertos",
      changedFiles: "Arquivos Alterados"
    },
    summary: {
      score: "Score",
      quality: "qualidade geral",
      status: "Status",
      decision: "decisão atual",
      comments: "Comentários",
      open: "abertos",
      blocks: "Bloqueios",
      problemsTests: "Problems + testes"
    },
    timeline: "Resumo da Sessão",
    timelineDesc: "Esta área não substitui Diagnósticos. Ela mostra apenas o estado geral para tomada de decisão.",
    nextActions: "Próximas Ações",
    updateContext: "Atualizar Contexto",
    exportReport: "Exportar Relatório",
    runReview: "Executar Revisão"
  },
  diagnostics: {
    title: "Problemas Técnicos Encontrados",
    subtitle: "Erros, warnings, testes, findings e comentários vinculados a arquivo/linha para correção operacional.",
    summary: {
      findings: "Findings",
      technicalItems: "itens técnicos",
      problems: "Problems",
      vscode: "VS Code",
      tests: "Testes",
      failing: "falhando",
      files: "Arquivos",
      changed: "alterados"
    },
    table: {
      title: "Arquivos, linhas e violações",
      subtitle: "Use esta tela para encontrar a causa do problema, abrir arquivo/diff e associar comentários ao trecho correto."
    },
    commentsTitle: "Comentários técnicos"
  },
  navigation: {
    title: "Navegação",
    subtitle: "Atalhos da sessão para commits, diffs, arquivos, comentários e validações.",
    tabs: {
      changes: "Alterações",
      activity: "Atividade",
      quality: "Qualidade"
    },
    labels: {
      dashboard: "Dashboard",
      analysis: "Diagnósticos",
      intelligence: "Inteligência",
      comments: "Comentários",
      collaboration: "Colaboração",
      conformities: "Conformidades",
      telemetry: "Telemetria",
      history: "Histórico",
      settings: "Configurações",
      commit: "Commit",
      diff: "Diff",
      file: "Arquivo",
      comment: "Comentário",
      validation: "Validação"
    }
  },
  collaboration: {
    title: "Fluxo Reviewer/Developer",
    subtitle: "Comunicação, aprovações parciais e bloqueio de merge.",
    workflowState: {
      blocked: "BLOQUEADO",
      waitingDev: "AGUARDANDO DEV",
      waitingReviewer: "AGUARDANDO REVIEWER",
      ready: "PRONTO PARA APROVAÇÃO"
    },
    summary: {
      waitingDev: "Aguardando dev",
      pendingCorrections: "correções pendentes",
      waitingReviewer: "Aguardando reviewer",
      pendingValidations: "validações pendentes",
      blocks: "Bloqueios",
      preventMerge: "impedem merge",
      notifications: "Notificações",
      unreadMentions: "menções não lidas"
    },
    roles: "Papéis da Revisão",
    pendingByPerson: "Pendências por pessoa",
    threads: "Threads e respostas",
    approveFile: "Aprovar arquivo",
    approveModule: "Aprovar módulo",
    updateBlock: "Atualizar bloqueio"
  },
  settings: {
    title: "Configurações Operacionais",
    subtitle: "Banco local, backup, sincronização remota, cache, lazy loading e adaptadores futuros.",
    actions: {
      localDatabase: "Banco Local",
      backup: "Backup",
      removeSession: "Remover sessão",
      syncRemote: "Sincronização Remota"
    },
    summary: {
      cache: "Cache",
      lazyLoading: "Lazy loading",
      batch: "Batch",
      async: "Async"
    },
    integrations: {
      title: "Integrações Preparadas",
      subtitle: "Adaptadores prontos para configuração sem acoplar credenciais ao núcleo da extensão."
    }
  },
  common: {
    update: "Atualizar",
    refresh: "Recarregar",
    revalidate: "Revalidar",
    create: "Criar",
    save: "Salvar",
    cancel: "Cancelar",
    delete: "Excluir",
    loading: "Carregando...",
    noData: "Nenhum dado disponível.",
    reviewer: "Reviewer",
    developer: "Developer",
    admin: "Admin",
    status: {
      open: "ABERTO",
      inReview: "EM REVISÃO",
      needsChanges: "AJUSTE SOLICITADO",
      fixed: "CORRIGIDO",
      approved: "APROVADO",
      reopened: "REABERTO",
      resolved: "RESOLVIDO"
    }
  }
};
