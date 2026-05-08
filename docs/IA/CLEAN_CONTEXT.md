# CLEAN_CONTEXT: Code Review Extension

## 1. Visao Geral e Objetivo

**Dominio:** extensao de produtividade para VS Code focada em Git, GitHub, GitLab e code review.

**Objetivo:** permitir que desenvolvedores visualizem branches, commits, tags, alteracoes, diffs, pull requests, merge requests e comentarios de review diretamente no VS Code.

**Stack alvo:** TypeScript, VS Code Extension API, Git CLI/local repository, GitHub REST API, GitLab REST API, Webview API, TreeView API, testes automatizados com a stack padrao de extensoes VS Code.

**Estado atual:** Roadmap implementado localmente ate empacotamento VSIX. Ha scaffold de extensao VS Code em TypeScript, TreeView no container de Source Control, servicos Git locais, provider de conteudo para diff nativo, Webview de review, integracao GitHub com PRs/checks/review actions, produtividade local, cache, background refresh, artefatos de publicacao e testes unitarios.

## 2. Entidades Core

### Repository

- `rootPath`: caminho do repositorio aberto no VS Code.
- `remotes`: lista de remotes Git configurados.
- `isGitRepository`: indica se o workspace atual possui `.git`.
- `gitTree`: branch atual, HEAD, upstream, ahead/behind e contadores da working tree.

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
- `risk`: nivel local e explicavel usado para priorizar revisao.

### ChangedFile

- `path`: caminho do arquivo no repositorio.
- `status`: adicionado, modificado, removido, renomeado ou copiado.
- `additions`: linhas adicionadas.
- `deletions`: linhas removidas.
- `category`: source, test, config, docs, dependency, asset ou other.
- `risk`: low, medium ou high.
- `reviewReason`: motivo curto para priorizacao no painel.
- `reviewed`: indica se o arquivo ja foi marcado como revisado localmente.

### PullRequest / MergeRequest

- `number`: numero do PR/MR no GitHub/GitLab.
- `title`: titulo.
- `state`: aberto, fechado, mergeado ou draft.
- `branch`: branch de origem.
- `baseBranch`: branch de destino.
- `checks`: status de CI quando disponivel.
- `actions`: acoes permitidas (approve, comment, request changes/reject).

### AIAssistance (Opcional)

- `enabled`: indica se o usuario ativou auxilio de IA.
- `provider`: Codex, Copilot ou outro LLM configurado.
- `capabilities`: resumo de PR, analise de diff, sugestao de review.

## 3. Regras Inegociaveis

| ID | Regra | Restricao |
| --- | --- | --- |
| RN01 | Git local primeiro | O MVP deve funcionar usando Git local antes de depender de GitHub/GitLab. |
| RN02 | Workspace Git obrigatorio | Funcionalidades Git devem tratar claramente a ausencia de repositorio aberto. |
| RN03 | Leitura antes de escrita | A extensao deve priorizar navegacao e visualizacao antes de permitir comentarios ou acoes de review. |
| RN04 | Integracao VS Code nativa | Diffs devem abrir usando recursos do VS Code sempre que possivel. |
| RN05 | Falhas explicitas | Erros de Git, autenticacao ou API devem ser exibidos de forma clara ao usuario. |
| RN06 | Escopo incremental | Cada fase deve entregar valor isolado e validavel antes da proxima fase. |
| RN07 | IA Opcional | Qualquer integracao com IA externa deve ser opcional e exigir acao explicita do usuario. |

## 4. Padroes de Implementacao

**Arquitetura alvo:** camadas simples por responsabilidade, evitando acoplamento direto entre UI, Git local, GitHub e GitLab APIs.

Camadas principais:

- `src/extension.ts`: ativacao da extensao, registro de comandos e providers.
- `src/git/`: comandos Git locais e normalizacao de dados.
- `src/github/`: autenticacao e chamadas para GitHub REST API.
- `src/gitlab/`: autenticacao (SecretStorage) e chamadas para GitLab REST API.
- `src/ai/`: (Novo) Integracao com Codex/Copilot/LLMs para auxilio no review.
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
- `src/git/branchService.ts`: listagem local/remota, tags e atualizacao de branches remotas via fetch/prune.
- `src/git/repositoryService.ts`: leitura de informacoes da git tree para contexto do repositorio.
- `src/tree/`: provider e nodes da TreeView.
- `src/review/`: provider de documentos virtuais para diff.
- `src/review/reviewPanel.ts`: Webview de review com metadata, estatisticas, filtros, busca e selecao multipla.
- UI: TreeView, filtros, metricas e acoes devem expor tooltips contextuais.
- `src/review/reviewModel.ts`: agregacao de commits para o painel de review, incluindo categoria, risco e motivo de priorizacao.
- `src/review/diffRenderer.ts`: diff estilo GitHub em Webview.
- `src/github/`: deteccao de remote GitHub, autenticacao Octokit, PRs, checks e review actions.
- `src/gitlab/`: deteccao de remote GitLab, token via SecretStorage e listagem de Merge Requests.
- `src/productivity/`: historico local de commits e arquivos revisados, identificadores de progresso e comandos de produtividade.
- `src/productivity/reviewProcess.ts`: armazenamento local de processos de code review salvos, retomaveis e concluiveis.
- `src/productivity/compareModel.ts`: modelo de comparacao branch-a-branch com totais e arquivos ordenados por impacto.
- `src/productivity/comparePanel.ts`: Webview interativo para comparar branches e abrir diffs por arquivo.
- `src/telemetry/`: telemetria opcional, desativada por padrao, enviada via POST para endpoint configuravel.
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
