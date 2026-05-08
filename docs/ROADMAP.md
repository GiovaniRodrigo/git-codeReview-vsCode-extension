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
- [x] Mostrar informacoes da git tree
  - branch atual
  - HEAD
  - upstream
  - ahead/behind
  - staged/unstaged/untracked/conflicts
- [x] Listar branches locais
- [x] Listar branches remotas
- [x] Baixar/atualizar branches remotas
- [x] Listar tags
- [x] Criar TreeView lateral
- [x] Adicionar tooltips na TreeView
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

- [x] Criar Webview de review
- [x] Mostrar metadata do commit
  - autor
  - data
  - hash
  - mensagem
- [x] Mostrar estatísticas
  - linhas adicionadas
  - linhas removidas
- [x] Adicionar filtros
  - branch
  - autor
  - data
  - arquivos
- [x] Adicionar priorizacao assistida
  - categoria do arquivo
  - nivel de risco
  - motivo explicavel para revisar primeiro
- [x] Adicionar busca de commits
- [x] Selecionar vários commits para revisão
- [x] Criar processo de code review salvo
- [x] Retomar processo de code review depois
- [x] Concluir processo de code review
- [x] Marcar arquivos revisados no painel
- [x] Filtrar arquivos revisados e nao revisados
- [x] Adicionar tooltips nos filtros, metricas e acoes do painel

## Resultado esperado

Painel visual completo para navegar commits.

---

# Fase 3 — Integração GitHub

## Objetivo

Relacionar branches com Pull Requests e Merge Requests.

## Tasks

- [x] Detectar remote GitHub
- [x] Implementar autenticação GitHub
- [x] Integrar GitHub REST API
- [x] Buscar Pull Requests
- [x] Relacionar branch ↔ PR
- [x] Mostrar status do PR
  - aberto
  - fechado
  - mergeado
  - draft
- [x] Mostrar checks/CI

## GitLab

- [x] Detectar remote GitLab
- [x] Linkar GitLab via token salvo no SecretStorage
- [x] Integrar GitLab REST API
- [x] Buscar Merge Requests
- [x] Relacionar branch ↔ MR
- [x] Mostrar status do MR
  - aberto
  - fechado
  - mergeado
  - draft

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

- [x] Mostrar diff estilo GitHub
- [x] Permitir comentário por arquivo
- [x] Permitir comentário por linha
- [x] Enviar comentários ao GitHub
- [x] Aprovar Pull Request
- [x] Solicitar mudanças
- [x] Adicionar review geral

## GitLab Review

- [x] Aprovar Merge Request no GitLab
- [x] Solicitar alterações (reprovar) no GitLab
- [x] Comentários por arquivo/linha no GitLab

## Resultado esperado

Fluxo completo de code review dentro do VS Code para GitHub e GitLab.

---

# Fase 5 — Produtividade e IA

## Objetivo

Melhorar workflow para times e integrar inteligência artificial.

## Tasks

- [x] Comparar branches
- [x] Comparar branches em painel interativo
- [x] Revisar tags
- [x] Mostrar commits não revisados
- [x] Salvar histórico local
- [x] Marcar commits revisados
- [x] Notificações de novos commits
- [x] Atalhos rápidos
- [x] Suporte a monorepo
- [x] Multi-root workspace
- [ ] **Integração com IA (Codex/Copilot)**:
  - [ ] Analisar diffs com IA para sugestões de review (opcional)
  - [ ] Gerar resumos de commits/PRs
  - [ ] Detectar bugs ou problemas de segurança potenciais via IA
  - [ ] Opção para habilitar/desabilitar integração com IA por workspace

---

# Fase 6 — Performance

## Objetivo

Escalar para projetos grandes.

## Tasks

- [x] Cache de commits
- [x] Lazy loading
- [x] Atualização incremental
- [x] Virtualização da árvore
- [x] Background refresh
- [x] Indexação local

---

# Fase 7 — Publicação

## Objetivo

Publicar no VS Code Marketplace.

## Tasks

- [x] Criar README
- [x] Criar GIFs/demo
- [x] Criar ícone
- [x] Configurar CHANGELOG
- [x] Configurar telemetry opcional
- [x] Enviar telemetry opcional para API configuravel
- [x] Empacotar extensão

```bash
vsce package
```

- [ ] Publicar

Pendente por exigir credenciais/token do VS Code Marketplace.

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
