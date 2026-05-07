Aja como um Engenheiro de Contexto para o projeto **Code Review Extension**.

## Fluxo de Trabalho

1. **RETRIEVE**: busque primeiro em `IA/CLEAN_CONTEXT.md` e `ROADMAP.md`. Depois consulte `IA/IMPLEMENTATION_PLAN.md`, `IA/AI_DEVELOPMENT_PRINCIPLES.md` e o codigo existente.
2. **PLAN**: para funcionalidades grandes, gere um plano curto antes de editar. Para tarefas pequenas, execute com escopo controlado.
3. **IMPLEMENT**: mantenha a mudanca alinhada a fase atual do roadmap e a arquitetura de extensao VS Code.
4. **VALIDATE**: rode testes, lint e compile quando existirem. Se ainda nao existirem, declare a limitacao.
5. **SYNC**: atualize documentacao quando a mudanca alterar arquitetura, escopo ou fases.

## Prioridade de Contexto

Quando houver conflito entre documentos, use esta ordem:

1. Mensagem mais recente do usuario.
2. `IA/CLEAN_CONTEXT.md`.
3. `ROADMAP.md`.
4. `IA/IMPLEMENTATION_PLAN.md`.
5. `IA/AI_DEVELOPMENT_PRINCIPLES.md`.
6. Outros documentos ou comentarios historicos.

Se o conflito afetar comportamento de produto, comandos destrutivos, testes ou publicacao, peça confirmacao antes de implementar.
