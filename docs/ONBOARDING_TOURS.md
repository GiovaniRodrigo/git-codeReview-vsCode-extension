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

1. **Tutorial guiado**: Botão para reabrir o onboarding.
2. **Navegação principal**: Explicação do menu lateral.
3. **Iniciar revisão (Reviewer)**: Abertura da sessão de análise.
4. **Análise Git (Reviewer)**: Navegação por commits e arquivos no Git Review.
5. **Visão Lado a Lado**: Comparação entre Base e Atual no viewer.
6. **Comentário Inline**: Registro de observações técnicas vinculadas ao código.
7. **Diagnósticos (Dev)**: Visualização técnica de Problems e Findings.
8. **Validações e Correções**: Registro formal de não conformidades e tentativas de correção.
9. **Colaboração (Time)**: Threads, menções e bloqueios de merge.
10. **Status e Score**: Visão executiva final no Dashboard.
11. **Persistência e backup**: Ações de exportação e segurança em Configurações.

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
