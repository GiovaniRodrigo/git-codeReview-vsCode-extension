# Fluxo Central: Code Review com Comentários Públicos

## Objetivo

A extensão passa a tratar o comentário no código como a unidade central do produto. O review deixa de ser apenas um dashboard e passa a seguir este fluxo principal:

```text
PR / Commit / Sessão de Review
  ↓
Arquivos alterados são carregados pelo Git
  ↓
Arquivo ou diff é mostrado na tela
  ↓
Reviewer adiciona comentário vinculado a arquivo, linha e commit
  ↓
Comentário é publicado na sessão para todos os participantes
  ↓
Score e status da sessão são recalculados com base nos comentários
  ↓
Problems e Test Explorer do VS Code entram como evidências de revisão
```

## Comentário público

Cada comentário registrado possui:

- arquivo;
- linha;
- commit;
- autor;
- severidade;
- status;
- thread;
- histórico de edição;
- flag pública para a sessão.

Status disponíveis do comentário:

- `OPEN`
- `NEEDS_CHANGES`
- `RESOLVED`
- `APPROVED`

Severidades disponíveis:

- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

## Cálculo de status da sessão

O status da sessão passa a ser recalculado com base nos comentários abertos:

```text
Sem comentários abertos → APPROVED
Comentário crítico aberto → REOPENED
Comentário alto ou ajuste solicitado → NEEDS_CHANGES
Comentário aberto sem bloqueio → IN_REVIEW
```

## Cálculo de score

O score passa a considerar comentários e findings:

```text
Comentário crítico: penalidade alta
Comentário alto: penalidade média-alta
Comentário médio: penalidade média
Comentário baixo: penalidade baixa
Comentário resolvido/aprovado: reduz a penalidade
Finding arquitetural: mantém penalidade técnica existente
Reabertura: aumenta penalidade
```

## Integração com VS Code

A extensão agora coleta o contexto real do VS Code:

### Problems

Usa `vscode.languages.getDiagnostics()` para listar problemas ativos do workspace:

- arquivo;
- linha;
- severidade;
- mensagem;
- origem.

Esses problemas aparecem em um painel próprio e podem abrir o arquivo diretamente no VS Code.

### Test Explorer

A extensão verifica comandos de teste disponíveis no VS Code e adiciona ação para solicitar execução via `testing.runAll`.

O estado da última solicitação é salvo no workspace da extensão.

### Editor

Comentários vinculados ao arquivo ativo são destacados com decorations e hover no editor real do VS Code.

## Telas afetadas

- Git Review
- Comentários
- Dashboard
- Rightbar
- Painel VS Code: Problems e Testes
- Score de Qualidade
- Status da Sessão

## Resultado esperado

A lógica principal passa a ser:

> O review nasce dos comentários no código. O score e o status da sessão nascem desses comentários, somados às evidências do VS Code, como Problems e Testes.
