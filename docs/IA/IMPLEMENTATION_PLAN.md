# Plano de Implementacao: Extensao de Code Review

Este plano organiza a evolucao tecnica e funcional da extensao de Code Review integrada ao VS Code.

## Objetivo

Construir uma extensao que permita revisar PRs e branches com rastreabilidade, validacoes arquiteturais, historico de correcoes, revalidacao e telemetria tecnica.

O usuario deve conseguir:

* abrir ou criar uma sessao de review;
* navegar por branches, commits, diffs, arquivos alterados, comentarios e findings;
* registrar findings com severidade, status, arquivo, linha e commit;
* acompanhar tentativas de correcao e revalidacoes;
* aprovar, reabrir ou bloquear revisoes conforme regras de negocio;
* visualizar metricas e historico tecnico.

## Estado atual

O projeto possui documentacao-base para:

* arquitetura em camadas e organizacao modular;
* regras de negocio de review, findings, correcoes e revalidacoes;
* roadmap por fases;
* diretrizes de performance;
* design system e fluxos de UI/UX;
* contexto operacional para agentes de IA.

## Fluxo IA para novas funcionalidades

Para qualquer evolucao, a IA deve seguir rigorosamente os documentos de contexto:

1. Consultar `docs/IA/CLEAN_CONTEXT.md`.
2. Consultar `docs/IA/AI_DEVELOPMENT_PRINCIPLES.md`.
3. Localizar a regra aplicavel em `docs/BUSINESS_RULES.MD`, `docs/design/` ou no codigo/testes existentes.
4. Apresentar regra, escopo, arquivos afetados e riscos.
5. Aguardar aprovacao explicita do usuario quando a mudanca envolver regra de negocio ou codigo de producao.
6. Criar ou atualizar testes correspondentes.
7. Implementar a logica no menor escopo possivel.
8. Executar validacoes automatizadas e manuais aplicaveis.
9. Sincronizar a documentacao afetada.

## Principios de Desenvolvimento

* qualidade e rastreabilidade acima de velocidade aparente;
* dominio protegido contra dependencia de UI, VS Code ou persistencia;
* mudancas incrementais, revisaveis e testaveis;
* performance como requisito de produto para PRs grandes;
* documentacao viva como fonte de contexto para humanos e IA.

Consulte tambem `docs/IA/AI_DEVELOPMENT_PRINCIPLES.md`.

## Arquitetura Alvo

```text
VS Code Extension
|
+-- Extension Host
|   +-- Commands
|   +-- Git Integration
|   +-- Review Engine
|   +-- Validation Engine
|   +-- Telemetry Engine
|   +-- Persistence Engine
|
+-- Webview UI
|   +-- Dashboard
|   +-- Review Panels
|   +-- Metrics
|   +-- Findings
|   +-- Timelines
|
+-- Storage
    +-- Local Database
    +-- Cache
    +-- Analytics
```

### Modulos e Componentes

* `src/presentation/`: UI React, componentes, estado de tela e comunicacao com extension host.
* `src/application/`: casos de uso e orquestracao de fluxos de review.
* `src/domain/`: entidades, regras, validacoes e invariantes.
* `src/infrastructure/`: Git, VS Code API, persistencia, cache e analytics.
* `src/shared/`: contratos e utilitarios comuns.
* `src/telemetry/`: eventos, agregacoes e metricas.

## Modelo de Dados / Contratos

### ReviewSession

* `sourceBranch`: branch origem.
* `targetBranch`: branch destino.
* `author`: autor da alteracao.
* `reviewer`: reviewer responsavel.
* `status`: OPEN, IN_REVIEW, NEEDS_CHANGES, FIXED, APPROVED ou REOPENED.
* `createdAt`: data de criacao.

### ValidationFinding

* `rule`: regra violada.
* `severity`: LOW, MEDIUM, HIGH ou CRITICAL.
* `description`: descricao da nao conformidade.
* `file`: arquivo associado.
* `line`: linha associada.
* `commit`: commit associado.
* `status`: NEEDS_CHANGES, FIXED, APPROVED ou REOPENED.

## Fases de Implementacao

| Roadmap | Funcionalidades | Status/Fase Tecnica |
| --- | --- | --- |
| Fase 1 | Inicializacao da extensao, sidebar, comandos, webview, persistencia local, Git basico | Planejado |
| Fase 2 | Sessoes de review, navegacao por diff/commit/arquivo, comentarios e timeline | Planejado |
| Fase 3 | Findings, severidade, status, correcao, revalidacao e reabertura | Planejado |
| Fase 4 | Material Design 3, componentes, feedback em tempo real, loading states e animacoes | Planejado |
| Fase 5 | Score, reincidencia, tempo medio de correcao, dashboards e telemetria | Planejado |

## Estrategia de Testes

Cobertura obrigatoria:

* testes unitarios para dominio, regras de status, severidade e aprovacao;
* testes de aplicacao para casos de uso de review, finding, correcao e revalidacao;
* testes de integracao para Git, persistencia e comunicacao extension host/webview;
* testes de UI para fluxos principais da webview quando componentes existirem.

Validacoes complementares:

* CI/build: executar os comandos definidos no `package.json` quando disponiveis;
* logs/debugging: validar erros de Git, persistencia, webview e extension host;
* fluxo critico manual: abrir review, registrar finding, corrigir, revalidar e aprovar/reabrir;
* performance: validar PRs grandes com renderizacao incremental, cache e operacoes assincronas.

## Deploy e Producao

Estrategia incremental:

* deploy: empacotar e publicar a extensao apenas apos testes e validacao manual do fluxo critico;
* rollback: manter versoes empacotadas e changelog para reverter releases problemáticas;
* migracoes: preservar historico local e compatibilidade de dados;
* monitoramento: registrar eventos de erro, uso, performance e telemetria tecnica;
* riscos operacionais: travamento de UI, perda de historico, parsing incorreto de diff, cache obsoleto e metricas inconsistentes.

## Riscos e Mitigacoes

* UI lenta em PRs grandes: virtualizacao, lazy loading, cache e processamento assíncrono.
* Violacao de historico auditavel: modelar alteracoes como eventos e evitar exclusao fisica.
* Acoplamento entre camadas: manter dominio independente e contratos claros.
* Regras ambiguas de aprovacao: consultar `docs/BUSINESS_RULES.MD` antes de implementar.
