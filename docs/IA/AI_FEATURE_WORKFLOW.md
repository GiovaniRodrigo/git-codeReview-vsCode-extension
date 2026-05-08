# Fluxo de Implementacao para IA - Code Review Extension

Este documento define o processo para uma IA implementar novas funcionalidades, ferramentas ou alteracoes relevantes no projeto **Code Review Extension**.

## Regra Principal

A IA deve seguir esta ordem:

1. Entender a fase e a regra de produto.
2. Criar ou atualizar testes quando a estrutura do projeto permitir.
3. Implementar a funcionalidade no menor escopo possivel.
4. Executar validacoes.
5. Sincronizar documentacao afetada.

Se a regra de produto nao existir e nao puder ser inferida com seguranca, a IA deve parar e pedir definicao ao usuario antes de alterar codigo.

## Etapa 1: Regra de Produto

Antes de alterar arquivos, a IA deve identificar:

- qual fase do `ROADMAP.md` sera atendida;
- qual problema do usuario sera resolvido;
- qual comportamento esperado no VS Code;
- quais entradas sao aceitas;
- quais saidas visuais ou efeitos sao esperados;
- quais erros devem ser tratados;
- quais limites e fallbacks existem.

A IA deve procurar contexto em:

- `IA/CLEAN_CONTEXT.md`;
- `ROADMAP.md`;
- `IA/IMPLEMENTATION_PLAN.md`;
- testes existentes, quando houver;
- codigo relacionado, quando houver;
- mensagem mais recente do usuario.

Se a regra estiver ausente, ambigua ou contraditoria, informe:

```text
Erro: regra de produto ausente ou ambigua. Nao e seguro criar testes ou implementar sem definir o comportamento esperado.
```

## Etapa 2: Plano Curto

Antes de mudancas substanciais, a IA deve apresentar ou manter internamente um plano claro com:

- arquivos provavelmente afetados;
- comportamento esperado;
- riscos conhecidos;
- comandos de validacao.

Para tarefas pequenas e objetivas, a IA pode executar diretamente desde que respeite o escopo e valide o resultado.

## Etapa 3: Testes

Quando o projeto ja tiver scaffold de testes, crie ou atualize testes antes de implementar comportamento novo.

Priorize testes para:

- parse de saidas Git;
- deteccao de repositorio Git;
- listagem de branches, tags e commits;
- normalizacao de arquivos alterados;
- associacao branch/PR;
- tratamento de erro de Git, GitHub e autenticacao.

Comandos previstos:

```bash
npm test
npm run lint
npm run compile
```

Se esses comandos ainda nao existirem, registre essa limitacao na resposta final.

## Etapa 4: Implementacao

A implementacao deve:

- seguir a arquitetura de `IA/CLEAN_CONTEXT.md`;
- manter Git local independente de GitHub;
- encapsular execucao Git em servicos;
- separar servicos de dados da UI;
- usar APIs nativas do VS Code para TreeView, comandos, Webview e diff;
- evitar refatoracoes globais nao solicitadas;
- tratar erros com mensagens claras para o usuario.

## Etapa 5: Verificacao Final

Depois de implementar, a IA deve executar as validacoes aplicaveis:

```bash
npm run compile
npm test
npm run lint
```

Quando o projeto ainda nao tiver scripts, a IA deve validar por inspecao e declarar que a automacao ainda nao existe.

## Resultado Esperado da IA

Ao final, informar:

- comportamento implementado;
- arquivos alterados;
- testes criados ou alterados;
- comandos executados;
- resultado das validacoes;
- riscos ou limitacoes residuais.

## Restricoes

A IA nao deve:

- implementar funcionalidade sem comportamento esperado claro;
- acoplar GitHub ao MVP Git local;
- depender de rede para funcionalidades da Fase 1;
- ignorar workspace sem repositorio Git;
- remover comportamento existente sem aprovacao;
- ignorar falha de teste, build ou lint.
