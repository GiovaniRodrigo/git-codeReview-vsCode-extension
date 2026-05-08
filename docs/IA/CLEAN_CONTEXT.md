# CLEAN_CONTEXT: Git Code Review Extension

## 1. Visão Geral e Objetivo

**Domínio:** Code Review and Git productivity.

**Objetivo:** Enhance the code review process within VS Code using Git data, providing a seamless experience for reviewing commits, files, and branches.

**Stack atual:** TypeScript, VS Code API, Git.

## 2. Entidades de Negócio Core

### Review

- Represents a code review session.
- Tracks progress and state of the review.

### Commit

- A Git commit being reviewed.
- Contains metadata and diff information.

### File

- A file changed within a commit or branch.
- Contains the diff content and review status.

### Branch

- A Git branch used as a base or target for comparison.

### Tag

- A Git tag used for versioning and comparison.

## 3. Regras de Negócio Inegociáveis

| ID | Regra | Restrição |
| --- | --- | --- |
| RN01 | Imutabilidade do Model | O Model deve ser uma interface pura e imutável. |
| RN02 | Separação de Concerns | O Controller não deve conter lógica de negócio, delegando ao Document. |
| RN03 | AI Opt-in | AI features MUST be disabled by default. |
| RN04 | Data Privacy | Only diff and metadata are sent to the AI provider. |
| RN05 | Manual Trigger | AI analysis must be triggered manually by the user. |
| RN06 | AI Result Caching | AI results must be cached locally (per hash/path). |

## 4. Padrões de Implementação

**Arquitetura alvo:** Model-Document-Controller (MDC).

Camadas principais:

- `src/review/`: Review module (MDC) for managing the review process.
- `src/productivity/`: Productivity/Compare module (MDC) for branch and commit comparison.
- `src/git/`: Git services and parsers for interacting with the Git CLI.
- `src/github/` & `src/gitlab/`: Remote provider integrations for PR/MR support.
- `src/ai/`: AI service layer for diff analysis and summaries.

**Estilo de código:** TypeScript strict mode, functional transformations in Models, event-driven communication between Document and Controller.

**Documentação:** novas funcionalidades devem sincronizar regras de negócio, plano de implementação e testes.

**Uso de IA:** siga `docs/IA/AI_DEVELOPMENT_PRINCIPLES.md`; IA acelera execução, mas arquitetura, testes, debugging, validação e produção continuam exigindo julgamento de engenharia.

## 5. Mapeamento de Arquivos Atuais

- `package.json`: Configurações globais e dependências.
- `docs/IA/AI_DEVELOPMENT_PRINCIPLES.md`: Princípios de uso responsável e produtivo de IA.
- `docs/IA/IMPLEMENTATION_PLAN.md`: Plano detalhado de implementação.
- `docs/IA/RAG_IMPLEMENTATION.md`: Fluxo de recuperação de contexto para IA.
- `docs/IA/AI_FEATURE_WORKFLOW.md`: Fluxo de trabalho (Regra -> Teste -> Código).
- `docs/IA/CLEAN_CONTEXT.md`: Este arquivo.
