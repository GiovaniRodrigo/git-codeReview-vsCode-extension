# Plano de Implementação: Git Code Review Extension

Este plano organiza a evolução técnica e funcional do projeto **Git Code Review Extension**.

## Objetivo

Provide an integrated and efficient code review experience within VS Code.

O usuário deve conseguir:

* Review commits and changes in a structured way;
* Compare branches and tags;
* Integrate with GitHub and GitLab for PR/MR reviews.

## Estado atual

O projeto conta atualmente com os seguintes componentes estáveis:

* MDC Architecture refactored for core modules (`src/review/` and `src/productivity/`);
* Git service layer for CLI interaction;
* GitHub and GitLab remote providers;
* Unit test suite for core logic.

## Fluxo IA para novas funcionalidades

Para qualquer evolução, a IA deve seguir rigorosamente os documentos de contexto:

1. Consultar `docs/IA/CLEAN_CONTEXT.md`.
2. Consultar `docs/IA/AI_DEVELOPMENT_PRINCIPLES.md`.
3. Propor/Localizar regra de negócio no diretório de regras (**docs/IA/**).
4. Apresentar o plano técnico e aguardar tag `[APROVADO]`.
5. Criar ou atualizar os testes correspondentes.
6. Implementar a lógica no menor escopo possível após aprovação dos testes.
7. Executar validações automatizadas e manuais aplicáveis.
8. Sincronizar a documentação afetada.

## Princípios de Desenvolvimento

* Quality over speed;
* Simplicity in architecture;
* Test-Driven Development.

Consulte também `docs/IA/AI_DEVELOPMENT_PRINCIPLES.md` para os princípios obrigatórios de uso de IA, incluindo trabalho incremental, validação constante, refatoração segura, debugging e cuidados de produção.

## Arquitetura Alvo

```text
[Webview] <-> [Controller] <-> [Document] <-> [Model]
                                   |
                             [Services (Git/Remote)]
```

### Módulos e Componentes

* `src/review/`: Core review logic and UI orchestration.
* `src/productivity/`: Comparison and productivity features.
* `src/git/`: Git CLI abstraction.

## Modelo de Dados / Contratos

Campos e estruturas principais:

### ReviewModel

* `id`: string.
* `state`: ReviewState.

## Fases de Implementação

### Roadmap de Evolução

| Roadmap | Funcionalidades | Status/Fase Técnica |
| --- | --- | --- |
| Fase 1 | MDC Core Refactoring | [CONCLUÍDO] |
| Fase 2 | Remote Integration Enhancement | [EM ANDAMENTO] |
| Fase 5 | AI Integration (Mock) | [EM ANDAMENTO] |

### Fase 1 - MDC Core Refactoring

Entregáveis:

* Refactored `src/review/` to MDC;
* Refactored `src/productivity/` to MDC.

Critérios de aceite:

* All tests passing with `npm run test`;
* No lint errors with `npm run lint`.

## Estratégia de Testes

Cobertura obrigatória:

* Unit tests for Models and Documents;
* Integration tests for Services.

Validações complementares:

* CI/build: `npm run lint && npm run test`;
* análise de logs/debugging: VS Code Output channel;
* validação manual do fluxo crítico: Reviewing a local commit;
* performance/observabilidade, quando aplicável: Git command execution time.

## Deploy e Produção

Estratégia incremental:

* deploy: VSIX extension package;
* rollback: Revert to previous version in VS Code Marketplace;
* migrações: Handle workspace state changes;
* monitoramento: Telemetry service;
* riscos operacionais: Incompatibility with Git versions.

## Riscos e Mitigações

* [Git CLI Dependency]: Ensure compatibility with common Git versions.
