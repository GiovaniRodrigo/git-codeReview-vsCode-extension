# Contexto de IA - Extensao de Code Review

Esta pasta concentra o contexto operacional para agentes de IA trabalharem neste repositório sem depender de adivinhacao sobre produto, arquitetura ou regras de negocio.

## Arquivos principais

```text
docs/IA/
├── CLEAN_CONTEXT.md              # Resumo vivo do produto, stack, entidades e regras inegociaveis
├── AI_DEVELOPMENT_PRINCIPLES.md  # Principios de uso responsavel de IA no projeto
├── AI_FEATURE_WORKFLOW.md        # Fluxo Regra -> Teste -> Codigo -> Validacao -> Documentacao
├── IMPLEMENTATION_PLAN.md        # Plano tecnico alinhado ao roadmap real da extensao
├── RAG_IMPLEMENTATION.md         # Ordem de recuperacao de contexto e prioridade entre documentos
├── GEMINI.md                     # Mandatos resumidos para agentes estilo Gemini CLI
└── USAGE.md                      # Guia pratico para usar este contexto com agentes de IA
```

## Fontes de verdade do projeto

- `docs/BUSINESS_RULES.MD`: regras de negocio, entidades, status e severidades.
- `docs/ARQUITECTURE.md`: camadas, modulos, padroes e responsabilidades.
- `docs/ROADMAP.md`: fases planejadas da extensao.
- `docs/PERFORMACE.md`: limites e diretrizes de performance.
- `docs/design/`: fluxos, validacao, UX/UI e Material Design 3.

## Como a IA deve trabalhar

1. Ler `CLEAN_CONTEXT.md`.
2. Aplicar os principios de `AI_DEVELOPMENT_PRINCIPLES.md`.
3. Recuperar regras especificas nos documentos de `docs/`.
4. Seguir `AI_FEATURE_WORKFLOW.md` para qualquer mudanca funcional.
5. Atualizar documentacao quando codigo, arquitetura ou regras mudarem.

## Filosofia

- Documentacao e contexto sao parte do sistema.
- IA acelera execucao, mas nao substitui arquitetura, testes, debugging, revisao humana ou responsabilidade por producao.
- Mudancas devem ser pequenas, rastreaveis, testaveis e sincronizadas com a documentacao.
