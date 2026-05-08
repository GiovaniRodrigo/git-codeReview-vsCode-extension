# Code Review VS Code Extension

Extensão VS Code com painel central de revisão de código.

Esta versão removeu os elementos falsos do VS Code que estavam dentro da Webview:

- sem topbar fake
- sem explorer fake
- sem editor fake
- sem tabs fake
- sem statusbar fake

A Webview agora mostra apenas a interface própria da extensão:

- leftbar de navegação da revisão
- área central de dashboard/diagnósticos
- rightbar de métricas, problemas e ações rápidas

## Executar

```bash
npm install
npm run compile
code .
```

Depois pressione `F5`.

## Comandos

Use `Ctrl + Shift + P`:

- `Code Review: Abrir Dashboard`
- `Code Review: Iniciar Revisão`
- `Code Review: Abrir Pull Request`

## Observação UX

O editor, Explorer, abas e statusbar devem ser usados do VS Code real. A extensão deve complementar o VS Code, não recriá-lo dentro da Webview.
