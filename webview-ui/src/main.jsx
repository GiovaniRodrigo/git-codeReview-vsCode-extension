import logo from '../../media/logo_128px.png';
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileDown,
  FolderOpen,
  GitCommit,
  GitPullRequest,
  Home,
  HelpCircle,
  Info,
  Lightbulb,
  ListChecks,
  Loader2,
  MessageSquare,
  MoreVertical,
  Pencil,
  Play,
  RefreshCw,
  Settings,
  Shield,
  Wrench,
  XCircle
} from 'lucide-react';
import './styles.css';

const vscodeApi = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : undefined;

const colors = {
  purple: '#7c4dff',
  green: '#4ade80',
  red: '#ff5c66',
  yellow: '#fbbf24',
  blue: '#3b82f6'
};

function ReviewLeftbar({ view, setView, state, onStartTour }) {
  const session = state?.currentSession;
  const git = state?.git;
  const nav = [
    ['dashboard', Home, 'Dashboard', '82'],
    ['analysis', AlertTriangle, 'Diagnósticos', '25'],
    ['intelligence', Lightbulb, 'Inteligência', state?.intelligence?.suggestions?.length ? String(state.intelligence.suggestions.length) : ''],
    ['comments', MessageSquare, 'Comentários', session?.comments?.length ? String(session.comments.length) : ''],
    ['collaboration', GitPullRequest, 'Colaboração', session?.notifications?.filter((item) => !item.read).length ? String(session.notifications.filter((item) => !item.read).length) : ''],
    ['conformities', CheckCircle2, 'Conformidades', '68'],
    ['telemetry', BarChart3, 'Telemetria', '94%'],
    ['history', Clock3, 'Histórico', '12'],
    ['settings', Settings, 'Configurações', '']
  ];

  return (
    <aside className="leftbar">
      <div className="brand">
        <div className="brand-icon">
          <img
            src={logo}
            alt="Code Review Logo"
            className="brand-logo"
          />
        </div>
        <div>
          <strong>Code Review</strong>
          <span>Governança arquitetural</span>
        </div>
      </div>

      <section className="review-state">
        <span>Revisão atual</span>
        <strong>{session ? `${session.sourceBranch} · ${session.status}` : `${git?.currentBranch ?? 'sem branch'} · sem sessão`}</strong>
        <div className="progress"><i style={{ width: session ? '82%' : '18%' }} /></div>
      </section>

      <nav className="nav-list">
        {nav.map(([key, Icon, label, badge]) => (
          <button key={key} data-tour={key === 'dashboard' ? 'nav-dashboard' : undefined} className={view === key ? 'active' : ''} onClick={() => setView(key)}>
            <Icon size={18} />
            <span>{label}</span>
            {badge && <b>{badge}</b>}
          </button>
        ))}
      </nav>

      <button className="tour-start-button" data-tour="tour-help" onClick={onStartTour}>
        <HelpCircle size={18} />
        <span>Ver tutorial guiado</span>
      </button>

      <section className="rule-groups" data-tour="rule-groups">
        <h4>Categorias</h4>
        <RuleItem color="red" label="SOLID" count="3" />
        <RuleItem color="red" label="Clean Architecture" count="4" />
        <RuleItem color="yellow" label="DDD" count="2" />
        <RuleItem color="blue" label="Performance" count="1" />
        <RuleItem color="green" label="Testes" count="18" />
      </section>
    </aside>
  );
}

function RuleItem({ color, label, count }) {
  return (
    <div className="rule-item">
      <span className={color}>●</span>
      <p>{label}</p>
      <b>{count}</b>
    </div>
  );
}

function ReviewCenter({ view, state, onStartReview }) {
  if (view === 'telemetry') return <TelemetryCenter state={state} />;
  if (view === 'history') return <HistoryCenter state={state} />;
  if (view === 'intelligence') return <IntelligenceCenter state={state} />;
  if (view === 'collaboration') return <CollaborationCenter state={state} />;
  if (view === 'comments') return <CommentsCenter state={state} />;
  if (view === 'settings') return <SettingsCenter state={state} />;
  if (view === 'conformities') return <ConformitiesCenter />;

  return (
    <main className="center-panel">
      <header className="center-header">
        <div>
          <span className="eyebrow">Análise da revisão</span>
          <h1>{view === 'dashboard' ? 'Dashboard de qualidade' : 'Diagnósticos encontrados'}</h1>
          <p>{state?.git ? `${state.git.currentBranch} para ${state.git.baseBranch}` : 'Resumo da revisão sem recriar Explorer, editor, tabs ou statusbar do VS Code.'}</p>
        </div>
        <div className="header-actions" data-tour="header-actions">
          <Tooltip label="Recarregar contexto Git e sessão">
            <button onClick={() => vscodeApi?.postMessage({ type: 'requestState' })}><RefreshCw size={16} /> Atualizar</button>
          </Tooltip>
          <Tooltip label="Criar ou atualizar sessão de review">
            <button className="primary" data-tour="start-review" onClick={onStartReview}><Play size={16} /> Executar revisão</button>
          </Tooltip>
        </div>
      </header>

      {!state && <SkeletonPanel />}

      <section className="summary-grid" data-tour="quality-summary">
        <SummaryCard title="Score" value={`${state?.metrics?.qualityScore ?? 100}/100`} label="qualidade atual" color="green" />
        <SummaryCard title="Violações" value={String(state?.metrics?.findingsCount ?? 0)} label={`${state?.metrics?.criticalCount ?? 0} críticas`} color="red" />
        <SummaryCard title="Correções" value={String(state?.metrics?.correctionsCount ?? 0)} label="tentativas registradas" color="green" />
        <SummaryCard title="Reincidência" value={`${state?.metrics?.recurrenceRate ?? 0}%`} label="regras repetidas" color="blue" />
      </section>

      <section className="review-workspace">
        <div className="workspace-main">
          <h2>Arquivos e achados da revisão</h2>
          <p className="muted">Use o editor real do VS Code para abrir o arquivo, diff e comentários. Esta área mostra apenas o resumo navegável.</p>
          <div data-tour="findings-table"><FindingsTable changedFiles={state?.git?.changedFiles} /></div>
        </div>

        <aside className="workspace-side">
          <h3>Fluxo reviewer/developer</h3>
          <Timeline session={state?.currentSession} />
        </aside>
      </section>

      <div data-tour="review-sessions"><ReviewSessionsPanel sessions={state?.sessions} currentSession={state?.currentSession} /></div>
      <div data-tour="navigation-panel"><NavigationPanel session={state?.currentSession} git={state?.git} /></div>
      <div data-tour="comments-panel"><CommentsPanel session={state?.currentSession} /></div>
      <div data-tour="validation-panel"><ValidationFindingsPanel session={state?.currentSession} git={state?.git} /></div>
      <div data-tour="architecture-panel"><ArchitectureRulesPanel session={state?.currentSession} /></div>
      <div data-tour="intelligence-panel"><IntelligencePanel intelligence={state?.intelligence} /></div>
      <div data-tour="collaboration-panel"><CollaborationPanel session={state?.currentSession} /></div>

      <section className="insight-grid">
        <InsightCard title="Inversão de Dependência" severity="Crítico" text="A camada de aplicação depende de repositório concreto. Abrir UserService.ts linha 11." />
        <InsightCard title="Muitas Responsabilidades" severity="Aviso" text="Método getUserById agrega busca, cálculo e montagem de DTO." />
        <InsightCard title="Tratamento de Erro" severity="Erro" text="Erro genérico usado em fluxo de domínio. Padronizar Result/Error." />
      </section>
    </main>
  );
}

