# Adequação do Menu Colaboração

## Objetivo

O menu **Colaboração** foi ajustado para representar o fluxo humano do code review, separando-o de Histórico, Comentários e Dashboard.

## Correções implementadas

- Exibição de papéis claros: reviewer, developer e pessoas mencionadas.
- Indicadores de fluxo: `AGUARDANDO DEV`, `AGUARDANDO REVIEWER`, `BLOQUEADO` e `PRONTO PARA APROVAÇÃO`.
- Pendências agrupadas por pessoa.
- Threads selecionáveis por comentário ou revisão geral.
- Envio de mensagens com `@menção`.
- Visualização das respostas por thread.
- Evidências colaborativas: comentários aguardando resposta, bloqueios de merge e aprovações parciais.
- Layout responsivo e limitado às bordas dos painéis.

## Regra de produto

O menu Colaboração deve responder:

- Quem está revisando?
- Quem precisa corrigir?
- Quem está bloqueando o merge?
- Quem foi mencionado?
- Quais comentários aguardam resposta?
- O que está aguardando developer ou reviewer?

## Diferença em relação ao menu Comentários

- **Comentários**: conteúdo técnico da discussão.
- **Colaboração**: pessoas, papéis, responsabilidades, pendências, aprovações e bloqueios.
