import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
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
  Info,
  ListChecks,
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

function ReviewLeftbar({ view, setView, state }) {
  const session = state?.currentSession;
  const git = state?.git;
  const nav = [
    ['dashboard', Home, 'Dashboard', '82'],
    ['analysis', AlertTriangle, 'Diagnósticos', '25'],
    ['comments', MessageSquare, 'Comentários', session?.comments?.length ? String(session.comments.length) : ''],
    ['conformities', CheckCircle2, 'Conformidades', '68'],
    ['telemetry', BarChart3, 'Telemetria', '94%'],
    ['history', Clock3, 'Histórico', '12'],
    ['settings', Settings, 'Configurações', '']
  ];

  return (
    <aside className="leftbar">
      <div className="brand">
        <div className="brand-icon"><Shield size={22} /></div>
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
          <button key={key} className={view === key ? 'active' : ''} onClick={() => setView(key)}>
            <Icon size={18} />
            <span>{label}</span>
            {badge && <b>{badge}</b>}
          </button>
        ))}
      </nav>

      <section className="rule-groups">
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
  if (view === 'telemetry') return <TelemetryCenter />;
  if (view === 'history') return <HistoryCenter state={state} />;
  if (view === 'comments') return <CommentsCenter state={state} />;
  if (view === 'settings') return <SettingsCenter />;
  if (view === 'conformities') return <ConformitiesCenter />;

  return (
    <main className="center-panel">
      <header className="center-header">
        <div>
          <span className="eyebrow">Análise da revisão</span>
          <h1>{view === 'dashboard' ? 'Dashboard de qualidade' : 'Diagnósticos encontrados'}</h1>
          <p>{state?.git ? `${state.git.currentBranch} para ${state.git.baseBranch}` : 'Resumo da revisão sem recriar Explorer, editor, tabs ou statusbar do VS Code.'}</p>
        </div>
        <div className="header-actions">
          <button onClick={() => vscodeApi?.postMessage({ type: 'requestState' })}><RefreshCw size={16} /> Atualizar</button>
          <button className="primary" onClick={onStartReview}><Play size={16} /> Executar revisão</button>
        </div>
      </header>

      <section className="summary-grid">
        <SummaryCard title="Score" value="82/100" label="Muito bom" color="green" />
        <SummaryCard title="Violações" value="25" label="-12 desde última revisão" color="red" />
        <SummaryCard title="Conformidades" value="68" label="+12 novas regras OK" color="green" />
        <SummaryCard title="Cobertura" value="94%" label="regras avaliadas" color="blue" />
      </section>

      <section className="review-workspace">
        <div className="workspace-main">
          <h2>Arquivos e achados da revisão</h2>
          <p className="muted">Use o editor real do VS Code para abrir o arquivo, diff e comentários. Esta área mostra apenas o resumo navegável.</p>
          <FindingsTable changedFiles={state?.git?.changedFiles} />
        </div>

        <aside className="workspace-side">
          <h3>Fluxo reviewer/developer</h3>
          <Timeline session={state?.currentSession} />
        </aside>
      </section>

      <ReviewSessionsPanel sessions={state?.sessions} currentSession={state?.currentSession} />
      <NavigationPanel session={state?.currentSession} git={state?.git} />
      <CommentsPanel session={state?.currentSession} />

      <section className="insight-grid">
        <InsightCard title="Inversão de Dependência" severity="Crítico" text="A camada de aplicação depende de repositório concreto. Abrir UserService.ts linha 11." />
        <InsightCard title="Muitas Responsabilidades" severity="Aviso" text="Método getUserById agrega busca, cálculo e montagem de DTO." />
        <InsightCard title="Tratamento de Erro" severity="Erro" text="Erro genérico usado em fluxo de domínio. Padronizar Result/Error." />
      </section>
    </main>
  );
}

