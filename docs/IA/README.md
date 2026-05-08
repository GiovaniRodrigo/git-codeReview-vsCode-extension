# IA: Contexto do Projeto

Esta pasta concentra o contexto para agentes de IA trabalharem no projeto **Code Review Extension**, uma extensao do VS Code para navegar branches, commits, diffs, pull requests e comentarios de code review.

## Objetivo do Projeto

Criar uma extensao do VS Code que ajude desenvolvedores a revisar codigo sem sair do editor, comecando pelo Git local e evoluindo para integracao completa com GitHub, GitLab e Inteligência Artificial (IA).

## Documentos Principais

- `CLEAN_CONTEXT.md`: resumo do produto, stack, entidades, regras e arquitetura alvo.
- `IMPLEMENTATION_PLAN.md`: plano tecnico derivado do `ROADMAP.md`.
- `AI_FEATURE_WORKFLOW.md`: fluxo de trabalho para implementar funcionalidades com IA.
- `AI_DEVELOPMENT_PRINCIPLES.md`: principios de uso responsavel de IA no projeto.
- `RAG_IMPLEMENTATION.md`: ordem de recuperacao de contexto para agentes.
- `PROGRAMMING_PARADIGMS.md`: detalhamento de padrões de projeto e paradigmas aplicados.
- `DESIGN_SYSTEM.md`: princípios visuais, cores e componentes da UI.
- `GEMINI.md`: instrucoes operacionais para agentes compatíveis com Gemini CLI.
- `USAGE.md`: guia pratico de uso desta pasta durante o desenvolvimento.

## Fonte da Verdade

O arquivo `ROADMAP.md` na raiz descreve a evolucao funcional do produto. A pasta `IA/` traduz esse roadmap em contexto operacional para IA, mantendo regras, arquitetura e estrategia de implementacao claros.

Quando houver divergencia, use esta prioridade:

1. Mensagem mais recente do usuario.
2. `IA/CLEAN_CONTEXT.md`.
3. `ROADMAP.md`.
4. `IA/IMPLEMENTATION_PLAN.md`.
5. Demais documentos em `IA/`.

## Como Usar

Antes de pedir uma nova funcionalidade para a IA:

1. Confirme que o objetivo existe no `ROADMAP.md` ou descreva claramente a nova necessidade.
2. Peça a IA para consultar `IA/CLEAN_CONTEXT.md`.
3. Para implementacoes, siga `IA/AI_FEATURE_WORKFLOW.md`.
4. Ao final, mantenha `ROADMAP.md` e `IA/IMPLEMENTATION_PLAN.md` sincronizados quando o escopo mudar.

## Filosofia

- Desenvolvimento incremental.
- Git local primeiro, GitHub depois.
- Testes acompanhando comportamento critico.
- UI de VS Code simples, previsivel e integrada ao editor.
- IA como apoio de engenharia, nao como substituta de revisao, testes e decisao tecnica.
