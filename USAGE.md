# Guia de Uso

Este documento explica como usar a extensao **Git Code Review Local** no VS Code para navegar branches, commits, arquivos alterados, diffs e Pull Requests.

## Requisitos

- VS Code 1.90.0 ou superior.
- Git instalado e disponivel no ambiente.
- Um workspace aberto contendo pelo menos um repositorio Git.
- Remote GitHub e login no GitHub apenas para recursos de Pull Request.
- Remote GitLab e token (via SecretStorage) apenas para recursos de Merge Request.

## Instalar a Extensao

Instale a extensao pela VS Code Marketplace. Depois da instalacao, abra um repositorio Git no VS Code.

A view `Git Review` aparece dentro do painel Source Control. Se ela nao aparecer imediatamente, abra o painel Source Control e execute o comando `Code Review: Refresh`.

## Abrir a View Git Review

1. Abra um projeto versionado com Git.
2. Abra o painel Source Control do VS Code.
3. Encontre a view `Git Review`.
4. Use o botao de refresh ou o comando `Code Review: Refresh` para recarregar branches, tags, commits e Pull Requests.

A view agrupa branches locais, branches remotas, tags e Pull Requests em uma arvore unica de revisao.

## Revisar Branches, Tags e Commits

Na view `Git Review`, expanda:

- branches locais;
- branches remotas;
- tags;
- expanda `Pull Requests` ou `Merge Requests`, quando houver remote GitHub ou GitLab configurado.

Ao expandir uma branch, tag, PR ou MR, a extensao lista commits recentes. Ao expandir um commit, ela mostra os arquivos alterados naquele commit.

Use as acoes do item para:

- abrir detalhes do commit;
- abrir diff nativo do VS Code;
- abrir diff em estilo GitHub;
- criar ou abrir um processo de review;
- marcar commit como revisado;
- abrir o painel completo de review.

## Atualizar Branches Remotas

Use `Code Review: Fetch Remote Branches` para buscar branches remotas e remover referencias remotas obsoletas.

Esse comando e util quando uma branch foi criada, removida ou atualizada no servidor remoto e ainda nao aparece corretamente na view `Git Review`.

## Usar o Painel de Review

Use `Code Review: Open Review` em uma branch, tag ou commit para abrir a Webview de review.

O painel mostra:

- metadata dos commits;
- estatisticas de linhas adicionadas e removidas;
- arquivos alterados;
- busca por commits;
- filtros por branch, autor, data e arquivos;
- selecao de multiplos commits;
- arquivos revisados e nao revisados;
- prioridade de revisao por categoria de arquivo, nivel de risco e motivo explicavel.

Esse fluxo ajuda a revisar primeiro arquivos de maior risco, como dependencias, configuracoes, remocoes e mudancas grandes em codigo-fonte.

## Salvar e Retomar Reviews

Use `Code Review: Create Review Process` para salvar uma sessao de review.

Depois, use `Code Review: Resume Review Process` para continuar a revisao a partir do ponto salvo. Quando terminar, use `Code Review: Complete Review Process`.

Esse recurso ajuda em revisoes longas ou quando voce precisa alternar entre tarefas sem perder contexto.

## Trabalhar com Pull Requests do GitHub

Para usar recursos do GitHub:

1. Garanta que o repositorio tenha um remote GitHub configurado.
2. Execute `Code Review: Sign In to GitHub`.
3. Atualize a view `Git Review`.
4. Expanda `Pull Requests`.

A extensao pode mostrar:

- estado do PR: aberto, fechado, mergeado ou draft;
- checks e status de CI;
- commits relacionados;
- acoes de review.

Em Pull Requests, use as acoes disponiveis para:

- abrir o PR;
- adicionar comentario geral;
- comentar arquivo ou linha;
- aprovar o PR;
- solicitar mudancas.

## Trabalhar com Merge Requests do GitLab

Para usar recursos do GitLab:

1. Garanta que o repositorio tenha um remote GitLab configurado.
2. Execute `Code Review: Link GitLab`.
3. Forneca um Personal Access Token com acesso de leitura (read_api).
4. Atualize a view `Git Review`.
5. Expanda `Merge Requests`.

A extensao mostra MRs, estados e permite abrir o MR no navegador, alem de acoes de aprovacao e reprovacao (pendente conforme Roadmap).

## Assistência por IA (Planejado)

Quando disponivel, a extensao permite integrar com Codex ou Copilot:

- Ative a assistencia por IA nas configuracoes.
- Use acoes de analise de diff para obter sugestoes e resumos.
- A integracao e estritamente opcional (opt-in).

## Comparar Branches

Use o comando `Code Review: Compare Branches`.

A extensao solicita as branches de origem e destino e abre uma visao de comparacao para inspecionar as diferencas entre elas. Os arquivos listados na comparacao podem ser abertos em diff diretamente pelo VS Code.

## Controlar Commits Revisados

Para manter progresso local de revisao:

- use `Code Review: Mark Commit Reviewed` em um commit;
- use `Code Review: Show Unreviewed Commits` para listar commits ainda nao revisados.

O historico e salvo localmente e ajuda a continuar revisoes longas sem perder contexto.

## Atalhos

| Acao | Windows/Linux | macOS |
| --- | --- | --- |
| Refresh da view | `Ctrl+Alt+R` | `Cmd+Alt+R` |
| Comparar branches | `Ctrl+Alt+C` | `Cmd+Alt+C` |

## Configuracoes

| Configuracao | Padrao | Descricao |
| --- | --- | --- |
| `codeReview.telemetry.enabled` | `false` | Habilita telemetria opcional. |
| `codeReview.telemetry.endpoint` | `""` | Endpoint HTTPS que recebe eventos opcionais de telemetria. Deixe vazio para nao enviar telemetria. |

Por padrao, a telemetria fica desativada.

Quando habilitada, a telemetria envia apenas dados minimos, como nome do comando/evento, timestamp, identificador anonimo da sessao, versao da extensao, versao do VS Code e pequenas propriedades nao sensiveis.

A telemetria nao envia caminhos de repositorio, nomes de branches, hashes de commits, caminhos de arquivos, conteudo de diff, texto de review ou tokens do GitHub.

## Problemas Comuns

Se a view nao listar dados, confirme que o workspace aberto contem um repositorio Git valido.

Se branches remotas estiverem desatualizadas, use `Code Review: Fetch Remote Branches`.

Se Pull Requests nao aparecerem, confirme que o remote aponta para o GitHub e que voce fez login com `Code Review: Sign In to GitHub`.

Se o diff nao abrir, confirme que o commit e o arquivo ainda existem no historico Git local.