function NavigationPanel({ session, git }) {
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
      <div className="navigation-grid">
        {targets.map(([kind, Icon, label, ref]) => (
          <button
            key={kind}
            disabled={!session}
            onClick={() => vscodeApi?.postMessage({
              type: 'navigateReview',
              payload: {
                id: session.id,
                kind,
                ref,
                file: kind === 'file' || kind === 'diff' ? ref : firstFile,
                line: kind === 'comment' && firstComment ? firstComment.line : undefined
              }
            })}
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
        <button disabled={!session || !draft.trim()} onClick={addComment}><MessageSquare size={16} /> Inserir</button>
      </div>
      <div className="comments-list">
        {session?.comments?.length ? session.comments.map((comment) => (
          <CommentItem key={comment.id} session={session} comment={comment} />
        )) : <p className="empty-state">Nenhum comentário registrado nesta sessão.</p>}
      </div>
    </section>
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

function InsightCard({ title, severity, text }) {
  return (
    <article className="insight-card">
      <div>
        <Severity label={severity === 'Crítico' ? 'Crítico' : severity === 'Erro' ? 'Erro' : 'Aviso'} />
        <MoreVertical size={18} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      <button>Abrir no editor real do VS Code</button>
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

function Rightbar() {
  return (
    <aside className="rightbar">
      <header>
        <span>Revisão atual</span>
        <div><RefreshCw size={17} /><MoreVertical size={17} /></div>
      </header>

      <section className="quality-card">
        <h4>Score de Qualidade</h4>
        <Ring />
        <strong>Muito Bom</strong>
      </section>

      <section className="kpi-stack">
        <Metric title="Conformidades" value="68" color="green" />
        <Metric title="Violações" value="25" color="red" />
        <Metric title="Cobertura de Regras" value="94%" color="green" bar />
      </section>

      <section>
        <h3>Principais problemas <a>Ver todos</a></h3>
        <Issue icon={<XCircle size={17} />} title="Inversão de Dependência" text="UserService.ts:11" label="Crítico" />
        <Issue icon={<AlertTriangle size={17} />} title="Muitas Responsabilidades" text="UserService.ts:16" label="Aviso" />
        <Issue icon={<Info size={17} />} title="Tratamento de Erro" text="UserService.ts:24" label="Erro" />
      </section>

      <section>
        <h3>Ações rápidas</h3>
        <div className="actions">
          <button><Play size={18} />Executar</button>
          <button><Wrench size={18} />Corrigir</button>
          <button><FileDown size={18} />Relatório</button>
          <button><MessageSquare size={18} />Comentar</button>
        </div>
      </section>

      <section className="telemetry-card">
        <h3>Telemetria <a>Ver dashboard</a></h3>
        <div className="telemetry-chart"><div className="donut" /><span>⌁⌁⌁⌁⌁</span></div>
      </section>
    </aside>
  );
}

function Ring() {
  return (
    <div className="ring" style={{ background: `conic-gradient(${colors.green} 0 45%, ${colors.yellow} 45% 76%, ${colors.red} 76% 82%, #253044 82% 100%)` }}>
      <div><b>82</b><small>/100</small></div>
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

function TelemetryCenter() {
  return <SimpleCenter title="Telemetria de engenharia" subtitle="Reincidências, regras mais violadas, tempo médio de correção e evolução por PR." />;
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
function SettingsCenter() {
  return <SimpleCenter title="Configurações de regras" subtitle="Perfis de arquitetura, severidades, exclusões e padrões obrigatórios por projeto." />;
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

function App() {
  const initialView = document.body?.dataset?.initialView || 'dashboard';
  const [view, setView] = useState(initialView);
  const [state, setState] = useState();

  useEffect(() => {
    const listener = (event) => {
      if (event.data?.type === 'dashboardState') {
        setState(event.data.payload);
      }

      if (event.data?.type === 'reviewSessionStarted') {
        setState((current) => ({
          ...current,
          currentSession: event.data.payload,
          sessions: [event.data.payload, ...(current?.sessions ?? []).filter((session) => session.id !== event.data.payload.id)]
        }));
      }
    };

    window.addEventListener('message', listener);
    vscodeApi?.postMessage({ type: 'requestState' });
    return () => window.removeEventListener('message', listener);
  }, []);

  const startReview = useMemo(() => () => vscodeApi?.postMessage({ type: 'startReview' }), []);

  return (
    <div className="app-shell">
      <ReviewLeftbar view={view} setView={setView} state={state} />
      <ReviewCenter view={view} state={state} onStartReview={startReview} />
      <Rightbar />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
