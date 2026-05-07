# Instrucoes do Projeto para IA

Este arquivo contem mandatos fundamentais para agentes de IA trabalhando no projeto **Code Review Extension**.

## Prioridade de Contexto

Siga a hierarquia definida em `IA/RAG_IMPLEMENTATION.md`:

1. Mensagem mais recente do usuario.
2. `IA/CLEAN_CONTEXT.md`.
3. `ROADMAP.md`.
4. `IA/IMPLEMENTATION_PLAN.md`.
5. `IA/AI_DEVELOPMENT_PRINCIPLES.md`.

## Principios de Uso da IA

- Use IA como amplificador de engenharia, nao como substituto de arquitetura, testes, revisao ou debugging.
- Trabalhe em ciclos pequenos e verificaveis.
- Priorize o MVP Git local antes de dependencias com GitHub.
- Preserve a separacao entre servicos Git, servicos GitHub e UI do VS Code.
- Revise, teste e meça tudo que for relevante antes de considerar a tarefa concluida.

## Fluxo de Trabalho

Toda implementacao deve considerar `IA/AI_FEATURE_WORKFLOW.md`:

1. Identificar a fase e a regra de produto.
2. Criar ou atualizar testes quando houver scaffold.
3. Implementar no menor escopo possivel.
4. Executar validacoes.
5. Sincronizar documentacao afetada.

## Manutencao de Documentacao

- Ao alterar codigo, identifique quais documentos ficaram desatualizados.
- Atualize `IA/CLEAN_CONTEXT.md` quando a stack, contratos ou arquitetura mudarem.
- Atualize `IA/IMPLEMENTATION_PLAN.md` quando uma fase avancar ou mudar de escopo.
- Atualize `ROADMAP.md` quando uma tarefa for concluida ou redefinida.

## Padroes de Codigo

- Siga os padroes identificados em `IA/CLEAN_CONTEXT.md`.
- Priorize mudancas cirurgicas e evite refatoracoes globais nao solicitadas.
- Garanta que novos arquivos sigam a estrutura esperada para extensoes VS Code em TypeScript.
