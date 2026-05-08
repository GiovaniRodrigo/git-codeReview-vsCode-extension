# Guia de Uso: Context-Driven Development (CDD)

Este guia explica como utilizar este modelo de repositório para colaborar de forma eficiente com agentes de IA (como o Gemini CLI), garantindo qualidade de código e documentação sempre atualizada no projeto **Git Code Review Extension**.

## 1. Inicialização do Projeto

Este projeto já está configurado para CDD. Se você estiver começando um novo módulo:

1.  **Garanta a Estrutura:**
    As pastas `docs/IA/` devem conter os arquivos de contexto atualizados.
2.  **Stack do Projeto:**
    A stack atual é **TypeScript, VS Code API, Git**.
3.  **Preencha os Contextos:**
    Mantenha o `docs/IA/CLEAN_CONTEXT.md` sincronizado com a realidade da stack e das entidades core (Review, Commit, File, Branch, Tag).
4.  **Revise os Princípios de IA:**
    Siga `docs/IA/AI_DEVELOPMENT_PRINCIPLES.md` para garantir que o uso de IA amplie sua engenharia sem comprometer a qualidade.

## 2. O Ciclo de Desenvolvimento com IA

Ao solicitar uma nova funcionalidade ou correção para a IA, o fluxo seguido será automaticamente:

### Passo A: Definição da Regra
A IA buscará ou proporá uma regra de negócio em `docs/BUSINESS_RULES/`.
*   **Ação do Usuário:** Validar se a regra proposta reflete o comportamento desejado. Digite `[APROVADO]` para prosseguir.

### Passo B: Criação de Testes
A IA criará os testes (unitários/integração) antes de tocar no código de produção.
*   **Ação do Usuário:** Verificar se os testes cobrem os casos de sucesso e erro. Digite `[APROVADO]` para autorizar a implementação.

### Passo C: Implementação e Sincronização
A IA implementará o código e atualizará os arquivos em `docs/IA/` (especialmente o `CLEAN_CONTEXT.md` e `IMPLEMENTATION_PLAN.md`) para refletir a nova realidade do projeto.

## 3. Comandos Úteis para o Usuário

Ao interagir com a IA, você pode usar comandos diretos para gerenciar o contexto:

*   *"IA, atualize o CLEAN_CONTEXT.md com a nova estrutura de pastas que criamos manualmente."*
*   *"IA, verifique se o IMPLEMENTATION_PLAN.md ainda faz sentido após as mudanças de hoje."*
*   *"IA, siga o workflow para criar a funcionalidade X."*

## 4. Boas Práticas

1.  **Nunca pule o Workflow:** O rigor na etapa de testes é o que impede a degradação do código a longo prazo.
2.  **Documentação é Código:** Trate mudanças nos arquivos de `docs/IA/` com a mesma importância que mudanças no código-fonte.
3.  **Contexto Limpo, Resposta Rápida:** Mantenha o `CLEAN_CONTEXT.md` conciso. Se ele ficar muito grande, mova detalhes técnicos para arquivos específicos e deixe apenas o resumo.
4.  **Agnosticismo:** Mantenha os mandatos do `GEMINI.md` genéricos o suficiente para que, se você mudar de linguagem (ex: de Python para Go), o processo de trabalho continue o mesmo.
5.  **IA Amplifica Engenharia:** Use IA para acelerar boilerplate, CRUDs, documentação, testes, refatorações, scripts e automações, mas valide tudo com revisão, testes e medição quando aplicável.

## 5. Manutenção de Longo Prazo

À medida que o projeto cresce:
- **Revise o Roadmap:** Atualize o `IMPLEMENTATION_PLAN.md` ao final de cada sprint ou marco importante.
- **Pode Regras Obsoletas:** Remova regras de negócio em `docs/BUSINESS_RULES/` que não são mais válidas para evitar confusão no Agente de IA.
- **Revise Produção:** Mantenha deploy, rollback, logs, métricas e alertas documentados para que a IA considere impactos operacionais antes de alterar fluxos críticos.
