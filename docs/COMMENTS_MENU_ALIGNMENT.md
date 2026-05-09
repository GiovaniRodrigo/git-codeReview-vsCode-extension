# Adequação do Menu Comentários

## Objetivo

O menu **Comentários** foi ajustado para funcionar como a central oficial da discussão técnica do code review.

## Adequações implementadas

- Seleção real do arquivo comentado, sem limitar ao primeiro arquivo da sessão.
- Filtros por status, severidade, arquivo e texto livre.
- Agrupamento visual dos comentários por arquivo.
- Ações diretas para abrir o arquivo no VS Code e abrir o diff do comentário.
- Exibição de thread visível, histórico de edição e comentário público.
- Painel de impacto dos comentários no score da revisão.
- Contenção visual para listas longas com rolagem interna.
- Destaque visual por severidade.

## Papel do menu

O menu Comentários agora concentra:

- discussão técnica pública;
- vínculo arquivo/linha/commit;
- severidade e status;
- rastreabilidade de edição;
- impacto no score e status da sessão.

## Relação com outros menus

- **Dashboard:** consome os comentários para score e status geral.
- **Diagnósticos:** mostra problemas técnicos que podem virar comentários.
- **Git Review:** permite comentar diretamente no arquivo/diff.
- **Inteligência:** usa comentários para detectar recorrência, risco e hotspots.
- **Histórico:** preserva comentários e decisões anteriores.