function NavigationPanel({ session, git }) {
  const [tab, setTab] = useState('changes');
  const firstFile = session?.changedFiles?.[0] ?? git?.changedFiles?.[0] ?? 'src/extension.ts';
  const firstCommit = session?.commits?.[0] ?? git?.commits?.[0] ?? 'HEAD';
  const firstComment = session?.comments?.[0];
  const targets = [
    ['commit', GitCommit, 'Commit', firstCommit],
    ['diff', GitPullRequest, 'Diff', firstFile],
    ['file', FolderOpen, 'Arquivo', firstFile],
    ['comment', MessageSquare, 'Comentário', firstComment?.id ?? 'sem-comentario'],
    ['validation', ListChecks, 'Validação', 'validation-preview']
  ];

  return (
    <section className="sessions-panel">
      <div className="section-title">
        <div>
          <h2>Navegação</h2>
          <p className="muted">Atalhos da sessão para commits, diffs, arquivos, comentários e validações.</p>
        </div>
        {session?.activeNavigation && <span className="active-target">{session.activeNavigation.kind}: {session.activeNavigation.ref}</span>}
      </div>
      <div className="tabs" role="tablist" aria-label="Contexto de navegação">
        {[
          ['changes', 'Alterações'],
          ['activity', 'Atividade'],
          ['quality', 'Qualidade']
        ].map(([key, label]) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>
      <div className="navigation-grid">
        {targets.map(([kind, Icon, label, ref]) => (
          <button
            key={kind}
            disabled={!session}
            onClick={() => {
              const targetFile = kind === 'file' || kind === 'diff' ? ref : firstFile;
              vscodeApi?.postMessage({
                type: 'navigateReview',
                payload: {
                  id: session.id,
                  kind,
                  ref,
                  file: targetFile,
                  line: kind === 'comment' && firstComment ? firstComment.line : 1
                }
              });
              if (kind === 'file' || kind === 'diff' || kind === 'comment') {
                vscodeApi?.postMessage({ type: kind === 'diff' ? 'openDiff' : 'openWorkspaceFile', payload: { file: targetFile, line: kind === 'comment' && firstComment ? firstComment.line : 1 } });
              }
            }}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function CommentsPanel({ session }) {
  const [draft, setDraft] = useState('Revisar responsabilidade deste trecho.');
  const [line, setLine] = useState(1);
  const file = session?.changedFiles?.[0] ?? 'src/extension.ts';

  const addComment = () => {
    if (!session || !draft.trim()) return;
    vscodeApi?.postMessage({
      type: 'addReviewComment',
      payload: {
        id: session.id,
        body: draft,
        file,
        line: Number(line) || 1,
        commit: session.commits?.[0]
      }
    });
    setDraft('');
  };

  return (
    <section className="sessions-panel">
      <div className="section-title">
        <div>
          <h2>Comentários</h2>
          <p className="muted">Comentários vinculados ao código, com threads e histórico de edição.</p>
        </div>
      </div>
      <div className="comment-form">
        <input value={file} readOnly />
        <input type="number" min="1" value={line} onChange={(event) => setLine(event.target.value)} />
        <input value={draft} onChange={(event) => setDraft(event.target.value)} />
        <Tooltip label="Adicionar comentário vinculado ao arquivo e linha">
          <button disabled={!session || !draft.trim()} onClick={addComment}><MessageSquare size={16} /> Inserir</button>
        </Tooltip>
      </div>
      <div className="comments-list">
        {session?.comments?.length ? session.comments.map((comment) => (
          <CommentItem key={comment.id} session={session} comment={comment} />
        )) : <p className="empty-state">Nenhum comentário registrado nesta sessão.</p>}
      </div>
    </section>
  );
}

function ValidationFindingsPanel({ session, git }) {
  const [rule, setRule] = useState('DIP');
  const [severity, setSeverity] = useState('HIGH');
  const [description, setDescription] = useState('Dependência concreta detectada na camada de aplicação.');
  const [line, setLine] = useState(1);
  const file = session?.changedFiles?.[0] ?? git?.changedFiles?.[0] ?? 'src/extension.ts';
  const commit = session?.commits?.[0] ?? git?.commits?.[0] ?? 'HEAD';

  const createFinding = () => {
    if (!session || !description.trim()) return;
    vscodeApi?.postMessage({
      type: 'createValidationFinding',
      payload: {
        id: session.id,
        rule,
        severity,
        description,
        file,
        line: Number(line) || 1,
        commit
      }
    });
  };

  return (
    <section className="sessions-panel">
      <div className="section-title">
        <div>
          <h2>Validações</h2>
          <p className="muted">Findings com severidade, status, correções e revalidação.</p>
        </div>
      </div>
      <div className="finding-form">
        <select value={rule} onChange={(event) => setRule(event.target.value)}>
          <option>DIP</option>
          <option>SRP</option>
          <option>Clean Architecture</option>
          <option>DDD</option>
          <option>Performance</option>
        </select>
        <select value={severity} onChange={(event) => setSeverity(event.target.value)}>
          <option>LOW</option>
          <option>MEDIUM</option>
          <option>HIGH</option>
          <option>CRITICAL</option>
        </select>
        <input type="number" min="1" value={line} onChange={(event) => setLine(event.target.value)} />
        <input value={description} onChange={(event) => setDescription(event.target.value)} />
        <Tooltip label="Criar finding de validação">
          <button disabled={!session || !description.trim()} onClick={createFinding}><ListChecks size={16} /> Criar</button>
        </Tooltip>
      </div>
      <div className="findings-list">
        {session?.findings?.length ? session.findings.map((finding) => (
          <FindingItem key={finding.id} session={session} finding={finding} />
        )) : <p className="empty-state">Nenhuma validação registrada nesta sessão.</p>}
      </div>
    </section>
  );
}

function ArchitectureRulesPanel({ session }) {
  const rules = [
    ['SOLID', 'SRP, OCP, LSP, ISP, DIP'],
    ['Clean Architecture', 'Dependência incorreta, camadas, circularidade e acoplamento'],
    ['DDD', 'Bounded Context, Entidades, Value Objects e Serviços de domínio']
  ];

  return (
    <section className="sessions-panel">
      <div className="section-title">
        <div>
          <h2>Regras arquiteturais</h2>
          <p className="muted">Validação automática dos arquivos alterados da sessão atual.</p>
        </div>
        <Tooltip label="Executar SOLID, Clean Architecture e DDD nos arquivos alterados">
          <button
            className="panel-action"
            disabled={!session}
            onClick={() => vscodeApi?.postMessage({ type: 'runArchitectureValidation', payload: { id: session.id } })}
          >
            <Shield size={16} /> Validar arquitetura
          </button>
        </Tooltip>
      </div>
      <div className="architecture-rules-grid">
        {rules.map(([title, text]) => (
          <article key={title}>
            <strong>{title}</strong>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function IntelligencePanel({ intelligence }) {
  const suggestions = intelligence?.suggestions ?? [];
  const recommendations = intelligence?.recommendations ?? [];

  return (
    <section className="sessions-panel">
      <div className="section-title">
        <div>
          <h2>Inteligência assistida</h2>
          <p className="muted">Sugestões locais baseadas em findings, histórico e reincidência.</p>
        </div>
      </div>
      <div className="intelligence-grid">
        {suggestions.length ? suggestions.slice(0, 4).map((suggestion) => (
          <article key={suggestion.id}>
            <Badge>{suggestion.type}</Badge>
            <h3>{suggestion.title}</h3>
            <p>{suggestion.description}</p>
          </article>
        )) : <p className="empty-state">Sem sugestões inteligentes ainda.</p>}
      </div>
      <div className="recommendation-strip">
        {recommendations.map((item) => <span key={item}>{item}</span>)}
      </div>
    </section>
  );
}

function CollaborationPanel({ session }) {
  const [message, setMessage] = useState('Pode validar este módulo @dev?');
  const firstFile = session?.changedFiles?.[0] ?? 'src/extension.ts';
  const moduleName = firstFile.split('/').slice(0, 2).join('/') || firstFile;

  const sendMessage = () => {
    if (!session || !message.trim()) return;
    vscodeApi?.postMessage({ type: 'addCollaborationMessage', payload: { id: session.id, body: message } });
    setMessage('');
  };

  return (
    <section className="sessions-panel">
      <div className="section-title">
        <div>
          <h2>Colaboração</h2>
          <p className="muted">Threads, menções, notificações e aprovações parciais.</p>
        </div>
        <span className={session?.mergeDecision?.blocked ? 'merge blocked' : 'merge'}>{session?.mergeDecision?.blocked ? 'Merge bloqueado' : 'Merge liberado'}</span>
      </div>
      <div className="collab-form">
        <input value={message} onChange={(event) => setMessage(event.target.value)} />
        <button disabled={!session || !message.trim()} onClick={sendMessage}><MessageSquare size={16} /> Enviar</button>
      </div>
      <div className="workflow-actions">
        <button disabled={!session} onClick={() => vscodeApi?.postMessage({ type: 'approvePartial', payload: { id: session.id, scope: 'file', target: firstFile } })}>Aprovar arquivo</button>
        <button disabled={!session} onClick={() => vscodeApi?.postMessage({ type: 'approvePartial', payload: { id: session.id, scope: 'module', target: moduleName } })}>Aprovar módulo</button>
        <button disabled={!session} onClick={() => vscodeApi?.postMessage({ type: 'refreshMergeDecision', payload: { id: session.id } })}>Atualizar bloqueio</button>
      </div>
      <div className="collab-grid">
        <TextListPanel title="Threads colaborativas" items={(session?.collaborationMessages ?? []).map((item) => `${item.author}: ${item.body}`)} />
        <TextListPanel title="Notificações" items={(session?.notifications ?? []).map((item) => `@${item.recipient}: ${item.message}`)} />
        <TextListPanel title="Histórico compartilhado" items={(session?.history ?? []).slice(-5).map((item) => item.message)} />
      </div>
      <div className="badge-row">
        {(session?.partialApprovals ?? []).map((approval) => <Badge key={approval.id}>{approval.scope}: {approval.target}</Badge>)}
        {(session?.mergeDecision?.reasons ?? []).map((reason) => <Badge key={reason}>{reason}</Badge>)}
      </div>
    </section>
  );
}

function FindingItem({ session, finding }) {
  const correctionCommit = session.commits?.[0] ?? 'HEAD';

  return (
    <article className="finding-item">
      <header>
        <div>
          <strong>{finding.rule}</strong>
          <small>{finding.file}:{finding.line} · {finding.commit}</small>
        </div>
        <Severity label={finding.severity === 'CRITICAL' ? 'Crítico' : finding.severity === 'HIGH' ? 'Erro' : finding.severity === 'MEDIUM' ? 'Aviso' : 'Sugestão'} />
      </header>
      <p>{finding.description}</p>
      <div className="finding-actions">
        {['NEEDS_CHANGES', 'FIXED', 'APPROVED', 'REOPENED'].map((status) => (
          <button
            key={status}
            className={finding.status === status ? 'active' : ''}
            onClick={() => vscodeApi?.postMessage({ type: 'updateValidationFindingStatus', payload: { id: session.id, findingId: finding.id, status } })}
          >
            {status}
          </button>
        ))}
      </div>
      <div className="finding-actions">
        <button onClick={() => vscodeApi?.postMessage({
          type: 'registerCorrectionAttempt',
          payload: { id: session.id, findingId: finding.id, commit: correctionCommit, description: 'Correção registrada pelo responsável.' }
        })}>Registrar correção</button>
        <button onClick={() => vscodeApi?.postMessage({
          type: 'revalidateFinding',
          payload: { id: session.id, findingId: finding.id, result: 'APPROVED', notes: 'Revalidação aprovada.' }
        })}>Aprovar revalidação</button>
        <button onClick={() => vscodeApi?.postMessage({
          type: 'revalidateFinding',
          payload: { id: session.id, findingId: finding.id, result: 'REOPENED', notes: 'Reaberto após nova análise.' }
        })}>Reabrir</button>
      </div>
      <div className="badge-row">
        <Badge>{finding.statusHistory.length} mudanças</Badge>
        <Badge>{finding.correctionAttempts.length} correções</Badge>
        <Badge>{finding.revalidations.length} revalidações</Badge>
      </div>
    </article>
  );
}

function CommentItem({ session, comment }) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);

  return (
    <article className="comment-item">
      <header>
        <span>{comment.file}:{comment.line}</span>
        <button onClick={() => setEditing((value) => !value)}><Pencil size={15} /></button>
      </header>
      {editing ? (
        <div className="comment-edit">
          <input value={body} onChange={(event) => setBody(event.target.value)} />
          <button onClick={() => {
            vscodeApi?.postMessage({ type: 'editReviewComment', payload: { id: session.id, commentId: comment.id, body } });
            setEditing(false);
          }}>Salvar</button>
        </div>
      ) : <p>{comment.body}</p>}
      <small>Thread {comment.threadId} · {comment.history.length} edições</small>
    </article>
  );
}

function SummaryCard({ title, value, label, color }) {
  return (
    <div className="summary-card">
      <span>{title}</span>
      <strong className={color}>{value}</strong>
      <p>{label}</p>
    </div>
  );
}

function Badge({ children }) {
  return <span className="badge">{children}</span>;
}

function Tooltip({ label, children }) {
  return <span className="tooltip" data-tooltip={label}>{children}</span>;
}

function SkeletonPanel() {
  return (
    <section className="skeleton-panel" aria-label="Carregando dados">
      <Loader2 size={18} />
      <span />
      <span />
      <span />
    </section>
  );
}

function FindingsTable({ changedFiles = [] }) {
  const rows = changedFiles.length ? changedFiles.slice(0, 5).map((file, index) => [
    index === 0 ? 'Sugestão' : 'Conforme',
    'Git diff',
    file,
    '-',
    'Arquivo alterado'
  ]) : [
    ['Crítico', 'SOLID/DIP', 'UserService.ts', '11', 'Ajuste obrigatório'],
    ['Aviso', 'SRP', 'UserService.ts', '16', 'Separar responsabilidades'],
    ['Erro', 'Error Handling', 'UserService.ts', '24', 'Padronizar retorno'],
    ['Sugestão', 'Performance', 'UserRepository.ts', '38', 'Otimizar consulta'],
    ['Conforme', 'Clean Architecture', 'AuthController.ts', '8', 'Sem ação']
  ];

  return (
    <table className="findings-table">
      <thead>
        <tr>
          <th>Status</th>
          <th>Regra</th>
          <th>Arquivo</th>
          <th>Linha</th>
          <th>Ação</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.join('-')}>
            <td><Severity label={row[0]} /></td>
            <td>{row[1]}</td>
            <td>{row[2]}</td>
            <td>{row[3]}</td>
            <td>{row[4]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Severity({ label }) {
  const map = {
    Crítico: 'critical',
    Aviso: 'warning',
    Erro: 'error',
    Sugestão: 'info',
    Conforme: 'success'
  };
  return <span className={`severity ${map[label]}`}>{label}</span>;
}

function InsightCard({ title, severity, text, file = 'src/extension.ts', line = 1 }) {
  return (
    <article className="insight-card">
      <div>
        <Severity label={severity === 'Crítico' ? 'Crítico' : severity === 'Erro' ? 'Erro' : 'Aviso'} />
        <MoreVertical size={18} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      <button onClick={() => vscodeApi?.postMessage({ type: 'openWorkspaceFile', payload: { file, line } })}>Abrir no editor real do VS Code</button>
    </article>
  );
}

function Timeline({ session }) {
  const steps = session?.history?.length ? session.history.map((entry) => [
    entry.type === 'SESSION_CREATED' ? 'Sessão criada' : entry.type === 'STATUS_CHANGED' ? 'Status atualizado' : 'Git atualizado',
    entry.message
  ]) : [
    ['PR criada', 'feature/auth-refactor'],
    ['Review executada', '25 violações encontradas'],
    ['Comentários gerados', '3 críticos, 7 avisos'],
    ['Aguardando correção', 'Responsável: Developer'],
    ['Revalidação pendente', 'Após novos commits']
  ];

  return <div className="timeline">{steps.map(([title, text], index) => <div key={`${title}-${index}`}><b>{title}</b><p>{text}</p></div>)}</div>;
}

function ReviewSessionsPanel({ sessions = [], currentSession }) {
  return (
    <section className="sessions-panel">
      <div className="section-title">
        <div>
          <h2>Sessões de review</h2>
          <p className="muted">Histórico local das sessões registradas neste workspace.</p>
        </div>
        {currentSession && <StatusControls session={currentSession} />}
      </div>
      <div className="sessions-list">
        {sessions.length ? sessions.map((session) => (
          <button
            key={session.id}
            className={currentSession?.id === session.id ? 'session-row active' : 'session-row'}
            onClick={() => vscodeApi?.postMessage({ type: 'openReview', payload: { id: session.id } })}
          >
            <FolderOpen size={17} />
            <span>
              <strong>{session.sourceBranch}</strong>
              <small>{session.targetBranch} · {session.history.length} eventos</small>
            </span>
            <b>{session.status}</b>
          </button>
        )) : <p className="empty-state">Nenhuma sessão criada ainda.</p>}
      </div>
    </section>
  );
}

function StatusControls({ session }) {
  const statuses = ['OPEN', 'IN_REVIEW', 'NEEDS_CHANGES', 'FIXED', 'APPROVED', 'REOPENED'];

  return (
    <div className="status-controls" aria-label="Status da revisão">
      {statuses.map((status) => (
        <button
          key={status}
          className={session.status === status ? 'active' : ''}
          onClick={() => vscodeApi?.postMessage({ type: 'updateReviewStatus', payload: { id: session.id, status } })}
        >
          {status}
        </button>
      ))}
    </div>
  );
}

function Rightbar({ metrics, state, onSetView, onStartReview }) {
  return (
    <aside className="rightbar">
      <header>
        <span>Revisão atual</span>
        <div><RefreshCw size={17} /><MoreVertical size={17} /></div>
      </header>

      <section className="quality-card">
        <h4>Score de Qualidade</h4>
        <Ring score={metrics?.qualityScore ?? 100} />
        <strong>{qualityLabel(metrics?.qualityScore ?? 100)}</strong>
      </section>

      <section className="kpi-stack">
        <Metric title="Findings" value={String(metrics?.findingsCount ?? 0)} color="red" />
        <Metric title="Reaberturas" value={String(metrics?.reopenedCount ?? 0)} color="yellow" />
        <Metric title="Reincidência" value={`${metrics?.recurrenceRate ?? 0}%`} color="green" bar />
      </section>

      <section>
        <h3>Principais problemas <button className="link-button" onClick={() => onSetView('analysis')}>Ver todos</button></h3>
        <Issue icon={<XCircle size={17} />} title="Inversão de Dependência" text="UserService.ts:11" label="Crítico" />
        <Issue icon={<AlertTriangle size={17} />} title="Muitas Responsabilidades" text="UserService.ts:16" label="Aviso" />
        <Issue icon={<Info size={17} />} title="Tratamento de Erro" text="UserService.ts:24" label="Erro" />
      </section>

      <section>
        <h3>Ações rápidas</h3>
        <div className="actions">
          <button onClick={onStartReview}><Play size={18} />Executar</button>
          <button onClick={() => vscodeApi?.postMessage({ type: 'runArchitectureValidation', payload: { id: state?.currentSession?.id } })} disabled={!state?.currentSession}><Wrench size={18} />Corrigir</button>
          <button onClick={() => vscodeApi?.postMessage({ type: 'exportReviewReport' })}><FileDown size={18} />Relatório</button>
          <button onClick={() => onSetView('comments')}><MessageSquare size={18} />Comentar</button>
        </div>
      </section>

      <section className="telemetry-card">
        <h3>Telemetria <button className="link-button" onClick={() => onSetView('telemetry')}>Ver dashboard</button></h3>
        <div className="telemetry-chart"><div className="donut" /><span>⌁⌁⌁⌁⌁</span></div>
      </section>
    </aside>
  );
}

function Ring({ score = 100 }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="ring" style={{ background: `conic-gradient(${colors.green} 0 ${clamped}%, #253044 ${clamped}% 100%)` }}>
      <div><b>{clamped}</b><small>/100</small></div>
    </div>
  );
}

function Metric({ title, value, color, bar }) {
  return (
    <div className="metric">
      <p>{title}</p>
      <strong className={color}>{value}</strong>
      {bar ? <div className="bar"><i /></div> : <small>↗ 12</small>}
    </div>
  );
}

function Issue({ icon, title, text, label }) {
  return (
    <div className="issue">
      <span>{icon}</span>
      <div><b>{title}</b><p>{text}</p></div>
      <Severity label={label === 'Crítico' ? 'Crítico' : label === 'Erro' ? 'Erro' : 'Aviso'} />
    </div>
  );
}

function TelemetryCenter({ state }) {
  const metrics = state?.metrics ?? {};
  const timeline = metrics.timeline ?? [];
  const rules = metrics.ruleFrequency ?? [];
  const reviewers = metrics.reviewerCount ?? [];
  const developers = metrics.developerCount ?? [];

  return (
    <main className="center-panel simple">
      <header className="center-header">
        <div><span className="eyebrow">Telemetria</span><h1>Dashboards de qualidade</h1><p>Reincidências, regras mais violadas, tempo médio de correção e evolução por PR.</p></div>
      </header>
      <section className="summary-grid" data-tour="quality-summary">
        <SummaryCard title="Score" value={`${metrics.qualityScore ?? 100}/100`} label={qualityLabel(metrics.qualityScore ?? 100)} color="green" />
        <SummaryCard title="Findings" value={String(metrics.findingsCount ?? 0)} label={`${metrics.criticalCount ?? 0} críticos`} color="red" />
        <SummaryCard title="Tempo médio" value={`${metrics.averageCorrectionHours ?? 0}h`} label="correção" color="yellow" />
        <SummaryCard title="Eventos" value={String(metrics.eventsCount ?? 0)} label="telemetria local" color="blue" />
      </section>
      <section className="dashboard-grid">
        <TelemetryPanel title="Dashboard arquitetural" items={rules} empty="Nenhuma regra violada." />
        <TelemetryPanel title="Por reviewer" items={reviewers} empty="Nenhum reviewer registrado." />
        <TelemetryPanel title="Por desenvolvedor" items={developers} empty="Nenhum responsável registrado." />
      </section>
      <section className="sessions-panel">
        <div className="section-title">
          <div>
            <h2>Histórico temporal</h2>
            <p className="muted">Findings, correções, aprovações e reaberturas por dia.</p>
          </div>
        </div>
        <div className="timeline-chart">
          {timeline.length ? timeline.map((item) => (
            <div key={item.date}>
              <span>{item.date.slice(5)}</span>
              <i style={{ height: `${Math.max(8, item.findings * 16)}px` }} />
              <i className="green" style={{ height: `${Math.max(8, item.corrections * 16)}px` }} />
              <i className="blue" style={{ height: `${Math.max(8, item.approvals * 16)}px` }} />
              <i className="red" style={{ height: `${Math.max(8, item.reopenings * 16)}px` }} />
            </div>
          )) : <p className="empty-state">Sem histórico temporal ainda.</p>}
        </div>
      </section>
    </main>
  );
}

function IntelligenceCenter({ state }) {
  const intelligence = state?.intelligence ?? {};

  return (
    <main className="center-panel simple">
      <header className="center-header">
        <div><span className="eyebrow">Inteligência</span><h1>Assistência de revisão</h1><p>Sugestões de correção, arquitetura, refatoração e análise histórica.</p></div>
      </header>
      <section className="summary-grid">
        <SummaryCard title="Sugestões" value={String(intelligence.suggestions?.length ?? 0)} label="geradas localmente" color="green" />
        <SummaryCard title="Recorrências" value={String(intelligence.recurringErrors?.length ?? 0)} label="regras repetidas" color="red" />
        <SummaryCard title="Padrões" value={String(intelligence.patterns?.length ?? 0)} label="detectados" color="yellow" />
        <SummaryCard title="Recomendações" value={String(intelligence.recommendations?.length ?? 0)} label="ações propostas" color="blue" />
      </section>
      <IntelligencePanel intelligence={intelligence} />
      <section className="dashboard-grid">
        <TextListPanel title="Erros recorrentes" items={(intelligence.recurringErrors ?? []).map((item) => `${item.rule}: ${item.count}`)} />
        <TextListPanel title="Padrões detectados" items={intelligence.patterns ?? []} />
        <TextListPanel title="Comparação histórica" items={intelligence.comparisons ?? []} />
      </section>
    </main>
  );
}

function CollaborationCenter({ state }) {
  return (
    <main className="center-panel simple">
      <header className="center-header">
        <div><span className="eyebrow">Colaboração</span><h1>Fluxo reviewer/developer</h1><p>Comunicação, aprovações parciais e bloqueio de merge.</p></div>
      </header>
      <CollaborationPanel session={state?.currentSession} />
    </main>
  );
}

function TextListPanel({ title, items }) {
  return (
    <section className="sessions-panel">
      <div className="section-title"><h2>{title}</h2></div>
      <div className="text-list">
        {items.length ? items.map((item) => <p key={item}>{item}</p>) : <p className="empty-state">Sem dados suficientes.</p>}
      </div>
    </section>
  );
}

function TelemetryPanel({ title, items = [], empty }) {
  return (
    <section className="sessions-panel">
      <div className="section-title"><h2>{title}</h2></div>
      <div className="telemetry-list">
        {items.length ? items.slice(0, 6).map((item) => (
          <div key={item.rule}>
            <span>{item.rule}</span>
            <b>{item.count}</b>
          </div>
        )) : <p className="empty-state">{empty}</p>}
      </div>
    </section>
  );
}
function HistoryCenter({ state }) {
  return (
    <main className="center-panel simple">
      <header className="center-header">
        <div><span className="eyebrow">Code Review</span><h1>Histórico de revisões</h1><p>Linha do tempo de reviews, correções, revalidações e decisões de aprovação.</p></div>
      </header>
      <ReviewSessionsPanel sessions={state?.sessions} currentSession={state?.currentSession} />
      <section className="review-workspace single">
        <div className="workspace-main">
          <h2>Timeline da sessão atual</h2>
          <Timeline session={state?.currentSession} />
        </div>
      </section>
    </main>
  );
}
function CommentsCenter({ state }) {
  return (
    <main className="center-panel simple">
      <header className="center-header">
        <div><span className="eyebrow">Code Review</span><h1>Comentários da revisão</h1><p>Threads vinculadas a arquivo, linha e commit.</p></div>
      </header>
      <CommentsPanel session={state?.currentSession} />
    </main>
  );
}
function SettingsCenter({ state }) {
  const performance = state?.performance ?? {};
  const integrations = state?.integrations ?? [];

  return (
    <main className="center-panel simple">
      <header className="center-header">
        <div>
          <span className="eyebrow">Persistência, performance e integrações</span>
          <h1>Configurações operacionais</h1>
          <p>Banco local, backup, sincronização remota, cache, lazy loading e adaptadores futuros.</p>
        </div>
        <div className="header-actions" data-tour="persistence-actions">
          <button data-tour="export-database" onClick={() => vscodeApi?.postMessage({ type: 'exportLocalDatabase' })}><FileDown size={16} /> Banco local</button>
          <button onClick={() => vscodeApi?.postMessage({ type: 'createBackup' })}><Shield size={16} /> Backup</button>
          <button className="primary" onClick={() => vscodeApi?.postMessage({ type: 'syncRemote' })}><RefreshCw size={16} /> Sync remoto</button>
        </div>
      </header>
      <section className="summary-grid">
        <SummaryCard title="Cache" value={performance.cacheEnabled ? 'Ativo' : 'Inativo'} label="TTL local" color="green" />
        <SummaryCard title="Lazy loading" value={String(performance.lazySessionLimit ?? 0)} label="sessões por carga" color="blue" />
        <SummaryCard title="Batch" value={String(performance.incrementalBatchSize ?? 0)} label="render incremental" color="yellow" />
        <SummaryCard title="Async" value={performance.asyncProcessingEnabled ? 'Ativo' : 'Inativo'} label="processamento" color="green" />
      </section>
      <section className="sessions-panel">
        <div className="section-title">
          <div>
            <h2>Integrações preparadas</h2>
            <p className="muted">Adaptadores prontos para configuração sem acoplar credenciais ao núcleo da extensão.</p>
          </div>
        </div>
        <div className="integration-grid">
          {integrations.map((item) => (
            <article className="integration-card" key={item.id}>
              <strong>{item.name}</strong>
              <span>{item.status}</span>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function ConformitiesCenter() {
  return <SimpleCenter title="Conformidades detectadas" subtitle="Lista de boas práticas atendidas pelo projeto e evidências de aderência arquitetural." />;
}
function SimpleCenter({ title, subtitle }) {
  return (
    <main className="center-panel simple">
      <header className="center-header">
        <div><span className="eyebrow">Code Review</span><h1>{title}</h1><p>{subtitle}</p></div>
      </header>
      <section className="summary-grid">
        <SummaryCard title="Itens" value="68" label="mapeados" color="green" />
        <SummaryCard title="Pendências" value="12" label="aguardando ação" color="yellow" />
        <SummaryCard title="Críticos" value="3" label="bloqueantes" color="red" />
        <SummaryCard title="Evolução" value="+18%" label="últimos 7 dias" color="blue" />
      </section>
      <FindingsTable />
    </main>
  );
}


const defaultTourSteps = [
  {
    target: 'tour-help',
    title: 'Tutorial guiado',
    body: 'Este botão reabre o onboarding sempre que um novo usuário precisar aprender o fluxo principal.',
    placement: 'right'
  },
  {
    target: 'nav-dashboard',
    title: 'Navegação principal',
    body: 'Use o menu lateral para alternar entre dashboard, diagnósticos, comentários, telemetria, histórico e configurações.',
    placement: 'right'
  },
  {
    target: 'start-review',
    title: 'Iniciar revisão',
    body: 'Aqui começa a análise da branch ou PR. A extensão cria uma sessão e registra o contexto para auditoria.',
    placement: 'bottom'
  },
  {
    target: 'quality-summary',
    title: 'Resumo de qualidade',
    body: 'Os cards mostram score, violações, correções e reincidência para orientar a tomada de decisão.',
    placement: 'bottom'
  },
  {
    target: 'findings-table',
    title: 'Achados da revisão',
    body: 'Esta tabela lista arquivos, regras violadas, severidade e ação esperada para o reviewer ou desenvolvedor.',
    placement: 'top'
  },
  {
    target: 'comments-panel',
    title: 'Comentários e decisão',
    body: 'Registre não conformidades, aprovações, ajustes necessários e histórico de edição dos comentários.',
    placement: 'top'
  },
  {
    target: 'validation-panel',
    title: 'Validações',
    body: 'Crie evidências formais de aprovado, ajuste ou reprovado e acompanhe tentativas de correção.',
    placement: 'top'
  },
  {
    target: 'persistence-actions',
    title: 'Persistência e backup',
    body: 'Em Configurações, exporte o banco local, crie backup e sincronize com destino remoto configurado.',
    placement: 'bottom',
    beforeShow: 'settings'
  }
];

function GuidedTour({ active, steps, currentIndex, onNext, onBack, onSkip, onFinish, onJumpView }) {
  const [rect, setRect] = useState(null);
  const step = steps[currentIndex];

  useEffect(() => {
    if (!active || !step) return undefined;
    if (step.beforeShow) onJumpView(step.beforeShow);

    let cancelled = false;
    let rafId = 0;
    let timerId = 0;

    const measureTarget = () => {
      const selector = `[data-tour="${window.CSS?.escape ? CSS.escape(step.target) : step.target}"]`;
      const element = document.querySelector(selector);

      if (!element) {
        if (!cancelled) setRect(null);
        return;
      }

      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

      timerId = window.setTimeout(() => {
        rafId = window.requestAnimationFrame(() => {
          if (cancelled) return;
          const box = element.getBoundingClientRect();
          setRect({
            top: Math.round(box.top),
            left: Math.round(box.left),
            width: Math.round(box.width),
            height: Math.round(box.height)
          });
        });
      }, 180);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onSkip();
      if (event.key === 'Enter' && event.shiftKey) onBack();
      else if (event.key === 'Enter') currentIndex === steps.length - 1 ? onFinish() : onNext();
    };

    measureTarget();
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, step, currentIndex, steps.length, onJumpView, onNext, onBack, onSkip, onFinish]);

  if (!active || !step) return null;

  const highlight = rect ?? { top: 120, left: 260, width: 320, height: 80 };
  const popoverStyle = getTourPopoverStyle(highlight, step.placement);

  return createPortal(
    <div className="tour-layer" role="dialog" aria-modal="true" aria-label="Tutorial guiado">
      <div className="tour-backdrop" onClick={onSkip} aria-hidden="true" />
      <div
        className="tour-highlight"
        style={{
          top: highlight.top - 8,
          left: highlight.left - 8,
          width: highlight.width + 16,
          height: highlight.height + 16
        }}
      />
      <article className={`tour-popover ${step.placement ?? 'bottom'}`} style={popoverStyle}>
        <span className="tour-step-count">Passo {currentIndex + 1} de {steps.length}</span>
        <h2>{step.title}</h2>
        <p>{step.body}</p>
        <div className="tour-progress" aria-hidden="true">
          {steps.map((item, index) => <i key={item.target} className={index <= currentIndex ? 'active' : ''} />)}
        </div>
        <footer>
          <button className="ghost" onClick={onSkip}>Pular</button>
          <div>
            <button className="ghost" onClick={onBack} disabled={currentIndex === 0}>Voltar</button>
            {currentIndex === steps.length - 1
              ? <button className="primary" onClick={onFinish}>Concluir</button>
              : <button className="primary" onClick={onNext}>Próximo</button>}
          </div>
        </footer>
      </article>
    </div>,
    document.body
  );
}

function getTourPopoverStyle(rect, placement = 'bottom') {
  const width = Math.min(380, Math.max(280, window.innerWidth - 32));
  const height = 230;
  const gap = 18;
  const margin = 16;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const centerLeft = clamp(rect.left + rect.width / 2 - width / 2, margin, window.innerWidth - width - margin);

  if (placement === 'right') {
    const availableRight = window.innerWidth - (rect.left + rect.width) - margin;
    const left = availableRight >= width + gap
      ? rect.left + rect.width + gap
      : clamp(rect.left - width - gap, margin, window.innerWidth - width - margin);

    return {
      top: clamp(rect.top + rect.height / 2 - height / 2, margin, window.innerHeight - height - margin),
      left,
      width
    };
  }

  if (placement === 'top') {
    const canPlaceTop = rect.top >= height + gap + margin;
    return {
      top: canPlaceTop
        ? rect.top - height - gap
        : clamp(rect.top + rect.height + gap, margin, window.innerHeight - height - margin),
      left: centerLeft,
      width
    };
  }

  const canPlaceBottom = window.innerHeight - (rect.top + rect.height) >= height + gap + margin;
  return {
    top: canPlaceBottom
      ? rect.top + rect.height + gap
      : clamp(rect.top - height - gap, margin, window.innerHeight - height - margin),
    left: centerLeft,
    width
  };
}

function App() {
  const initialView = document.body?.dataset?.initialView || 'dashboard';
  const [view, setView] = useState(initialView);
  const [state, setState] = useState();
  const [snackbar, setSnackbar] = useState('Carregando contexto da revisão...');
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  useEffect(() => {
    const seenTour = window.localStorage.getItem('codeReviewOnboardingSeen');
    if (!seenTour) {
      window.setTimeout(() => setTourActive(true), 450);
    }
  }, []);

  useEffect(() => {
    const listener = (event) => {
      if (event.data?.type === 'dashboardState') {
        setState(event.data.payload);
        setSnackbar('Contexto da revisão atualizado.');
      }

      if (event.data?.type === 'reviewSessionStarted') {
        setState((current) => ({
          ...current,
          currentSession: event.data.payload,
          sessions: [event.data.payload, ...(current?.sessions ?? []).filter((session) => session.id !== event.data.payload.id)]
        }));
        setSnackbar('Review session iniciada.');
      }

      if (event.data?.type === 'architectureValidationCompleted') {
        setSnackbar(`${event.data.payload.count} validações arquiteturais encontradas.`);
      }

      if (event.data?.type === 'operationCompleted') {
        setSnackbar(event.data.payload.message);
      }

      if (event.data?.type === 'operationFailed') {
        setSnackbar(`Erro: ${event.data.payload.message}`);
      }
    };

    window.addEventListener('message', listener);
    vscodeApi?.postMessage({ type: 'requestState' });
    return () => window.removeEventListener('message', listener);
  }, []);

  useEffect(() => {
    if (!snackbar) return undefined;
    const timeout = window.setTimeout(() => setSnackbar(''), 3200);
    return () => window.clearTimeout(timeout);
  }, [snackbar]);

  const startReview = useMemo(() => () => vscodeApi?.postMessage({ type: 'startReview' }), []);
  const startTour = () => {
    setView('dashboard');
    setTourStep(0);
    setTourActive(true);
  };
  const finishTour = () => {
    window.localStorage.setItem('codeReviewOnboardingSeen', 'true');
    setTourActive(false);
    setSnackbar('Tutorial concluído. Você pode reabrir pelo menu lateral.');
  };

  return (
    <div className="app-shell">
      <ReviewLeftbar view={view} setView={setView} state={state} onStartTour={startTour} />
      <ReviewCenter view={view} state={state} onStartReview={startReview} />
      <Rightbar metrics={state?.metrics} state={state} onSetView={setView} onStartReview={startReview} />
      <GuidedTour
        active={tourActive}
        steps={defaultTourSteps}
        currentIndex={tourStep}
        onNext={() => setTourStep((current) => Math.min(defaultTourSteps.length - 1, current + 1))}
        onBack={() => setTourStep((current) => Math.max(0, current - 1))}
        onSkip={finishTour}
        onFinish={finishTour}
        onJumpView={setView}
      />
      {snackbar && <div className="snackbar" role="status">{snackbar}</div>}
    </div>
  );
}

function qualityLabel(score) {
  if (score >= 85) return 'Muito bom';
  if (score >= 70) return 'Bom';
  if (score >= 50) return 'Atenção';
  return 'Crítico';
}

createRoot(document.getElementById('root')).render(<App />);
