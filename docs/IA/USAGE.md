# Guia de Uso: IA na Extensao de Code Review

Este guia explica como colaborar com agentes de IA neste repositório mantendo consistencia entre codigo, regras de negocio e documentacao.

## 1. Antes de pedir uma mudanca

Descreva o objetivo da mudanca e, quando possivel, indique o fluxo afetado:

- review de PR ou branch;
- navegacao por diff, commit ou arquivo;
- criacao ou atualizacao de finding;
- correcao e revalidacao;
- aprovacao, reabertura ou bloqueio por severidade;
- dashboard, metricas ou telemetria;
- performance da UI, Git, persistencia ou analytics.

## 2. Ciclo de desenvolvimento com IA

### Passo A: Definicao da regra

A IA deve localizar ou propor a regra usando:

- `docs/BUSINESS_RULES.MD`;
- `docs/design/VALIDATION_SYSTEM.md`;
- `docs/design/PULL_REQUEST_REVIEW.md`;
- `docs/ARQUITECTURE.md`;
- `docs/PERFORMACE.md`;
- codigo e testes existentes.

Quando a regra nao estiver clara, a IA deve parar e pedir definicao.

### Passo B: Testes

A IA deve propor ou criar testes antes de implementar comportamento novo. A cobertura deve refletir risco e escopo:

- dominio e regras de negocio;
- casos de uso e orquestracao;
- integracoes com Git, VS Code API e persistencia;
- fluxos de webview quando houver UI.

### Passo C: Implementacao

A IA deve implementar no menor escopo possivel, respeitando:

- Clean Architecture;
- separacao entre presentation, application, domain e infrastructure;
- preservacao de historico auditavel;
- regras de severidade e aprovacao;
- performance assíncrona e incremental.

### Passo D: Validacao e sincronizacao

Ao final, a IA deve executar validacoes disponiveis e atualizar a documentacao afetada em `docs/` e `docs/IA/`.

## 3. Prompts uteis

```text
Atualize docs/IA com base nos documentos atuais de docs/.
```

```text
Siga o workflow de IA para implementar a criacao de ValidationFinding.
```

```text
Verifique se CLEAN_CONTEXT.md ainda esta alinhado com a arquitetura e regras de negocio.
```

```text
Revise a documentacao de IA antes de iniciar a proxima fase do roadmap.
```

## 4. Boas praticas

- Mantenha `CLEAN_CONTEXT.md` curto e operacional.
- Atualize `IMPLEMENTATION_PLAN.md` quando o roadmap ou o estado real mudar.
- Nao permita que findings, revalidacoes ou comentarios percam historico.
- Trate performance como requisito, especialmente para PRs grandes.
- Use IA para acelerar boilerplate, testes, documentacao, refatoracao e analise, mas valide tudo que impacta produto.
