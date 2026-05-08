# Project Template: Context-Driven Development

Este é um modelo de repositório genérico projetado para maximizar a eficiência de desenvolvimento assistido por IA e garantir a consistência arquitetural através de documentação viva e fluxos de trabalho rigorosos.

## Estrutura do Repositório

```text
.
├── docs/                       # Documentação técnica e de produto
│   ├── IA/                    # Contexto específico para o Agente de IA
│   │   ├── CLEAN_CONTEXT.md   # Visão geral, stack e entidades core
│   │   ├── AI_FEATURE_WORKFLOW.md # Protocolo de implementação (Regra -> Teste -> Código)
│   │   ├── IMPLEMENTATION_PLAN.md # Roadmap técnico e fases atuais
│   │   └── RAG_IMPLEMENTATION.md  # Instruções de persona e fluxo de recuperação
│   └── images/                # Screenshots e assets de design
├── src/                        # Código fonte do projeto (MDC)
├── test/                       # Suite de testes unitários
├── package.json                # Configurações e dependências
├── tsconfig.json               # Configuração TypeScript
└── GEMINI.md                   # Instruções fundamentais para o Agente Gemini CLI
```

## Vantagens do CDD (Context-Driven Development)

1.  **Redução Drástica de Alucinações:** Ao fornecer um `CLEAN_CONTEXT.md` destilado, a IA não precisa adivinhar a arquitetura ou as regras, baseando suas decisões em dados reais e atualizados.
2.  **Qualidade de Código por Mandato:** O workflow obriga a criação de testes antes da implementação, garantindo que toda nova funcionalidade seja verificável e resiliente a regressões.
3.  **Agnosticismo Tecnológico:** O modelo foca em processos e lógica de negócio, funcionando perfeitamente seja em projetos Python, JavaScript, Rust, Go ou qualquer outra stack.
4.  **Documentação Sempre Viva:** A IA é instruída a manter os documentos de contexto atualizados a cada mudança, resolvendo o problema crônico de documentação técnica defasada.
5.  **Onboarding Instantâneo de IAs:** Novos agentes ou subagentes inseridos no projeto entendem o sistema em segundos ao lerem a pasta `docs/IA/`.
6.  **Segurança e Consistência:** Regras de negócio inegociáveis são centralizadas, impedindo que mudanças técnicas violem premissas fundamentais do produto.

## Como Usar Este Modelo
## Como Usar Este Modelo

1. **Inicialização**: Copie a estrutura de pastas para o seu novo projeto.
2. **Configuração de Contexto**:
   - Preencha o `docs/IA/CLEAN_CONTEXT.md` com a stack e objetivos do seu projeto.
   - Revise o `docs/IA/AI_DEVELOPMENT_PRINCIPLES.md` para alinhar a mentalidade de uso de IA.
   - Defina o roadmap inicial no `docs/IA/IMPLEMENTATION_PLAN.md`.
3. **Fluxo de Trabalho**:
   - Sempre que solicitar uma nova funcionalidade, o Agente seguirá o `AI_FEATURE_WORKFLOW.md`.
   - O Agente usará o `RAG_IMPLEMENTATION.md` como guia de comportamento.

## Filosofia

- **Documentação como Fonte da Verdade**: O código segue a documentação, e a documentação é atualizada sincronizadamente com o código.
- **Test-Driven AI**: Nenhuma funcionalidade é implementada antes da definição clara da regra de negócio e da criação dos testes correspondentes.
- **Contexto Limpo**: O Agente trabalha com um contexto destilado e atualizado, reduzindo alucinações e erros de arquitetura.
- **IA como Amplificador**: IA acelera execução, refatoração, documentação e automação, mas não substitui arquitetura, testes, debugging, produção e revisão humana.
