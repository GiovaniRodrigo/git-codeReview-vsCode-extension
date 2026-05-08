# Regras de Negócio — Sistema de Code Review

## 1. Objetivo

Este documento define as regras de negócio do sistema de Code Review integrado ao VS Code, responsável por:

* análise de Pull Requests e Branches;
* registro de validações técnicas;
* acompanhamento de correções;
* revalidação de conformidades;
* histórico de revisões;
* métricas e telemetria arquitetural.

---

# 2. Entidades de Negócio

## 2.1 Review Session

Representa uma sessão de revisão associada a uma Pull Request ou Branch.

### Regras

* Uma sessão deve possuir:

  * branch origem;
  * branch destino;
  * autor;
  * reviewer;
  * status;
  * data de criação.

* Uma sessão pode possuir múltiplas validações.

* Uma sessão deve manter histórico completo.

* Uma sessão é removida permanente segundo dupla confirmação com usuário.

---

## 2.2 Validation Finding

Representa uma não conformidade identificada durante a revisão.

### Regras

* Toda validação deve possuir:

  * regra violada;
  * severidade;
  * descrição;
  * local do código;
  * responsável;
  * status.

* A validação deve estar vinculada a:

  * commit;
  * arquivo;
  * linha;
  * sessão de review.

* Uma validação deve permitir comentários adicionais.

* Uma validação nunca deve ser apagada.

* Alterações de status devem ser auditáveis.

---

## 2.3 Correction Attempt

Representa uma tentativa de correção realizada pelo desenvolvedor.

### Regras

* Toda tentativa deve possuir:

  * autor da correção;
  * commit relacionado;
  * data;
  * descrição.

* Uma tentativa de correção deve permanecer vinculada à validação original.

* O sistema deve permitir múltiplas tentativas.

---

## 2.4 Revalidation

Representa uma nova validação após correção.

### Regras

* Toda correção deve permitir revalidação.

* A revalidação deve:

  * manter histórico;
  * registrar reviewer;
  * registrar resultado;
  * registrar data.

* O sistema deve permitir reabertura da validação.

---

# 3. Fluxo de Negócio

## 3.1 Fluxo Principal

```text
Reviewer cria validação
↓
Responsável corrige
↓
Sistema revalida
↓
Reviewer aprova
↓
Histórico permanece salvo
```

---

## 3.2 Fluxo de Revisão

```text
Abrir PR
↓
Executar análise
↓
Visualizar problemas
↓
Comentar
↓
Corrigir
↓
Revalidar
↓
Aprovar
```

---

# 4. Estados do Sistema

## 4.1 Status da Review Session

| Status        | Descrição            |
| ------------- | -------------------- |
| OPEN          | Revisão aberta       |
| IN_REVIEW     | Revisão em andamento |
| NEEDS_CHANGES | Ajustes necessários  |
| FIXED         | Correções realizadas |
| APPROVED      | Revisão aprovada     |
| REOPENED      | Revisão reaberta     |

---

## 4.2 Status da Validation Finding

```text
NEEDS_CHANGES → FIXED → APPROVED
```

### Regras

* Uma validação aprovada pode ser reaberta.

* Uma validação reaberta deve preservar histórico anterior.

* Uma validação crítica não pode ser ignorada sem justificativa.

---

# 5. Regras de Severidade

| Severidade | Impacto          |
| ---------- | ---------------- |
| LOW        | Pequeno impacto  |
| MEDIUM     | Impacto moderado |
| HIGH       | Alto impacto     |
| CRITICAL   | Impacto crítico  |

---

## 5.1 Regras de Aprovação

* PRs contendo validações CRITICAL não podem ser aprovadas.

* PRs contendo validações HIGH devem exigir correção obrigatória.

* PRs contendo apenas LOW ou MEDIUM podem permitir aprovação com ressalvas.

---

# 6. Regras Arquiteturais

## 6.1 SOLID

O sistema deve validar:

* SRP;
* OCP;
* LSP;
* ISP;
* DIP.

---

## 6.2 Clean Architecture

O sistema deve validar:

* dependências incorretas;
* violação de camadas;
* acoplamento indevido;
* dependência circular.

---

## 6.3 DDD

O sistema deve validar:

* separação de bounded contexts;
* uso correto de entidades;
* uso correto de value objects;
* isolamento de domínio.

---

# 7. Telemetria

## 7.1 Objetivos

Registrar:

* violações recorrentes;
* score por PR;
* reincidência;
* frequência de não conformidades;
* paradigmas violados;
* arquitetura impactada.

---

## 7.2 Métricas

| Métrica                   | Objetivo                       |
| ------------------------- | ------------------------------ |
| Score de qualidade        | Medir qualidade geral          |
| Taxa de reincidência      | Identificar repetição de erros |
| Tempo de correção         | Medir produtividade            |
| Quantidade de validações  | Medir complexidade             |
| Quantidade de reaberturas | Medir qualidade da correção    |

---

# 8. Regras de Histórico

## Regras

* Nenhum histórico pode ser apagado.

* Toda alteração deve ser auditável.

* Todo comentário deve manter:

  * autor;
  * data;
  * contexto;
  * referência do código.

* O sistema deve manter timeline completa.

---

# 9. Regras de UX

## Objetivos

* reduzir carga cognitiva;
* minimizar troca de contexto;
* fornecer feedback contínuo;
* reduzir excesso de cliques;
* melhorar velocidade da revisão.

---

## Regras de Navegação

* O usuário deve conseguir acessar:

  * PR;
  * commit;
  * arquivo;
  * comentário;
  * validação.

com no máximo 2 interações.

---

## Regras de Feedback

O sistema deve fornecer:

* loading visual;
* feedback imediato;
* atualização em tempo real;
* indicadores visuais de status.

---

# 10. Regras de Interface

## Componentes obrigatórios

* Cards;
* Chips;
* Painéis;
* Snackbar;
* Tabs;
* Tooltips;
* Badges;
* Timeline.

---

# 11. Regras de Integração

## Git

O sistema deve:

* analisar Pull Requests;
* analisar Branches;
* comparar commits;
* identificar diffs;
* identificar impacto arquitetural.

---

## VS Code

O sistema deve:

* funcionar integrado ao editor;
* evitar troca de ferramenta;
* permitir navegação rápida;
* possuir atalhos de teclado.

---

# 12. Regras de Persistência

## Histórico

* Histórico deve ser imutável.

* Eventos devem ser rastreáveis.

* Alterações devem possuir versionamento.

---

# 13. Regras de Segurança

## Controle de acesso

O sistema deve diferenciar:

* reviewer;
* autor da PR;
* administrador.

---

## Auditoria

Toda ação deve registrar:

* usuário;
* data;
* operação;
* contexto.

---

# 14. Exemplo de Estrutura de Validação

```json
{
  "rule": "DIP",
  "severity": "critical",
  "status": "NEEDS_CHANGES"
}
```

---

# 15. Regras Gerais

* O sistema deve ser orientado a histórico.

* O sistema não deve perder contexto da revisão.

* Toda validação deve possuir rastreabilidade.

* Toda decisão deve ser auditável.

* O sistema deve priorizar produtividade do reviewer.

* O sistema deve priorizar clareza visual.

* O sistema deve seguir princípios de UI/UX do Material Design 3.
