# Plano de Implementacao: Code Review Extension

Este plano organiza a evolucao tecnica da extensao VS Code para GitHub Code Review.

## Objetivo

Construir uma extensao do VS Code que permita revisar historico Git e, depois, pull requests do GitHub sem sair do editor.

O usuario deve conseguir:

- abrir um workspace Git e visualizar branches, tags e commits;
- inspecionar arquivos alterados em um commit;
- abrir diffs diretamente no VS Code;
- relacionar branches com pull requests do GitHub;
- comentar, aprovar ou solicitar mudancas em pull requests em fases futuras.

## Estado Atual

O projeto conta atualmente com:

- `ROADMAP.md` com fases funcionais do produto;
- pasta `IA/` com contexto de desenvolvimento assistido;
- scaffold de extensao VS Code em TypeScript;
- servicos Git locais para detectar repositorio, listar branches, tags, commits e arquivos alterados;
- leitura de informacoes da git tree com branch atual, HEAD, upstream, ahead/behind e contadores da working tree;
- comando para baixar/atualizar branches remotas com `git fetch --all --prune`;
- TreeView `Git Review` no container nativo de Source Control;
- comando para abrir detalhes de commit em documento Markdown temporario;
- diff nativo do VS Code usando provider de documentos virtuais para conteudo Git.
- Webview de review com metadata, estatisticas, busca, filtros e selecao multipla de commits.
- priorizacao assistida no painel de review com categoria de arquivo, nivel de risco e motivo explicavel.
- progresso local por arquivo revisado no painel, com filtro para revisados e nao revisados.
- processos locais de code review para salvar, retomar e concluir revisoes de branch, tag ou commit.
- integracao GitHub com remote, autenticacao nativa do VS Code, Pull Requests, estados e checks;
- integracao GitLab com remote, token em SecretStorage e Merge Requests;
- comandos de review para comentario geral, comentario por arquivo/linha, approve e request changes;
- produtividade local com comparar branches, commits revisados, nao revisados, atalhos e notificacoes;
- painel interativo de comparacao entre branches com filtros, estatisticas e diffs por arquivo;
- telemetria opcional para eventos minimos de comando, enviada por POST para API configuravel quando habilitada;
- cache em memoria, lazy loading da TreeView, refresh em background e empacotamento VSIX.

## Fluxo IA para Novas Funcionalidades

Para qualquer evolucao, a IA deve:

1. Consultar `IA/CLEAN_CONTEXT.md`.
2. Consultar `ROADMAP.md`.
3. Consultar `IA/AI_DEVELOPMENT_PRINCIPLES.md`.
4. Identificar a fase do roadmap relacionada.
5. Criar ou atualizar testes quando houver estrutura de projeto.
6. Implementar no menor escopo possivel.
7. Executar validacoes aplicaveis.
8. Atualizar documentacao afetada.

## Principios de Desenvolvimento

- Git local antes de GitHub.
- UI integrada ao VS Code antes de experiencias customizadas complexas.
- Servicos de Git e GitHub testaveis sem dependencia direta da interface.
- Entregas incrementais por fase.
- Erros claros para repositorio ausente, comando Git falho, autenticacao ausente ou API indisponivel.
- Documentacao e testes acompanhando mudancas relevantes.

## Arquitetura Alvo

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

### Modulos e Componentes

- `src/extension.ts`: ponto de entrada da extensao, registro de comandos e TreeViews.
- `src/git/gitService.ts`: execucao segura de comandos Git e deteccao do repositorio.
- `src/git/branchService.ts`: listagem de branches locais, remotas e tags.
- `src/git/commitService.ts`: listagem de commits, detalhes e arquivos alterados.
- `src/github/githubClient.ts`: autenticacao e cliente HTTP para GitHub.
- `src/github/pullRequestService.ts`: busca e correlacao de pull requests com branches.
- `src/tree/BranchTreeProvider.ts`: TreeView lateral.
- `src/review/reviewPanel.ts`: Webview de review.
- `src/review/diffRenderer.ts`: renderizacao ou composicao de diffs quando necessario.

## Contratos Principais

### BranchSummary

- `name: string`
- `type: "local" | "remote"`
- `upstream?: string`
- `headCommit?: string`

### CommitSummary

- `hash: string`
- `shortHash: string`
- `message: string`
- `authorName: string`
- `authorEmail?: string`
- `date: string`

### CommitFileChange

- `path: string`
- `previousPath?: string`
- `status: "added" | "modified" | "deleted" | "renamed" | "copied"`
- `additions?: number`
- `deletions?: number`

### PullRequestSummary

- `number: number`
- `title: string`
- `state: "open" | "closed" | "merged" | "draft"`
- `headBranch: string`
- `baseBranch: string`
- `url: string`

## Fases de Implementacao

| Fase | Funcionalidades | Status |
| --- | --- | --- |
| Fase 1 | Scaffold da extensao, Git local, branches, tags, commits, arquivos e diff | Implementado |
| Fase 2 | Webview de review, filtros, busca e selecao de commits | Implementado |
| Fase 3 | GitHub remote, autenticacao, PRs, status e checks | Implementado |
| Fase 3b | GitLab remote, MRs, token em SecretStorage e status | Implementado |
| Fase 4 | Review completo: comentarios, approve, request changes (GH/GL) | Em progresso |
| Fase 5 | Produtividade e IA: comparacao branches, monorepo e Codex/Copilot | Em progresso |
| Fase 6 | Cache, lazy loading, indexacao e background refresh | Implementado |
| Fase 7 | README, demos, icone, CHANGELOG, empacotamento e publicacao | Implementado parcialmente |

