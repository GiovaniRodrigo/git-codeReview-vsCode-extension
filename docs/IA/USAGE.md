# Guia de Uso da Pasta IA

Este guia explica como usar a pasta `IA/` para colaborar com agentes de IA no projeto **Code Review Extension**.

## 1. Antes de Pedir uma Funcionalidade

Verifique se a necessidade esta em uma das fases do `ROADMAP.md`.

Se estiver, mencione a fase ou a tarefa. Exemplo:

```text
IA, implemente a Fase 1: detectar repositorio Git aberto e listar branches locais.
```

Se nao estiver, descreva o comportamento esperado e peça para a IA atualizar o plano quando fizer sentido.

## 2. Ciclo de Desenvolvimento

O fluxo recomendado e:

1. A IA consulta `IA/CLEAN_CONTEXT.md` e `ROADMAP.md`.
2. A IA identifica a fase e o comportamento esperado.
3. A IA cria ou atualiza testes quando ja existir estrutura de projeto.
4. A IA implementa a menor mudanca util.
5. A IA executa `npm run compile`, `npm test` e `npm run lint` quando disponiveis.
6. A IA atualiza documentacao afetada.

## 3. Comandos Uteis para o Usuario

```text
IA, atualize o CLEAN_CONTEXT.md com a estrutura atual do projeto.
```

```text
IA, transforme a Fase 1 do ROADMAP.md em tarefas tecnicas menores.
```

```text
IA, siga o workflow para implementar a TreeView de branches.
```

```text
IA, revise se o IMPLEMENTATION_PLAN.md ainda bate com o ROADMAP.md.
```

## 4. Boas Praticas

- Mantenha `ROADMAP.md` como visao de produto.
- Mantenha `IA/CLEAN_CONTEXT.md` como resumo tecnico enxuto.
- Atualize `IA/IMPLEMENTATION_PLAN.md` quando a arquitetura ou as fases mudarem.
- Evite pedir muitas fases de uma vez; prefira entregas pequenas.
- Para Fase 1, evite depender de rede ou GitHub.
- Para GitHub, sempre preserve fallback para repositorios apenas Git local.

## 5. Validacao

Depois que o scaffold TypeScript existir, as validacoes padrao serao:

```bash
npm run compile
npm test
npm run lint
```

Enquanto esses scripts nao existirem, a IA deve informar que a verificacao automatizada ainda nao esta disponivel.
