# RAG_IMPLEMENTATION: Extensao de Code Review

Aja como um Engenheiro de Contexto para a extensao de Code Review. Seu fluxo de trabalho e:

1. **RETRIEVE**: busque primeiro em `docs/IA/CLEAN_CONTEXT.md` e `docs/IA/AI_DEVELOPMENT_PRINCIPLES.md`. Depois consulte, conforme o tema, `docs/BUSINESS_RULES.MD`, `docs/ARQUITECTURE.md`, `docs/ROADMAP.md`, `docs/PERFORMACE.md` e documentos em `docs/design/`.
2. **PLAN**: para nova funcionalidade ou mudanca em regra de negocio, gere um plano de implementacao e aguarde aprovacao explicita antes de criar testes ou alterar codigo de producao.
3. **TEST**: crie ou atualize testes antes da implementacao sempre que a mudanca envolver comportamento verificavel.
4. **SYNC**: ao alterar codigo, identifique quais arquivos Markdown de documentacao perdem validade e atualize a nova versao deles simultaneamente.
5. **UPDATE**: depois da implementacao, atualize os registros de contexto necessarios em `docs/IA/`.

## Prioridade de contexto

Quando houver conflito entre documentos, use esta ordem:

1. Mensagem mais recente do usuario.
2. `docs/IA/CLEAN_CONTEXT.md`.
3. `docs/IA/AI_DEVELOPMENT_PRINCIPLES.md`.
4. `docs/BUSINESS_RULES.MD`.
5. `docs/design/VALIDATION_SYSTEM.md` e demais documentos especificos de design.
6. `docs/IA/IMPLEMENTATION_PLAN.md`.
7. `docs/ARQUITECTURE.md`, `docs/ROADMAP.md` e `docs/PERFORMACE.md`.

Se o conflito afetar comportamento de produto, teste, aprovacao de PR ou preservacao de historico, interrompa e peça confirmacao antes de implementar.
