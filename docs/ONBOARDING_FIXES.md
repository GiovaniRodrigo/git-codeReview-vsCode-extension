# Correções do Onboarding Guiado

## Problema corrigido

A ferramenta de onboarding apresentava desalinhamento visual no VS Code Webview:

- destaque deslocado do elemento real;
- overlay escurecendo o próprio item destacado;
- tooltip sem tratamento adequado de bordas da viewport;
- camada visual com `z-index` baixo para o ambiente do VS Code;
- medição feita antes do scroll terminar.

## Alterações aplicadas

### 1. Renderização via portal

O componente `GuidedTour` agora é renderizado em `document.body` usando `createPortal`, evitando clipping dentro do layout principal.

### 2. Spotlight corrigido

O overlay escuro passou a ser criado pelo `box-shadow` do spotlight, deixando o elemento alvo visualmente livre.

### 3. Z-index reforçado

As camadas do onboarding agora usam valores altos para ficarem acima dos painéis do Webview.

### 4. Medição após scroll

O componente agora executa `scrollIntoView`, aguarda a estabilização visual e depois mede o alvo com `getBoundingClientRect`.

### 5. Tooltip com proteção de viewport

O cálculo de posição foi ajustado para evitar que o balão saia da tela. Quando não houver espaço à direita ou acima, ele reposiciona automaticamente.

### 6. Melhorias de UX

Foram adicionados:

- tecla `ESC` para sair;
- tecla `Enter` para avançar;
- `Shift + Enter` para voltar;
- animação suave do spotlight;
- seta visual no tooltip;
- clique no fundo para pular o tour.

## Arquivos alterados

- `webview-ui/src/main.jsx`
- `webview-ui/src/styles.css`
- `webview-ui/dist/assets/index.js`
- `webview-ui/dist/assets/index.css`
