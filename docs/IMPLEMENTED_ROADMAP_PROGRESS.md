# Progresso Implementado do ROADMAP

## Fase 9 — Persistência e Auditoria

Status: concluída.

### Entregas

- Banco local em arquivo JSON versionado no `globalStorage` da extensão.
- Migração automática do estado legado do VS Code `workspaceState` para o banco local.
- Auditoria append-only em NDJSON com encadeamento por hash SHA-256.
- Exportação de auditoria por comando e atalho.
- Exportação do banco local por comando e atalho.
- Backup local com arquivo timestampado.
- Sincronização remota simulada para caminho configurável (`codeReview.remoteSyncPath`) ou arquivo `.code-review-sync.json` no workspace.

### Comandos

| Comando | Atalho | Finalidade |
| --- | --- | --- |
| `codeReview.exportAuditLog` | `Ctrl+Alt+E` | Exporta auditoria append-only |
| `codeReview.exportLocalDatabase` | `Ctrl+Alt+D` | Exporta banco local |
| `codeReview.createBackup` | `Ctrl+Alt+B` | Cria backup local |
| `codeReview.syncRemote` | `Ctrl+Alt+S` | Sincroniza base para arquivo remoto configurável |

## Fase 10 — Performance

Status: concluída como base funcional.

### Entregas

- Cache local TTL para o estado do dashboard.
- Lazy loading das sessões listadas no dashboard, limitado a 50 itens por carga.
- Cálculo assíncrono do estado com `Promise.all`.
- Renderização incremental preparada por batch de 25 itens.
- Estado de performance exposto para a UI.

## Fase 11 — Integrações Futuras

Status: iniciado.

### Entregas

- Adaptadores descritivos para GitHub, GitLab, Azure DevOps e Bitbucket.
- Adaptadores descritivos para Jira, Linear, Slack e Discord.
- UI de configurações exibindo integrações preparadas para configuração futura.

## Arquivos principais alterados

- `src/infrastructure/localJsonReviewSessionRepository.ts`
- `src/infrastructure/audit/fileAuditService.ts`
- `src/infrastructure/performanceCache.ts`
- `src/infrastructure/integrationAdapters.ts`
- `src/application/reviewSessionService.ts`
- `src/presentation/reviewPanel.ts`
- `src/extension.ts`
- `webview-ui/src/main.jsx`
- `webview-ui/src/styles.css`
- `package.json`
- `docs/ROADMAP.md`
