# CLEAN_CONTEXT: Extensao de Code Review

## 1. Visao Geral e Objetivo

**Dominio:** extensao integrada ao VS Code para apoiar revisao de Pull Requests e branches, validacao arquitetural, rastreabilidade de findings e telemetria tecnica.

**Objetivo:** reduzir carga cognitiva do reviewer, padronizar validacoes tecnicas, registrar historico de correcoes e revalidacoes, e fornecer metricas de qualidade arquitetural.

**Stack alvo:** VS Code Extension Host em TypeScript, Webview React em JavaScript/JSX, Material Design 3 com componentes próprios, hooks React para estado local, Git integration, banco local JSON versionado, cache local e analytics/telemetria.

## 2. Entidades de Negocio Core

### ReviewSession

- `sourceBranch`: branch origem da revisao.
- `targetBranch`: branch destino da revisao.
- `author`: responsavel pela alteracao.
- `reviewer`: responsavel pela revisao.
- `status`: OPEN, IN_REVIEW, NEEDS_CHANGES, FIXED, APPROVED ou REOPENED.
- `createdAt`: data de criacao da sessao.
- `history`: eventos completos da revisao.

### ValidationFinding

- `rule`: regra tecnica ou arquitetural violada.
- `severity`: LOW, MEDIUM, HIGH ou CRITICAL.
- `description`: descricao objetiva da nao conformidade.
- `location`: arquivo, linha e commit relacionados.
- `assignee`: responsavel pela correcao.
- `status`: NEEDS_CHANGES, FIXED, APPROVED ou REOPENED.
- `comments`: comentarios e contexto adicional.

### CorrectionAttempt

- `author`: desenvolvedor que realizou a correcao.
- `commit`: commit relacionado.
- `date`: data da tentativa.
- `description`: resumo da correcao aplicada.
- `findingId`: vinculo permanente com a validacao original.

### Revalidation

- `reviewer`: responsavel pela revalidacao.
- `result`: resultado da nova avaliacao.
- `date`: data da revalidacao.
- `findingId`: validacao reavaliada.

### Metrics

- `qualityScore`: score de qualidade tecnica.
- `findingCount`: quantidade de findings.
- `recurrenceRate`: taxa de reincidencia.
- `averageCorrectionTime`: tempo medio de correcao.

## 3. Regras de Negocio Inegociaveis

| ID | Regra | Restricao |
| --- | --- | --- |
| RN01 | Historico preservado | Review sessions, findings, comentarios, correcoes e revalidacoes devem manter historico auditavel. |
| RN02 | Finding nao e apagado | Uma validacao nunca deve ser removida fisicamente; mudancas devem ser registradas como eventos/status. |
| RN03 | Severidade bloqueante | PRs com findings CRITICAL nao podem ser aprovadas; findings HIGH exigem correcao obrigatoria. |
| RN04 | Revalidacao obrigatoria | Toda correcao deve permitir revalidacao vinculada a validacao original. |
| RN05 | Reabertura rastreavel | Validacoes aprovadas podem ser reabertas sem perder historico anterior. |
| RN06 | Arquitetura protegida | O sistema deve validar SOLID, Clean Architecture, violacao de camadas, acoplamento indevido e dependencia circular. |
| RN07 | Performance de UI | Operacoes pesadas devem ser assincronas e a UI nao pode bloquear a thread principal. |

## 4. Padroes de Implementacao

**Arquitetura alvo:** Clean Architecture, arquitetura modular, event-driven, componentizacao e Domain-Oriented Design.

Camadas principais:

- `src/presentation/`: React webview, Material Design 3, navegacao, feedback visual e comunicacao com o extension host.
- `src/application/`: casos de uso, orquestracao de fluxo, abertura de review, registro de finding, revalidacao e sincronizacao de telemetria.
- `src/domain/`: entidades, regras de negocio, validacoes e invariantes sem dependencia de UI, VS Code ou persistencia.
- `src/infrastructure/`: VS Code API, Git, banco local JSON versionado, cache, analytics e comunicacao externa.
- `src/shared/`: contratos, utilitarios e tipos compartilhados.
- `src/telemetry/`: eventos, metricas e processamento analitico desacoplado.

**Estilo de codigo:** TypeScript com separacao clara de responsabilidades, mudancas pequenas, testes antes da implementacao quando houver regra de negocio, validacoes assincronas e renderizacao incremental para fluxos pesados.

**Documentacao:** qualquer mudanca funcional deve sincronizar `docs/BUSINESS_RULES.MD`, `docs/ROADMAP.md`, documentos de design aplicaveis e os arquivos em `docs/IA/` afetados.

## 5. Mapeamento de Arquivos Atuais

- `docs/ARQUITECTURE.md`: arquitetura, camadas, modulos, design system e fluxo de dados.
- `docs/BUSINESS_RULES.MD`: entidades, estados, severidades e regras de aprovacao.
- `docs/PERFORMACE.md`: limites e diretrizes de performance para UI, dados, persistencia, Git e telemetria.
- `docs/ROADMAP.md`: fases funcionais planejadas.
- `docs/design/VALIDATION_SYSTEM.md`: desenho do sistema de validacoes.
- `docs/design/PULL_REQUEST_REVIEW.md`: fluxo de revisao de Pull Request.
- `docs/design/UI_UX_GUIDELINES.md`: guias de UX/UI.
- `docs/design/MATERIAL_DESIGN_3.md`: aplicacao do Material Design 3.
- `docs/IA/AI_FEATURE_WORKFLOW.md`: protocolo Regra -> Teste -> Codigo.
- `docs/IA/IMPLEMENTATION_PLAN.md`: plano tecnico orientado para IA.
- `docs/IA/RAG_IMPLEMENTATION.md`: ordem de recuperacao de contexto.
