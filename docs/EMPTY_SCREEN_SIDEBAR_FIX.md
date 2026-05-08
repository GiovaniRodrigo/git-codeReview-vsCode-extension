# Correção: Tela vazia após redimensionar/ocultar sidebars

## Problema

Após adicionar a funcionalidade de redimensionar e ocultar sidebars, a Webview podia abrir vazia.

## Causa

O componente principal `App` usava os estados abaixo sem inicializá-los:

- `leftSidebarHidden`
- `rightSidebarHidden`
- `leftSidebarWidth`
- `rightSidebarWidth`

Isso causava erro JavaScript em tempo de execução antes da renderização da interface.

## Correção aplicada

Foram adicionados estados iniciais seguros no `App`:

```jsx
const [leftSidebarHidden, setLeftSidebarHidden] = useState(false);
const [rightSidebarHidden, setRightSidebarHidden] = useState(false);
const [leftSidebarWidth, setLeftSidebarWidth] = useState(282);
const [rightSidebarWidth, setRightSidebarWidth] = useState(430);
```

## Resultado

- A tela volta a renderizar normalmente.
- As sidebars iniciam visíveis.
- O usuário pode ocultar/exibir as sidebars.
- O redimensionamento mantém limites mínimos e máximos seguros.
- A área central continua visível.
