# Fluxo de Revisão por Git

## Objetivo

Adicionar uma área de revisão baseada em alterações vindas do Git, permitindo que o usuário escolha uma referência de PR, branch ou commit, visualize os arquivos alterados em tela e registre comentários vinculados ao arquivo, linha e commit.

## Fluxo principal

```text
Usuário abre a extensão
  ↓
Acessa Git Review
  ↓
Sistema carrega contexto Git
  ↓
Lista branch atual, base, commits e arquivos alterados
  ↓
Usuário seleciona commit ou arquivo
  ↓
Sistema mostra conteúdo do arquivo e diff
  ↓
Usuário escolhe linha do arquivo
  ↓
Usuário escreve comentário
  ↓
Comentário é salvo na sessão de review
  ↓
Histórico, telemetria e rastreabilidade são atualizados
```

## Funcionalidades adicionadas

### 1. Nova tela `Git Review`

A sidebar agora possui a opção `Git Review`, dedicada ao fluxo de revisão baseado em Git.

A tela mostra:

- branch origem;
- branch base;
- total de arquivos alterados;
- total de comentários da sessão;
- lista de arquivos alterados;
- lista de commits recentes;
- conteúdo do arquivo selecionado;
- diff do arquivo;
- formulário de comentário inline.

## 2. Visualização de arquivos alterados

O usuário pode selecionar um arquivo vindo do diff Git.

A interface exibe:

- conteúdo do arquivo;
- numeração de linhas;
- linha selecionável;
- botão para abrir o arquivo no editor real do VS Code;
- botão para abrir o diff.

## 3. Comentário vinculado ao código

Cada comentário é salvo com:

- arquivo;
- linha;
- commit;
- autor;
- corpo do comentário;
- thread;
- histórico de edição.

## 4. Backend VS Code

Foi adicionado o evento:

```ts
loadGitFile
```

Ele carrega:

- conteúdo do arquivo no commit selecionado usando `git show`;
- fallback para arquivo atual do workspace;
- diff usando `git diff`;
- fallback para `git diff --cached`.

## 5. Aderência ao design

A funcionalidade segue as imagens de `docs/design/UI/`, especialmente:

- painel lateral de alterações;
- visualização central do arquivo;
- diff contextual;
- comentários no lado direito;
- fluxo reviewer/developer;
- navegação por PR/commit/arquivo.

## Resultado esperado

A extensão passa a permitir uma revisão mais próxima de ferramentas como GitHub PR, GitLens, SonarQube e IDEs modernas, mantendo o foco em arquitetura, conformidade e rastreabilidade.
