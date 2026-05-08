# Fluxo de Implementacao para IA - Extensao de Code Review

Este documento define o processo obrigatorio para uma IA implementar novas funcionalidades, ferramentas ou alteracoes relevantes no codigo da extensao de Code Review.

## Regra principal

A IA deve seguir esta ordem:

1. Definir ou localizar a regra de negocio.
2. Criar ou atualizar os testes com base na regra aprovada.
3. Implementar a funcionalidade.
4. Executar validacoes.
5. Sincronizar documentacao.

Se a regra de negocio nao existir e nao puder ser inferida com seguranca, a IA deve interromper o trabalho com erro claro e pedir definicao ao usuario antes de criar testes ou alterar codigo.

## Etapa 1: regra de negocio

Antes de qualquer alteracao tecnica, a IA deve identificar:

- qual problema de review, validacao, correcao, revalidacao, UI, telemetria ou performance sera resolvido;
- qual comportamento esperado;
- quais entradas sao aceitas;
- quais saidas, eventos ou efeitos sao esperados;
- quais casos invalidos devem ser rejeitados;
- quais limites, excecoes ou fallbacks existem;
- qual impacto em historico auditavel, severidade e aprovacao de PR.

A IA deve procurar a regra em:

- `docs/BUSINESS_RULES.MD`;
- `docs/design/VALIDATION_SYSTEM.md`;
- `docs/design/PULL_REQUEST_REVIEW.md`;
- `docs/ARQUITECTURE.md`;
- `docs/PERFORMACE.md`;
- `docs/ROADMAP.md`;
- testes existentes;
- codigo relacionado;
- mensagens explicitas do usuario.

Se a regra estiver ausente, ambigua ou contraditoria, interrompa com erro:

```text
Erro: regra de negocio ausente ou ambigua. Nao e seguro criar testes ou implementar sem definicao do comportamento esperado.
```

Depois, peça ao usuario a regra necessaria.

## Aprovação da etapa 1

Antes de avancar para testes em mudancas de comportamento, a IA deve mostrar ao usuario:

- a regra de negocio encontrada ou proposta;
- os arquivos que provavelmente serao afetados;
- o plano de alteracao de codigo ou documentacao;
- os riscos conhecidos.

A IA so deve avancar apos aprovacao explicita do usuario quando a mudanca envolver regra de negocio, persistencia, historico, aprovacao de PR ou codigo de producao.

## Etapa 2: testes

Com a regra de negocio aprovada, a IA deve criar ou atualizar testes antes da implementacao.

Os testes devem cobrir:

- caso feliz;
- entradas invalidas;
- limites relevantes;
- fallback ou erro esperado, quando houver;
- regressao relacionada a regra;
- preservacao de historico, quando aplicavel;
- regras de bloqueio por severidade, quando aplicavel.

Priorize:

- testes unitarios para dominio e regras;
- testes de aplicacao para casos de uso;
- testes de integracao para Git, persistencia e comunicacao extension host/webview;
- testes de UI para fluxos da webview.

## Aprovação da etapa 2

Antes de implementar, a IA deve mostrar ao usuario:

- quais testes serao criados ou alterados;
- qual regra cada teste valida;
- quais arquivos de teste serao modificados;
- quais comandos serao usados para executar a validacao.

A IA so deve avancar para implementacao apos aprovacao explicita quando esse checkpoint for exigido pelo usuario ou pelo risco da mudanca.

## Etapa 3: implementacao

Somente depois dos testes definidos, a IA deve alterar o codigo da funcionalidade.

A implementacao deve:

- seguir Clean Architecture e a organizacao modular definida em `docs/ARQUITECTURE.md`;
- manter dominio independente de UI, VS Code API e persistencia;
- manter a alteracao no menor escopo possivel;
- evitar refatoracoes nao solicitadas;
- preservar compatibilidade com dados locais;
- tratar erros de forma clara para o usuario;
- respeitar as diretrizes de performance de `docs/PERFORMACE.md`.

## Verificacao final

Após implementar, a IA deve executar os testes aplicaveis e, quando houver UI, validar o fluxo manual principal.

Comandos padrao devem ser descobertos no projeto, especialmente em `package.json`, scripts de CI ou documentacao existente.

## Resultado esperado da IA

Ao final, a IA deve informar:

- regra de negocio implementada;
- testes criados ou alterados;
- arquivos de producao alterados;
- documentos sincronizados;
- comandos executados;
- resultado dos testes;
- limitacao ou risco residual.

## Restricoes

A IA nao deve:

- implementar funcionalidade sem regra de negocio definida;
- criar testes depois da implementacao, salvo correcao explicita de teste quebrado;
- alterar codigo de producao antes de entender arquitetura e regras;
- ampliar escopo sem consultar o usuario;
- remover historico ou comportamento existente sem aprovacao;
- ignorar falha de teste;
- bloquear a UI com operacoes pesadas.
