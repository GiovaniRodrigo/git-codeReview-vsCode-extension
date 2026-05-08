# Onboarding e Tutoriais Guiados

## Objetivo

Adicionar uma experiência de entrada para novos usuários da extensão, explicando o fluxo de code review diretamente dentro da aplicação.

## Funcionalidades implementadas

- Exibição automática do onboarding para novos usuários.
- Botão lateral **Ver tutorial guiado** para reabrir o tour a qualquer momento.
- Overlay escurecido sobre a interface.
- Destaque visual do elemento atual.
- Balão explicativo com título, descrição e contador de passos.
- Navegação por **Próximo**, **Voltar**, **Pular** e **Concluir**.
- Persistência local via `localStorage` para não repetir automaticamente após conclusão.
- Suporte a troca automática de tela durante o tutorial, por exemplo, abrindo Configurações antes de explicar backup/sync.

## Passos do tour atual

1. Botão para abrir tutorial guiado.
2. Menu principal lateral.
3. Botão para iniciar revisão.
4. Cards de resumo de qualidade.
5. Tabela de achados da revisão.
6. Painel de comentários.
7. Painel de validações.
8. Ações de persistência, backup e sincronização.

## Como criar novos tutoriais

Os passos ficam em `webview-ui/src/main.jsx`, no array `defaultTourSteps`.

Exemplo:

```jsx
{
  target: 'start-review',
  title: 'Iniciar revisão',
  body: 'Aqui começa a análise da branch ou PR.',
  placement: 'bottom'
}
```

Para destacar um novo elemento, adicione o atributo `data-tour` no componente:

```jsx
<button data-tour="start-review">Executar revisão</button>
```

## Regras de UX

- O usuário nunca deve ficar perdido no primeiro acesso.
- Todo recurso importante deve ter explicação contextual.
- O tutorial deve ser reabrível.
- O tour deve destacar somente um elemento por vez.
- O texto do balão deve ser curto, objetivo e orientado à ação.
