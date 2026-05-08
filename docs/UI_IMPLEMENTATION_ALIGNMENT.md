# Adequações UI/UX implementadas

## Objetivo
Aproximar a aplicação atual das referências em `docs/design/UI/`, reforçando hierarquia visual, histórico, contenção de conteúdo, dashboard executivo e experiência de onboarding.

## Alterações principais

### Dashboard
- Adicionado bloco executivo de score arquitetural.
- Adicionados indicadores de status da revisão, reincidência e arquivos alterados.
- Cards de métricas receberam barra de destaque por categoria.
- Hierarquia visual aproximada do design Material Design 3.

### Diff inteligente
- Criado painel de preview de impacto arquitetural por camada.
- Arquivos alterados agora aparecem associados a camada, regra e risco.
- Primeiro item crítico recebe destaque visual para orientar a revisão.

### Histórico
- Adicionada barra de filtros visuais.
- Histórico agora usa layout em duas colunas: sessões e timeline da sessão atual.
- Listas longas usam rolagem interna controlada.
- Timeline recebeu linha vertical e marcadores visuais.

### Onboarding
- Popover limitado ao viewport.
- Spotlight mantém z-index alto, portal global e contorno visual.
- Tooltip continua com suporte a scroll automático, Enter, Shift+Enter e ESC.

### Contenção visual
- Tabelas agora possuem wrapper com overflow controlado.
- Conteúdo extenso permanece limitado às bordas.
- Textos longos em arquivos, badges, cards e painéis usam ellipsis ou quebra segura.

## Validação
- `npm run compile`: aprovado.
- `npm test`: 27 testes passaram, 0 falhas.