### Fase 1 - MVP Git Local

Entregaveis:

- projeto VS Code Extension em TypeScript;
- TreeView lateral com branches locais, remotas e tags;
- grupo `Git Tree` com contexto do repositorio atual;
- commits por branch;
- acao para atualizar referencias remotas sem criar branches locais automaticamente;
- detalhes do commit;
- arquivos alterados;
- comando para abrir diff no VS Code.

Status: implementado no MVP inicial.

Criterios de aceite:

- workspace sem Git mostra erro amigavel;
- workspace Git mostra contexto de branch, HEAD, upstream e working tree;
- workspace Git lista branches locais e remotas;
- usuario consegue atualizar branches remotas pela TreeView e ver referencias novas apos refresh;
- selecionar branch permite visualizar commits;
- selecionar commit permite visualizar arquivos alterados;
- selecionar arquivo alterado abre diff correspondente.

### Fase 2 - Interface de Review

Entregaveis:

- Webview de review;
- metadata do commit;
- estatisticas de linhas;
- filtros por branch, autor, data e arquivo;
- filtro por risco e ordenacao sugerida para revisar mudancas mais arriscadas primeiro;
- processo salvo para retomar revisoes depois;
- marcacao local de arquivos revisados;
- filtro por estado de revisao do arquivo;
- busca de commits;
- selecao multipla para revisao.

Status: implementado no painel `Review`, aberto a partir de branches, tags ou commits na TreeView.

Criterios de aceite:

- painel carrega a partir de commits reais;
- filtros combinam sem quebrar a navegacao;
- busca responde de forma previsivel para mensagem, autor e hash.
- arquivos de maior risco aparecem primeiro e exibem motivo de priorizacao.
- progresso por arquivo persiste no workspace e permite focar apenas no que falta revisar.
- processo de review pode ser criado a partir de branch, tag ou commit e retomado no mesmo repositorio.

### Fase 3 - Integracao GitHub

Entregaveis:

- deteccao de remote GitHub;
- autenticacao;
- cliente REST;
- busca de PRs;
- relacao branch/PR;
- status e checks.

Criterios de aceite:

- repositorio sem remote GitHub continua funcionando no modo Git local;
- erro de autenticacao e tratado explicitamente;
- PRs aparecem associados a branch correta quando existirem.

### Fase 3b - Integracao GitLab

Entregaveis:

- deteccao de remote GitLab;
- comando para linkar GitLab com token salvo no SecretStorage;
- cliente REST GitLab;
- busca de Merge Requests;
- relacao branch/MR;
- status do MR.

Criterios de aceite:

- repositorio sem remote GitLab continua funcionando nos modos Git local e GitHub;
- erro de token ou API nao bloqueia a TreeView;
- MRs aparecem associados a branch correta quando existirem.

### Fase 4 - Code Review

Entregaveis:

- diff estilo GitHub quando necessario;
- comentarios por arquivo e linha para GitHub e GitLab;
- envio de comentarios de review;
- acoes de approve e request changes (ou similar no GitLab);
- review geral.

Criterios de aceite:

- comentarios nao sao enviados acidentalmente;
- falhas da API preservam o texto digitado pelo usuario;
- acoes de review confirmam sucesso ou erro de forma clara;
- suporte a GitLab inclui aprovacao de Merge Requests.

### Fase 5 - Produtividade e IA

Entregaveis:

- comparar branches em painel interativo;
- historico local de revisoes e notificacoes;
- suporte a monorepo e multi-root;
- **Integracao com IA (Codex/Copilot)**:
  - comando opcional para analisar diff e sugerir melhorias;
  - geracao de resumo de PR/MR via IA;
  - deteccao de riscos potenciais (seguranca/performance) via LLM.

Criterios de aceite:

- comparacao de branches funciona de forma fluida;
- a integracao com IA e estritamente "opt-in";
- o usuario pode escolher qual motor de IA usar se disponivel.

### Fase 6 - Performance e Escalabilidade

Entregaveis:

- cache persistente de commits e arquivos;
- lazy loading de nos na TreeView;
- background refresh das informacoes de PR/MR;
- virtualizacao de listas longas.

Criterios de aceite:

- extensao permanece responsiva em repositorios com milhares de commits;
- consumo de memoria e controlado.

## Estrategia de Testes

Cobertura esperada:

- testes unitarios para parse de saida Git;
- testes unitarios para normalizacao de branches, commits e arquivos alterados;
- testes de servicos Git com mocks de execucao;
- testes de cliente GitHub com mocks HTTP;
- testes de integracao da extensao quando a estrutura permitir.

Comandos previstos apos scaffold:

```bash
npm test
npm run lint
npm run compile
```

Scripts atuais:

```bash
npm run compile
npm test
```

Ainda nao ha script de lint configurado.

## Publicacao

Processo esperado:

- criar README publico da extensao;
- adicionar GIFs ou imagens de demo;
- criar icone;
- configurar `CHANGELOG.md`;
- configurar telemetria opcional com endpoint e politica de dados minimos;
- empacotar com `vsce package`;
- publicar com `vsce publish`.

## Riscos e Mitigacoes

- Saidas do Git variam por versao/localidade: usar formatos Git estaveis e parseaveis.
- Repositorios grandes podem ficar lentos: introduzir lazy loading e cache nas fases 5 e 6.
- GitHub API pode falhar ou exigir autenticacao: separar modo Git local do modo GitHub.
- Diffs complexos podem ser dificeis de renderizar: preferir recursos nativos do VS Code no MVP.
