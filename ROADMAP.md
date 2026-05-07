# Roadmap — Extensão VS Code para GitHub Code Review

## Objetivo

Criar uma extensão do VS Code para visualizar:

- branches
- commits
- tags
- alterações por commit
- diffs
- pull requests
- comentários de code review

---

# Fase 1 — MVP Git Local

## Objetivo

Visualizar branches e commits usando Git local.

## Tasks

- [x] Criar projeto da extensão com TypeScript
- [x] Configurar estrutura base
- [x] Detectar repositório Git aberto
- [x] Listar branches locais
- [x] Listar branches remotas
- [x] Listar tags
- [x] Criar TreeView lateral
- [x] Exibir commits por branch
- [x] Mostrar detalhes do commit
- [x] Listar arquivos alterados
- [x] Abrir diff no VS Code

## Resultado esperado

```text
Branch
 └── Commit
      └── Arquivos alterados
```

---

# Fase 2 — Interface de Review

## Objetivo

Melhorar experiência visual de revisão.

## Tasks

- [ ] Criar Webview de review
- [ ] Mostrar metadata do commit
  - autor
  - data
  - hash
  - mensagem
- [ ] Mostrar estatísticas
  - linhas adicionadas
  - linhas removidas
- [ ] Adicionar filtros
  - branch
  - autor
  - data
  - arquivos
- [ ] Adicionar busca de commits
- [ ] Selecionar vários commits para revisão

## Resultado esperado

Painel visual completo para navegar commits.

---

# Fase 3 — Integração GitHub

## Objetivo

Relacionar branches com Pull Requests.

## Tasks

- [ ] Detectar remote GitHub
- [ ] Implementar autenticação GitHub
- [ ] Integrar GitHub REST API
- [ ] Buscar Pull Requests
- [ ] Relacionar branch ↔ PR
- [ ] Mostrar status do PR
  - aberto
  - fechado
  - mergeado
  - draft
- [ ] Mostrar checks/CI

## Resultado esperado

```text
Branch
 └── Pull Request
      └── Commits
```

---

# Fase 4 — Code Review

## Objetivo

Permitir review direto pela extensão.

## Tasks

- [ ] Mostrar diff estilo GitHub
- [ ] Permitir comentário por arquivo
- [ ] Permitir comentário por linha
- [ ] Enviar comentários ao GitHub
- [ ] Aprovar Pull Request
- [ ] Solicitar mudanças
- [ ] Adicionar review geral

## Resultado esperado

Fluxo completo de code review dentro do VS Code.

---

# Fase 5 — Produtividade

## Objetivo

Melhorar workflow para times.

## Tasks

- [ ] Comparar branches
- [ ] Revisar tags
- [ ] Mostrar commits não revisados
- [ ] Salvar histórico local
- [ ] Marcar commits revisados
- [ ] Notificações de novos commits
- [ ] Atalhos rápidos
- [ ] Suporte a monorepo
- [ ] Multi-root workspace

---

# Fase 6 — Performance

## Objetivo

Escalar para projetos grandes.

## Tasks

- [ ] Cache de commits
- [ ] Lazy loading
- [ ] Atualização incremental
- [ ] Virtualização da árvore
- [ ] Background refresh
- [ ] Indexação local

---

# Fase 7 — Publicação

## Objetivo

Publicar no VS Code Marketplace.

## Tasks

- [ ] Criar README
- [ ] Criar GIFs/demo
- [ ] Criar ícone
- [ ] Configurar CHANGELOG
- [ ] Configurar telemetry opcional
- [ ] Empacotar extensão

```bash
vsce package
```

- [ ] Publicar

```bash
vsce publish
```

---

# Estrutura sugerida

```text
src/
├── extension.ts
├── git/
│   ├── gitService.ts
│   ├── branchService.ts
│   └── commitService.ts
├── github/
│   ├── githubClient.ts
│   └── pullRequestService.ts
├── tree/
│   ├── BranchTreeProvider.ts
│   ├── CommitNode.ts
│   └── FileNode.ts
├── review/
│   ├── reviewPanel.ts
│   └── diffRenderer.ts
└── utils/
```

---

# Stack recomendada

## Core

- TypeScript
- VS Code Extension API
- Node.js

## Git

- simple-git
- isomorphic-git

## GitHub

- Octokit

## UI

- Webview API
- React (opcional)
- Svelte (opcional)

---

# Ordem recomendada

## Prioridade

1. TreeView
2. Branches
3. Commits
4. Tags
5. Seleção múltipla de commits
6. Arquivos alterados
7. Diff
8. Webview
9. GitHub API
10. Pull Requests
11. Comentários
12. Publicação

---

# Nome da extensão

Sugestões:

- Branch Review Explorer
- Git Review Tree
- PR Explorer
- Commit Navigator
- ReviewFlow
- GitLens Review
- Branch Insight

---

# MVP ideal

## Primeira versão utilizável

- TreeView
- Branches
- Commits
- Arquivos alterados
- Abrir diff

Sem GitHub inicialmente.
