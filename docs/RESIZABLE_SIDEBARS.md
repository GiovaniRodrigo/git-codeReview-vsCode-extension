# Sidebars redimensionáveis e ocultáveis

## Objetivo

Permitir que o usuário ajuste o espaço visual da extensão conforme o fluxo de revisão, principalmente quando estiver analisando arquivos, diffs e comentários no painel central.

## Funcionalidades implementadas

- Ocultar/exibir sidebar esquerda.
- Ocultar/exibir painel lateral direito.
- Redimensionar sidebar esquerda por arraste horizontal.
- Redimensionar painel lateral direito por arraste horizontal.
- Manter o painel central responsivo com `minmax(0, 1fr)`.
- Preservar conteúdo dentro das bordas e evitar overflow horizontal.

## Comportamento esperado

### Sidebar esquerda

Usada para navegação entre:

- Dashboard
- Diagnósticos
- Inteligência
- Comentários
- Colaboração
- Git Review
- Conformidades
- Telemetria
- Histórico
- Configurações

Pode ser ocultada para liberar mais espaço ao conteúdo central.

### Painel direito

Usado para:

- score de qualidade
- KPIs
- principais problemas
- ações rápidas
- telemetria

Pode ser ocultado quando o usuário quiser focar no arquivo ou diff.

### Redimensionamento

O usuário pode arrastar a borda interna de cada sidebar para aumentar ou reduzir sua largura.

Limites definidos:

- Sidebar esquerda: mínimo 220px, máximo 420px.
- Sidebar direita: mínimo 300px, máximo 560px.

## Arquivos alterados

- `webview-ui/src/main.jsx`
- `webview-ui/src/styles.css`

## Validação

Executado com sucesso:

```bash
npm run compile
npm test
```

Resultado:

```text
27 testes passaram, 0 falhas
```
