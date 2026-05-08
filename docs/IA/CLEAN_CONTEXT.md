# CLEAN_CONTEXT: Code Review Extension

## 1. Visao Geral e Objetivo

**Dominio:** extensao de produtividade para VS Code focada em Git, GitHub e code review.

**Objetivo:** permitir que desenvolvedores visualizem branches, commits, tags, alteracoes, diffs, pull requests e comentarios de review diretamente no VS Code.

**Stack alvo:** TypeScript, VS Code Extension API, Git CLI/local repository, GitHub REST API, Webview API, TreeView API, testes automatizados com a stack padrao de extensoes VS Code.

**Estado atual:** Roadmap implementado localmente ate empacotamento VSIX. Ha scaffold de extensao VS Code em TypeScript, TreeView no container de Source Control, servicos Git locais, provider de conteudo para diff nativo, Webview de review, integracao GitHub com PRs/checks/review actions, produtividade local, cache, background refresh, artefatos de publicacao e testes unitarios.

## 2. Entidades Core

### Repository

- `rootPath`: caminho do repositorio aberto no VS Code.
- `remotes`: lista de remotes Git configurados.
- `isGitRepository`: indica se o workspace atual possui `.git`.

### Branch

- `name`: nome da branch local ou remota.
- `type`: local ou remote.
- `upstream`: branch remota relacionada, quando existir.
- `headCommit`: commit atual da branch.

### Commit

- `hash`: hash completo ou abreviado.
- `message`: mensagem do commit.
- `author`: nome e email do autor.
- `date`: data do commit.
- `changedFiles`: arquivos alterados no commit.
- `stats`: linhas adicionadas e removidas.

### ChangedFile

- `path`: caminho do arquivo no repositorio.
- `status`: adicionado, modificado, removido, renomeado ou copiado.
- `additions`: linhas adicionadas.
- `deletions`: linhas removidas.

### PullRequest

- `number`: numero do PR no GitHub.
- `title`: titulo do PR.
- `state`: aberto, fechado, mergeado ou draft.
- `branch`: branch de origem.
- `baseBranch`: branch de destino.
- `checks`: status de CI quando disponivel.

### ReviewComment

- `body`: conteudo do comentario.
- `filePath`: arquivo comentado.
- `line`: linha comentada.
- `author`: autor do comentario.
- `state`: comentario existente, pendente ou enviado.

## 3. Regras Inegociaveis

| ID | Regra | Restricao |
| --- | --- | --- |
| RN01 | Git local primeiro | O MVP deve funcionar usando Git local antes de depender de GitHub. |
| RN02 | Workspace Git obrigatorio | Funcionalidades Git devem tratar claramente a ausencia de repositorio aberto. |
| RN03 | Leitura antes de escrita | A extensao deve priorizar navegacao e visualizacao antes de permitir comentarios ou acoes de review. |
| RN04 | Integracao VS Code nativa | Diffs devem abrir usando recursos do VS Code sempre que possivel. |
| RN05 | Falhas explicitas | Erros de Git, autenticacao ou API devem ser exibidos de forma clara ao usuario. |
| RN06 | Escopo incremental | Cada fase deve entregar valor isolado e validavel antes da proxima fase. |

## 4. Padroes de Implementacao

**Arquitetura alvo:** camadas simples por responsabilidade, evitando acoplamento direto entre UI, Git local e GitHub API.

Camadas principais:

- `src/extension.ts`: ativacao da extensao, registro de comandos e providers.
- `src/git/`: comandos Git locais e normalizacao de dados.
- `src/github/`: autenticacao e chamadas para GitHub REST API.
- `src/tree/`: TreeView lateral para branches, commits e arquivos.
- `src/review/`: Webview, renderizacao de diff e fluxo de review.
- `src/utils/`: helpers compartilhados, tratamento de erro e formatadores.
- `test/` ou `src/test/`: testes unitarios e de integracao conforme scaffold da extensao.

**Estilo de codigo:**

- TypeScript com tipos explicitos nos contratos principais.
- Servicos sem dependencia direta de UI quando possivel.
- Comandos Git encapsulados em servicos testaveis.
- Tratamento de erro centralizado o suficiente para mensagens consistentes.
- Mudancas pequenas, alinhadas a fase atual do roadmap.

**Documentacao:** funcionalidades novas devem manter `ROADMAP.md`, `IA/CLEAN_CONTEXT.md` e `IA/IMPLEMENTATION_PLAN.md` sincronizados quando mudarem escopo, arquitetura ou fases.

**Uso de IA:** siga `IA/AI_DEVELOPMENT_PRINCIPLES.md`. IA acelera execucao, mas arquitetura, testes, debugging e validacao continuam exigindo julgamento de engenharia.

## 5. Mapeamento de Arquivos Atuais

- `ROADMAP.md`: roadmap funcional completo da extensao.
- `package.json`: manifesto da extensao, contribuicoes para VS Code e scripts de desenvolvimento.
- `tsconfig.json`: configuracao TypeScript.
- `src/extension.ts`: ativacao da extensao, comandos e TreeView.
- `src/git/`: servicos Git locais, contratos e parsers.
- `src/tree/`: provider e nodes da TreeView.
- `src/review/`: provider de documentos virtuais para diff.
- `src/review/reviewPanel.ts`: Webview de review com metadata, estatisticas, filtros, busca e selecao multipla.
- `src/review/reviewModel.ts`: agregacao de commits para o painel de review.
- `src/review/diffRenderer.ts`: diff estilo GitHub em Webview.
- `src/github/`: deteccao de remote GitHub, autenticacao Octokit, PRs, checks e review actions.
- `src/productivity/`: historico local de commits revisados e comandos de produtividade.
- `assets/`: icone da extensao.
- `CHANGELOG.md`: historico de publicacao.
- `DEMO.md`: roteiro de demonstracao.
- `src/utils/`: formatacao e tratamento de erros.
- `test/`: testes unitarios.
- `IA/README.md`: indice e orientacao da pasta de contexto.
- `IA/CLEAN_CONTEXT.md`: este resumo operacional.
- `IA/IMPLEMENTATION_PLAN.md`: plano tecnico e criterios de aceite.
- `IA/AI_FEATURE_WORKFLOW.md`: fluxo Regra -> Teste -> Codigo.
- `IA/AI_DEVELOPMENT_PRINCIPLES.md`: principios de desenvolvimento com IA.
- `IA/RAG_IMPLEMENTATION.md`: ordem de recuperacao de contexto.
- `IA/GEMINI.md`: instrucoes para agentes compatíveis com Gemini CLI.
- `IA/USAGE.md`: guia pratico para trabalhar com esta documentacao.
