# Correções para todas as funcionalidades

## Objetivo
Garantir que os botões e fluxos principais da extensão executem ações reais, apresentem feedback ao usuário e não fiquem silenciosos em caso de erro.

## Ajustes aplicados

- Ações rápidas do painel direito agora funcionam:
  - Executar revisão
  - Validar arquitetura/correção
  - Gerar relatório Markdown
  - Abrir comentários
- Links visuais agora executam navegação real:
  - Ver todos
  - Ver dashboard de telemetria
- Navegação de arquivo/diff/comentário agora abre o arquivo no editor real do VS Code.
- Botões de insights agora abrem o arquivo relacionado no editor.
- Exportação de relatório de revisão em Markdown adicionada.
- Erros do backend da extensão agora aparecem no VS Code e no snackbar do Webview.
- Estado do dashboard continua sendo recarregado após ações importantes.
- Build da extensão e build do Webview foram recompilados.

## Validação

Comandos executados com sucesso:

```bash
npm run compile
npm test
```

Resultado dos testes:

```txt
27 testes passaram
0 falhas
```

## Correções visuais adicionais

- A listagem de histórico/sessões agora possui altura máxima e rolagem vertical automática quando a quantidade de itens ultrapassa o padrão visual atual.
- Os cards, painéis, tabelas, botões, listas e textos longos foram limitados ao tamanho da própria borda, evitando vazamento horizontal ou conteúdo fora do container.
- As tabelas usam layout fixo com reticências em células longas.
- Grids principais agora usam `minmax(0, 1fr)` para respeitar o tamanho disponível no Webview do VS Code.
