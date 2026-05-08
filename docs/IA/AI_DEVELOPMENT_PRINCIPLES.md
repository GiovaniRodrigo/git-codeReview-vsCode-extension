# Principios de Desenvolvimento com IA - Code Review Extension

Este documento define a mentalidade e os limites para uso de IA no desenvolvimento do projeto **Code Review Extension**.

## 1. IA como amplificador, nao substituto

A IA deve ser usada para acelerar execucao, automatizar tarefas repetitivas, apoiar refatoracoes, gerar rascunhos e acelerar prototipos.

A IA nao substitui engenharia de software. Decisoes de arquitetura, trade-offs, seguranca, manutencao, produto, testes, debugging e producao continuam sob responsabilidade humana.

> AI amplifies experienced engineers.

## 2. Trabalho incremental

O desenvolvimento assistido por IA deve acontecer em ciclos pequenos:

1. definir uma mudanca pequena;
2. validar regra de negocio;
3. criar ou atualizar testes;
4. implementar no menor escopo possivel;
5. executar validacoes;
6. sincronizar documentacao;
7. preparar commit ou deploy incremental.

Evite solicitar ou aceitar entregas grandes sem decomposicao, validacao intermediaria e criterio claro de aceite.

## 3. Refatoracao continua e segura

Use IA para reorganizar codigo, renomear estruturas, separar responsabilidades, migrar padroes e limpar codigo legado quando houver objetivo claro.

Refatoracoes devem:

- preservar comportamento existente;
- ter cobertura de testes suficiente;
- manter escopo rastreavel;
- evitar mudancas globais sem justificativa;
- respeitar a arquitetura definida em `IA/CLEAN_CONTEXT.md`.

## 4. Testes e validacao obrigatorios

Nunca assuma que codigo gerado por IA esta correto, seguro, performatico ou sustentavel.

Sempre que aplicavel, valide com:

- revisao humana;
- testes unitarios;
- testes de integracao;
- testes end-to-end;
- CI;
- analise de logs;
- medicao de performance;
- validacao manual do fluxo critico.

Falha de teste, erro de build, alerta de seguranca ou comportamento ambiguo deve bloquear a conclusao da tarefa ate ser tratado ou declarado como risco residual.

## 5. Arquitetura antes de codigo

A IA reduz o custo de escrever codigo. Por isso, o gargalo passa a ser pensar melhor:

- objetivo de produto;
- limites de escopo;
- modelo de dados;
- separacao de responsabilidades;
- contratos entre modulos;
- trade-offs de arquitetura;
- manutencao futura.

Antes de implementar, a IA deve entender o desenho existente e propor mudancas compativeis com ele.

## 6. Debugging continua essencial

A IA pode ajudar a levantar hipoteses, ler logs, explicar stack traces e propor correcoes, mas nao elimina a necessidade de debugging.

Ao corrigir bugs, priorize:

- reproduzir o problema;
- identificar comportamento esperado;
- localizar causa raiz;
- criar teste de regressao quando possivel;
- validar a correcao no fluxo real.

## 7. Producao, deploy e observabilidade

Mudancas relevantes devem considerar o ambiente de producao.

Quando aplicavel, a IA deve avaliar impacto em:

- deploy continuo;
- pipelines;
- migracoes;
- configuracao;
- infraestrutura;
- monitoramento;
- observabilidade;
- performance;
- rollback;
- dados existentes.

IA nao elimina falhas reais de producao. Deploy incremental, logs, metricas e alertas continuam essenciais.

## 8. Nao existe prompt magico

Evite depender de prompts prontos ou pedir um sistema completo sem decomposicao.

Prefira:

- dividir problemas;
- fornecer contexto atual;
- definir criterio de aceite;
- revisar planos;
- validar testes;
- iterar em pequenas entregas.

## 9. Bons usos praticos da IA

Use IA preferencialmente para acelerar:

- boilerplate;
- CRUDs;
- documentacao;
- testes iniciais;
- refatoracoes;
- pipelines;
- scripts;
- conversoes;
- automacoes;
- analise de logs;
- revisoes de consistencia.

## 11. IA como funcionalidade do produto (IA Assistida)

Ao implementar funcionalidades de IA para o usuario final (ex: auxilio no Code Review via Codex/Copilot):

- **Privacidade e Consentimento**: a integracao deve ser opcional (opt-in). Nunca envie codigo do usuario para APIs de IA sem permissao explicita.
- **Transparencia**: deixe claro quando uma sugestao ou resumo foi gerado por IA.
- **Apoio, nao decisao**: a IA deve sugerir pontos de atencao no diff, mas a aprovacao final e sempre humana.
- **Fallback**: a extensao deve permanecer util e funcional mesmo se o serviço de IA estiver indisponivel ou desativado.
- **Seguranca**: nao envie segredos, tokens ou informacoes sensiveis do workspace para modelos de IA.

## 12. Mentalidade final

Bons desenvolvedores ficam mais rapidos com IA. Desenvolvedores sem criterio podem apenas produzir software ruim mais rapidamente.

O fluxo ideal e iterativo, testado, incremental e com validacao constante.
