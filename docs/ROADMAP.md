# ROADMAP — Extensão de Code Review

## Legenda

* [ ] Não iniciado
* [x] Concluído
* [~] Em andamento

# Visão Geral

Este roadmap define a evolução planejada da extensão de Code Review integrada ao VS Code.

Objetivos principais:

* melhorar produtividade do reviewer;
* reduzir carga cognitiva;
* padronizar validações arquiteturais;
* aumentar rastreabilidade;
* registrar histórico técnico;
* fornecer métricas e telemetria.

---

# Fase 1 — Fundação do Sistema

## Objetivo

Construir a base estrutural da extensão.

---

## Funcionalidades

### Integração VS Code

* [x] Inicialização da extensão
* [x] Sidebar principal
* [x] Registro de comandos
* [x] Atalhos padrão
* [x] Webview principal
* [x] Persistência local

---

### Integração Git

* [x] Leitura de branch atual
* [x] Identificação de PR
* [x] Comparação de diffs
* [x] Navegação por commits
* [x] Navegação por arquivos alterados

---

### Estrutura Base

* [x] Arquitetura modular
* [x] Separação frontend/backend
* [x] Sistema de eventos
* [x] Sistema de estado
* [x] Configuração inicial

---

# Fase 2 — Sistema de Review

## Objetivo

Permitir criação e gerenciamento de sessões de revisão.

---

## Funcionalidades

### Sessões de Review

* [x] Criar review session
* [x] Abrir review existente
* [x] Listar reviews
* [x] Timeline da revisão
* [x] Status da revisão

---

### Navegação

* [x] Navegação por commit
* [x] Navegação por diff
* [x] Navegação por arquivos
* [x] Navegação por comentários
* [x] Navegação por validações

---

### Comentários

* [x] Inserir comentário
* [x] Editar comentário
* [x] Histórico de comentários
* [x] Threads de discussão
* [x] Comentários vinculados ao código

---

# Fase 3 — Sistema de Validações

## Objetivo

Registrar não conformidades e permitir revalidação.

---

## Funcionalidades

### Validation Findings

* [x] Criar validação
* [x] Definir severidade
* [x] Definir status
* [x] Associar arquivo e linha
* [x] Associar commit

---

### Status

* [x] NEEDS_CHANGES
* [x] FIXED
* [x] APPROVED
* [x] REOPENED

---

### Correções

* [x] Registrar tentativa de correção
* [x] Histórico de correções
* [x] Revalidação
* [x] Reabertura de finding

---

# Fase 4 — UX/UI Avançada

## Objetivo

Melhorar experiência visual e produtividade.

---

## Funcionalidades

### Material Design 3

* [x] Implementação M3
* [x] Tokens visuais
* [x] Tipografia
* [x] Sistema de cores
* [x] Elevação

---

### Componentes

* [x] Cards
* [x] Chips
* [x] Badges
* [x] Tabs
* [x] Timeline
* [x] Snackbar
* [x] Tooltips

---

### Experiência de Uso

* [x] Navegação reduzida
* [x] Feedback em tempo real
* [x] Loading states
* [x] Skeleton loading
* [x] Animações suaves

---

# Fase 5 — Métricas e Telemetria

## Objetivo

Registrar dados de qualidade arquitetural.

---

## Funcionalidades

### Métricas

* [x] Score de qualidade
* [x] Frequência de erros
* [x] Taxa de reincidência
* [x] Tempo médio de correção
* [x] Quantidade de findings

---

### Dashboards

* [x] Dashboard geral
* [x] Dashboard arquitetural
* [x] Dashboard por reviewer
* [x] Dashboard por desenvolvedor
* [x] Histórico temporal

---

### Coleta de Dados

* [x] Eventos de validação
* [x] Eventos de correção
* [x] Eventos de aprovação
* [x] Eventos de reabertura
* [x] Persistência analítica

---

# Fase 6 — Regras Arquiteturais

## Objetivo

Automatizar validações técnicas.

---

## Funcionalidades

### SOLID

* [x] Verificação SRP
* [x] Verificação OCP
* [x] Verificação LSP
* [x] Verificação ISP
* [x] Verificação DIP

---

### Clean Architecture

