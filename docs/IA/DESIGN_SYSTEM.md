# Design System - Code Review Extension

Este documento define os princípios visuais, componentes e diretrizes de interface para a extensão **Code Review Extension**. O objetivo é garantir consistência visual e usabilidade, respeitando a estética nativa do VS Code.

## 1. Princípios Visuais

- **Nativo do VS Code**: Use variáveis CSS do VS Code (`--vscode-*`) para cores e tipografia. Isso garante que a extensão se adapte a qualquer tema (Light, Dark, High Contrast).
- **GitHub-ish**: Para componentes de diff e review, siga a densidade de informação e padrões visuais do GitHub (ex: cores de adição/remoção, bordas arredondadas).
- **Foco em Dados**: Priorize a legibilidade do código e metadados (commits, hashes, autores).
- **Hierarquia Clara**: Use pesos de fonte e cores secundárias para distinguir entre informações primárias (mensagens de commit) e metadados.

## 2. Paleta de Cores (CSS Variables)

Sempre prefira as variáveis nativas. Mapeamento principal:

| Variável Design System | Variável VS Code | Uso |
| --- | --- | --- |
| `--surface` | `--vscode-editor-background` | Fundo principal dos painéis. |
| `--border` | `--vscode-panel-border` | Divisores e bordas de cards. |
| `--muted` | `--vscode-descriptionForeground` | Texto secundário e metadados. |
| `--accent` | `--vscode-button-background` | Botões de ação primária. |
| `--error` | `--vscode-editorError-foreground` | Indicadores de risco alto ou erros. |
| `--warning` | `--vscode-editorWarning-foreground` | Indicadores de risco médio ou avisos. |
| `--success` | `--vscode-testing-iconPassed` | Status de revisado ou sucesso. |

## 3. Tipografia

- **Interface**: Use a fonte padrão do VS Code (`var(--vscode-font-family)`).
- **Código/Diff**: Use a fonte mono do editor (`var(--vscode-editor-font-family)`).
- **Tamanhos**:
  - `h1`: 18px, Semi-bold.
  - `body`: `var(--vscode-font-size)`.
  - `meta/caption`: 11px - 12px.

## 4. Componentes

### Commit Card
- Borda de 1px com raio de 6px.
- Cabeçalho com grid para checkbox, mensagem e status de risco.
- Lista de arquivos interna com bordas divisoras sutis.

### Risk Badge
- Formato pílula (pill-shaped).
- Cores semânticas para High, Medium, Low.
- Bordas coloridas com fundo transparente para um visual moderno.

### Metric Card
- Cards pequenos com valor em destaque (bold) e label secundário.
- Usados para totais de commits, arquivos e linhas alteradas.

### Placeholders (Empty States)
- **Visual**: Centralizado, com ícone (opcional) e texto secundário.
- **Uso**: Quando não há commits, arquivos, remotes ou o repositório não está aberto.
- **Tipografia**: Texto em `--muted`, tamanho padrão.
- **Padding**: Mínimo de 32px vertical para dar "respiro" à interface.

## 5. Layout e Responsividade

- **Grid System**: Use CSS Grid para layouts de tabelas e listas de arquivos.
- **Flexbox**: Use Flex para toolbars e cabeçalhos.
- **Breakpoints**:
  - `< 720px`: Layout de coluna única, filtros empilhados, metadados de commit abaixo da mensagem.

## 6. Boas Práticas de Implementação

- **CSP**: Sempre inclua Content Security Policy restritiva nos Webviews.
- **Nonces**: Use nonces para scripts e estilos inline.
- **Accessibility**: Inclua `aria-label` em botões sem texto e garanta contraste suficiente usando as variáveis do tema.
