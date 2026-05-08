# Instrucoes do Projeto para Agentes de IA

Este arquivo contem mandatos fundamentais para agentes que trabalham neste repositório.

## Prioridade de Contexto

Siga a hierarquia definida em `docs/IA/RAG_IMPLEMENTATION.md`:

1. Mensagem mais recente do usuario.
2. `docs/IA/CLEAN_CONTEXT.md`.
3. `docs/IA/AI_DEVELOPMENT_PRINCIPLES.md`.
4. `docs/BUSINESS_RULES.MD`.
5. Documentos especificos em `docs/design/`.
6. `docs/IA/IMPLEMENTATION_PLAN.md`.
7. `docs/ARQUITECTURE.md`, `docs/ROADMAP.md` e `docs/PERFORMACE.md`.

## Principios de Uso da IA

- Use IA como amplificador de engenharia, nao como substituto de arquitetura, testes, revisao, debugging ou responsabilidade por producao.
- Trabalhe em ciclos pequenos, incrementais e verificaveis.
- Preserve historico auditavel de review sessions, findings, correcoes, revalidacoes e comentarios.
- Respeite regras de severidade: CRITICAL bloqueia aprovacao; HIGH exige correcao obrigatoria.
- Nao dependa de "prompt magico"; decomponha problemas, explicite criterios de aceite e valide cada entrega.
- Revise, teste e meça tudo que for relevante antes de considerar a tarefa concluida.

## Fluxo de Trabalho Obrigatorio

Toda implementacao deve seguir `docs/IA/AI_FEATURE_WORKFLOW.md`:

1. Identificar ou definir regra de negocio.
2. Criar ou atualizar testes quando houver comportamento verificavel.
3. Implementar codigo no menor escopo possivel.
4. Executar validacoes.
5. Sincronizar documentacao.

## Manutencao de Documentacao

- Ao alterar codigo, identifique quais documentos em `docs/` tornaram-se obsoletos.
- Atualize documentacao junto com a mudanca funcional.
- Mantenha `docs/IA/CLEAN_CONTEXT.md` sincronizado com stack, entidades, regras e arquivos relevantes.

## Padroes de Codigo

- Siga os padroes identificados no `CLEAN_CONTEXT.md`.
- Mantenha dominio independente de UI, VS Code API e persistencia.
- Priorize mudancas cirurgicas e evite refatoracoes globais nao solicitadas.
- Garanta que novos arquivos sigam as convencoes de nomenclatura e estrutura do projeto.
