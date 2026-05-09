# Adequação de Responsabilidade dos Menus

## Objetivo

Separar as responsabilidades de cada menu da extensão para evitar sobreposição entre Dashboard, Diagnósticos, Conformidades e Telemetria.

## Correções aplicadas

### Dashboard

Agora o Dashboard atua como visão executiva:

- score geral;
- status da sessão/PR;
- comentários abertos;
- bloqueios gerais;
- arquivos alterados;
- resumo da sessão;
- ações rápidas.

Não exibe tabela detalhada de erros por linha como conteúdo principal.

### Diagnósticos

Agora Diagnósticos atua como visão técnica operacional:

- findings;
- Problems do VS Code;
- testes falhando;
- arquivos/linhas afetados;
- comentários técnicos;
- validações arquiteturais;
- regras violadas.

É a área correta para investigar causa e correção.

### Conformidades

Agora Conformidades mostra apenas evidências positivas:

- práticas atendidas;
- comentários resolvidos/aprovados;
- integração VS Code ativa;
- score rastreável;
- histórico auditável;
- status da sessão.

Não usa mais tabela de violações como conteúdo principal.

### Telemetria

Mantida como área de tendência e agregação histórica:

- reincidência;
- regras mais frequentes;
- tempo médio de correção;
- eventos;
- evolução temporal;
- métricas por reviewer/desenvolvedor.

## Mapa final dos menus

| Menu | Responsabilidade |
|---|---|
| Dashboard | Visão executiva e consolidada |
| Diagnósticos | Problemas técnicos detalhados |
| Git Review | Revisão baseada em PR/commit/branch e arquivos |
| Comentários | Threads públicas vinculadas a arquivo/linha |
| Conformidades | Evidências positivas e aderência |
| Telemetria | Tendências e histórico agregado |
| Histórico | Sessões e timeline de reviews |
| Colaboração | Fluxo reviewer/desenvolvedor |
| Configurações | Operação, persistência e integrações |
