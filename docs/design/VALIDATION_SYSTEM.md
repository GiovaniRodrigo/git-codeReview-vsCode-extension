# Sistema de Validações

## Fluxo

```text
Reviewer cria validação
↓
Responsável corrige
↓
Sistema revalida
↓
Histórico permanece salvo
```

---

# Estrutura

## Review Session

Sessão de revisão vinculada à PR/Branch.

## Validation Finding

Problema encontrado.

## Correction Attempt

Correção realizada pelo responsável.

## Revalidation

Nova validação após correção.

---

# Exemplo

```json
{
  "rule": "DIP",
  "severity": "critical",
  "status": "NEEDS_CHANGES"
}
```

---

# Histórico

Nunca apagar validações.

Estados:

```text
NEEDS_CHANGES → FIXED → APPROVED
```