* [x] Dependência incorreta
* [x] Violação de camadas
* [x] Dependência circular
* [x] Acoplamento excessivo

---

### DDD

* [x] Bounded Context
* [x] Entidades
* [x] Value Objects
* [x] Serviços de domínio

---

# Fase 7 — Inteligência Assistida

## Objetivo

Auxiliar reviewer e desenvolvedor.

---

## Funcionalidades

### Sugestões Inteligentes

* [x] Sugestão de correção
* [x] Sugestão arquitetural
* [x] Sugestão de refatoração
* [x] Explicação da violação

---

### Histórico Inteligente

* [x] Buscar erros recorrentes
* [x] Detectar padrões
* [x] Comparar revisões antigas
* [x] Recomendação automática

---

# Fase 8 — Colaboração

## Objetivo

Melhorar fluxo entre reviewer e desenvolvedor.

---

## Funcionalidades

### Comunicação

* [x] Threads colaborativas
* [x] Menções
* [x] Notificações
* [x] Histórico compartilhado

---

### Workflow

* [x] Aprovação parcial
* [x] Aprovação por módulo
* [x] Aprovação por arquivo
* [x] Bloqueio de merge

---

# Fase 9 — Persistência e Auditoria

## Objetivo

Garantir rastreabilidade completa.

---

## Funcionalidades

### Auditoria

* [x] Histórico imutável
* [x] Registro de ações
* [x] Registro de usuário
* [x] Registro temporal

---

### Persistência

* [x] Banco local
* [x] Sincronização remota
* [x] Exportação de dados
* [x] Backup

---

# Fase 10 — Performance

## Objetivo

Garantir escalabilidade e fluidez.

---

## Funcionalidades

### Otimizações

* [x] Virtualização de listas
* [x] Cache local
* [x] Lazy loading
* [x] Renderização incremental
* [x] Processamento assíncrono

---

# Fase 11 — Integrações Futuras

## Objetivo

Expandir ecossistema.

---

## Funcionalidades

### Plataformas

* [~] GitHub
* [~] GitLab
* [~] Azure DevOps
* [~] Bitbucket

---

### Sistemas

* [~] Jira
* [~] Linear
* [~] Slack
* [~] Discord

---

# Backlog Futuro

## Estudos

* [ ] IA para análise arquitetural
* [ ] Análise semântica de código
* [ ] Sugestão automática de testes
* [ ] Predição de risco arquitetural

---

# Critérios de Qualidade

## Requisitos obrigatórios

* UI consistente;
* UX fluida;
* Baixa latência;
* Histórico rastreável;
* Navegação rápida;
* Compatibilidade com VS Code.

---

# Critérios de Sucesso

| Objetivo                             | Meta |
| ------------------------------------ | ---- |
| Redução de tempo de review           | 40%  |
| Redução de retrabalho                | 30%  |
| Aumento de conformidade arquitetural | 50%  |
| Melhoria de rastreabilidade          | 100% |
| Cobertura de validações              | 90%  |

---

# Tecnologias Planejadas

## Frontend

* React
* JavaScript/JSX na Webview
* TypeScript no Extension Host
* Material Design 3
* componentes React próprios
* hooks React para estado local

---

## Backend

* Node.js
* VS Code Extension API

---

## Persistência

* JSON local versionado no `globalStorage`
* backup local
* sincronização remota simulada

---

# Arquitetura Planejada

```text
VS Code Extension
├── Webview UI
├── Review Engine
├── Validation Engine
├── Telemetry Engine
├── Persistence Engine
└── Git Integration
```

## Fase 12 — Onboarding e Tutoriais Guiados

- [x] Mostrar onboarding para novos usuários.
- [x] Escurecer a tela durante o tutorial.
- [x] Destacar botões, campos e áreas importantes.
- [x] Exibir balão explicativo por etapa.
- [x] Permitir navegação com Próximo, Voltar, Pular e Concluir.
- [x] Persistir conclusão do onboarding em `localStorage`.
- [x] Permitir reabrir o tutorial pelo menu lateral.
- [x] Criar documentação em `docs/ONBOARDING_TOURS.md`.
- [x] Preparar estrutura para novos tutoriais dentro da aplicação.
