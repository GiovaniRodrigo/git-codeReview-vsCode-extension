# Correção do fluxo Git Review: clique em commits e abertura de arquivos

## Problema corrigido

Ao clicar em um commit, em **Abrir no VS Code** ou em **Abrir diff**, o conteúdo do arquivo não era exibido corretamente.

A causa principal era que a interface mudava apenas o hash do commit selecionado, mas mantinha a lista de arquivos baseada no `git diff HEAD`. Quando o arquivo selecionado não existia naquele commit, o viewer ficava sem conteúdo útil.

## Correções aplicadas

- O clique em um commit agora solicita à extensão a lista real de arquivos alterados naquele commit.
- A lista lateral de arquivos passa a ser atualizada com os arquivos do commit selecionado.
- O primeiro arquivo do commit é selecionado automaticamente.
- O painel central carrega imediatamente:
  - conteúdo do arquivo no commit;
  - diff correspondente ao commit;
  - estado visual de carregamento.
- Os botões **Abrir no VS Code** e **Abrir diff** também atualizam o painel central antes de abrir o documento externo.
- A leitura do diff agora usa o commit informado no comando `git show --patch <commit> -- <file>`.

## Fluxo corrigido

```text
Usuário clica em commit
  ↓
Webview envia loadCommitFiles
  ↓
Extensão executa git diff-tree/show/diff
  ↓
Webview recebe commitFilesLoaded
  ↓
Lista de arquivos é atualizada
  ↓
Primeiro arquivo é carregado
  ↓
Painel central exibe conteúdo + diff
```

## Resultado esperado

Agora o usuário consegue revisar alterações vindas do Git com base em:

- commit;
- arquivo alterado;
- conteúdo do arquivo;
- diff;
- comentário inline vinculado ao arquivo, linha e commit.
