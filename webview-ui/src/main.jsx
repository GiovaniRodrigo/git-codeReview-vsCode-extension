import logo from '../../media/logo_128px.png';
import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import {
  Activity,
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
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  GripVertical,
  Pencil,
  Play,
  RefreshCw,
  Settings,
  Shield,
  Sparkles,
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

function ReviewLeftbar({ view, setView, state, onStartTour, onToggle }) {
  const session = state?.currentSession;
  const git = state?.git;
  const navBadges = buildNavigationBadges(state);
  const ruleGroups = buildRuleGroups(state);
  const sessionProgress = calculateSessionProgress(state);
  const nav = [
    ['dashboard', Home, 'Dashboard', navBadges.dashboard],
    ['analysis', AlertTriangle, 'Diagnósticos', navBadges.analysis],
    ['intelligence', Lightbulb, 'Inteligência', navBadges.intelligence],
    ['comments', MessageSquare, 'Comentários', navBadges.comments],
    ['collaboration', GitPullRequest, 'Colaboração', navBadges.collaboration],
    ['git-review', GitCommit, 'Git Review', navBadges.gitReview],
    ['conformities', CheckCircle2, 'Conformidades', navBadges.conformities],
    ['telemetry', BarChart3, 'Telemetria', navBadges.telemetry],
    ['history', Clock3, 'Histórico', navBadges.history],
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
        <div className="brand-text">
          <strong>Code Review</strong>
          <span>Governança arquitetural</span>
        </div>
        <button className="sidebar-toggle" title="Ocultar menu lateral esquerdo" onClick={onToggle}>
          <PanelLeftClose size={16} />
        </button>
      </div>

      <section className="review-state">
        <span>Revisão atual</span>
        <strong>{session ? `${session.sourceBranch} · ${session.status}` : `${git?.currentBranch ?? 'sem branch'} · sem sessão`}</strong>
        <div className="progress"><i style={{ width: `${sessionProgress}%` }} /></div>
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
        {ruleGroups.map((item) => (
          <RuleItem key={item.label} color={item.color} label={item.label} count={String(item.count)} />
        ))}
      </section>
    </aside>
  );
}

function buildNavigationBadges(state) {
  const session = state?.currentSession;
  const comments = session?.comments ?? [];
  const findings = session?.findings ?? [];
  const metrics = state?.metrics ?? {};
  const openComments = comments.filter((comment) => !['RESOLVED', 'APPROVED'].includes(comment.status ?? '')).length;
  const openFindings = findings.filter((finding) => finding.status !== 'APPROVED').length;
  const unreadNotifications = (session?.notifications ?? []).filter((item) => !item.read).length;
  const suggestions = state?.intelligence?.suggestions?.length ?? 0;
  const qualityScore = metrics.qualityScore ?? calculateLocalQualityScore(comments, findings);
  const conformityScore = calculateConformityScore(session);

  return {
    dashboard: `${qualityScore}`,
    analysis: openFindings + openComments ? String(openFindings + openComments) : '',
    intelligence: suggestions ? String(suggestions) : '',
    comments: comments.length ? String(comments.length) : '',
    collaboration: unreadNotifications ? String(unreadNotifications) : '',
    gitReview: state?.git?.changedFiles?.length ? String(state.git.changedFiles.length) : '',
    conformities: `${conformityScore}%`,
    telemetry: `${qualityScore}%`,
    history: state?.sessions?.length ? String(state.sessions.length) : ''
  };
}

function buildRuleGroups(state) {
  const findings = state?.currentSession?.findings ?? [];
  const byRule = (label) => findings.filter((finding) => `${finding.rule} ${finding.description ?? ''}`.toLowerCase().includes(label.toLowerCase())).length;
  const testsFailed = state?.vscode?.tests?.failed ?? state?.vscode?.testFailures?.length ?? 0;

  return [
    { color: 'red', label: 'SOLID', count: byRule('solid') + byRule('srp') + byRule('ocp') + byRule('lsp') + byRule('isp') + byRule('dip') },
    { color: 'red', label: 'Clean Architecture', count: byRule('clean architecture') + byRule('camada') + byRule('dependência') },
    { color: 'yellow', label: 'DDD', count: byRule('ddd') + byRule('bounded') + byRule('entidade') },
    { color: 'blue', label: 'Performance', count: state?.performance?.cacheEnabled ? 1 : 0 },
    { color: 'green', label: 'Testes', count: testsFailed }
  ];
}

function calculateSessionProgress(state) {
  const session = state?.currentSession;
  if (!session) return state?.git?.currentBranch ? 18 : 0;
  if (session.status === 'APPROVED') return 100;

  const comments = session.comments ?? [];
  const findings = session.findings ?? [];
  const total = comments.length + findings.length;
  if (!total) return 55;

  const done = comments.filter((comment) => ['RESOLVED', 'APPROVED'].includes(comment.status ?? '')).length
    + findings.filter((finding) => finding.status === 'APPROVED').length;
  return Math.max(20, Math.min(98, Math.round((done / total) * 100)));
}

function calculateConformityScore(session) {
  if (!session) return 0;
  const comments = session.comments ?? [];
  const findings = session.findings ?? [];
  const total = comments.length + findings.length;
  if (!total) return session.status === 'APPROVED' ? 100 : 0;
  const resolved = comments.filter((comment) => ['RESOLVED', 'APPROVED'].includes(comment.status ?? '')).length
    + findings.filter((finding) => finding.status === 'APPROVED').length;
  return Math.round((resolved / total) * 100);
}

function calculateLocalQualityScore(comments, findings) {
  const weights = { LOW: 3, MEDIUM: 7, HIGH: 12, CRITICAL: 20 };
  const commentPenalty = comments
    .filter((comment) => !['RESOLVED', 'APPROVED'].includes(comment.status ?? ''))
    .reduce((total, comment) => total + (weights[comment.severity ?? 'MEDIUM'] ?? 7), 0);
  const findingPenalty = findings
    .filter((finding) => finding.status !== 'APPROVED')
    .reduce((total, finding) => total + (weights[finding.severity ?? 'MEDIUM'] ?? 7), 0);

  return Math.max(0, 100 - commentPenalty - findingPenalty);
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
  if (view === 'dashboard') return <DashboardCenter state={state} onStartReview={onStartReview} />;
  if (view === 'analysis') return <DiagnosticsCenter state={state} onStartReview={onStartReview} />;
  if (view === 'telemetry') return <TelemetryCenter state={state} />;
  if (view === 'history') return <HistoryCenter state={state} />;
  if (view === 'intelligence') return <IntelligenceCenter state={state} />;
  if (view === 'collaboration') return <CollaborationCenter state={state} />;
  if (view === 'comments') return <CommentsCenter state={state} />;
  if (view === 'git-review') return <GitReviewCenter state={state} />;
  if (view === 'settings') return <SettingsCenter state={state} />;
  if (view === 'conformities') return <ConformitiesCenter state={state} />;

  return <DashboardCenter state={state} onStartReview={onStartReview} />;
}

function DashboardCenter({ state, onStartReview }) {
  const metrics = state?.metrics ?? {};
  const session = state?.currentSession;
  const git = state?.git ?? {};
  const problemsCount = state?.vscode?.problems?.length ?? 0;
  const failedTests = state?.vscode?.tests?.failed ?? state?.vscode?.testFailures?.length ?? 0;

  return (
    <main className="center-panel dashboard-only">
      <header className="center-header">
        <div>
          <span className="eyebrow">Dashboard</span>
          <h1>Visão executiva do review</h1>
          <p>{git.currentBranch ? `${git.currentBranch} para ${git.baseBranch}` : 'Resumo consolidado de score, status, comentários e saúde geral da sessão.'}</p>
        </div>
        <div className="header-actions" data-tour="header-actions">
          <Tooltip label="Recarregar contexto Git e sessão"><button onClick={() => vscodeApi?.postMessage({ type: 'requestState' })}><RefreshCw size={16} /> Atualizar</button></Tooltip>
          <Tooltip label="Criar ou atualizar sessão de review"><button className="primary" data-tour="start-review" onClick={onStartReview}><Play size={16} /> Executar revisão</button></Tooltip>
        </div>
      </header>
      {!state && <SkeletonPanel />}
      <section className="dashboard-hero" data-tour="quality-summary">
        <div className="hero-score-card">
          <Ring score={metrics.qualityScore ?? 100} />
          <div>
            <span className="eyebrow">Score baseado em comentários</span>
            <h2>{qualityLabel(metrics.qualityScore ?? 100)}</h2>
            <p>O score consolida comentários públicos, severidade, itens resolvidos, problems do VS Code e falhas de testes.</p>
          </div>
        </div>
        <div className="hero-status-grid">
          <div><Sparkles size={18} /><strong>{session?.status ?? 'OPEN'}</strong><span>Status da sessão/PR</span></div>
          <div><MessageSquare size={18} /><strong>{metrics.openCommentsCount ?? 0}</strong><span>Comentários abertos</span></div>
          <div><GitPullRequest size={18} /><strong>{git.changedFiles?.length ?? 0}</strong><span>Arquivos alterados</span></div>
        </div>
      </section>
      <section className="summary-grid">
        <SummaryCard title="Score" value={`${metrics.qualityScore ?? 100}/100`} label="qualidade geral" color="green" />
        <SummaryCard title="Status" value={session?.status ?? 'OPEN'} label="decisão atual" color="blue" />
        <SummaryCard title="Comentários" value={String(metrics.commentsCount ?? 0)} label={`${metrics.openCommentsCount ?? 0} abertos`} color="yellow" />
        <SummaryCard title="Bloqueios" value={String(problemsCount + failedTests)} label="Problems + testes" color="red" />
      </section>
      <section className="review-workspace dashboard-focus">
        <div className="workspace-main">
          <h2>Resumo da sessão</h2>
          <p className="muted">Esta área não substitui Diagnósticos. Ela mostra apenas o estado geral para tomada de decisão.</p>
          <Timeline session={session} />
        </div>
        <aside className="workspace-side">
          <h3>Próximas ações</h3>
          <div className="actions vertical">
            <button onClick={() => vscodeApi?.postMessage({ type: 'requestState' })}><RefreshCw size={18} /> Atualizar contexto</button>
            <button onClick={() => vscodeApi?.postMessage({ type: 'exportReviewReport' })}><FileDown size={18} /> Exportar relatório</button>
            <button className="primary" onClick={onStartReview}><Play size={18} /> Executar revisão</button>
          </div>
        </aside>
      </section>
    </main>
  );
}

function DiagnosticsCenter({ state, onStartReview }) {
  const session = state?.currentSession;
  return (
    <main className="center-panel diagnostics-only">
      <header className="center-header">
        <div>
          <span className="eyebrow">Diagnósticos</span>
          <h1>Problemas técnicos encontrados</h1>
          <p>Erros, warnings, testes, findings e comentários vinculados a arquivo/linha para correção operacional.</p>
        </div>
        <div className="header-actions">
          <button onClick={() => vscodeApi?.postMessage({ type: 'requestState' })}><RefreshCw size={16} /> Atualizar</button>
          <button className="primary" onClick={onStartReview}><Play size={16} /> Revalidar</button>
        </div>
      </header>
      <section className="summary-grid">
        <SummaryCard title="Findings" value={String(state?.metrics?.findingsCount ?? session?.comments?.length ?? 0)} label="itens técnicos" color="red" />
        <SummaryCard title="Problems" value={String(state?.vscode?.problems?.length ?? 0)} label="VS Code" color="yellow" />
        <SummaryCard title="Testes" value={String(state?.vscode?.tests?.failed ?? 0)} label="falhando" color="red" />
        <SummaryCard title="Arquivos" value={String(state?.git?.changedFiles?.length ?? 0)} label="alterados" color="blue" />
      </section>
      <section className="review-workspace">
        <div className="workspace-main">
          <h2>Arquivos, linhas e violações</h2>
          <p className="muted">Use esta tela para encontrar a causa do problema, abrir arquivo/diff e associar comentários ao trecho correto.</p>
          <div data-tour="findings-table"><FindingsTable changedFiles={state?.git?.changedFiles} /></div>
          <VSCodeContextPanel vscodeContext={state?.vscode} />
          <ValidationFindingsPanel session={session} git={state?.git} />
          <ArchitectureRulesPanel session={session} />
        </div>
        <aside className="workspace-side">
          <h3>Comentários técnicos</h3>
          <CommentsPanel session={session} />
        </aside>
      </section>
    </main>
  );
}


function GitReviewCenter({ state }) {
  const session = state?.currentSession;
  const git = state?.git ?? {};
  const baseFiles = session?.changedFiles?.length ? session.changedFiles : (git.changedFiles ?? []);
  const commits = session?.commits?.length ? session.commits : (git.commits ?? []);
  const [commitFiles, setCommitFiles] = useState([]);
  const files = commitFiles.length ? commitFiles : baseFiles;
  const [selectedFile, setSelectedFile] = useState(files[0] ?? '');
  const [selectedCommit, setSelectedCommit] = useState(commits[0]?.split(' ')[0] ?? 'HEAD');
  const [viewer, setViewer] = useState({ file: selectedFile, commit: selectedCommit, content: '', diff: '', loading: false });
  const [commentLine, setCommentLine] = useState(1);
  const [commentBody, setCommentBody] = useState('Solicitar ajuste neste trecho.');
  const [commentSeverity, setCommentSeverity] = useState('MEDIUM');
  const [commentStatus, setCommentStatus] = useState('NEEDS_CHANGES');

  const requestFile = (file = selectedFile, commit = selectedCommit) => {
    if (!file) {
      setViewer({ file: '', commit, content: '// Nenhum arquivo alterado encontrado para este contexto Git.', diff: 'Sem diff disponível.', loading: false });
      return;
    }

    setViewer((current) => ({ ...current, loading: true, file, commit }));
    vscodeApi?.postMessage({ type: 'loadGitFile', payload: { file, commit } });
  };

  const selectCommit = (commitLine) => {
    const hash = commitLine.split(' ')[0] || 'HEAD';
    setSelectedCommit(hash);
    setCommitFiles([]);
    setViewer((current) => ({ ...current, loading: true, commit: hash }));
    vscodeApi?.postMessage({ type: 'loadCommitFiles', payload: { commit: hash } });
  };

  useEffect(() => {
    if (files.length && !files.includes(selectedFile)) setSelectedFile(files[0]);
  }, [files.join('|')]);

  useEffect(() => {
    requestFile(selectedFile, selectedCommit);
  }, [selectedFile, selectedCommit]);

  useEffect(() => {
    const listener = (event) => {
      if (event.data?.type === 'gitFileLoaded') {
        setViewer({ ...event.data.payload, loading: false });
      }

      if (event.data?.type === 'commitFilesLoaded') {
        const payload = event.data.payload ?? {};
        const loadedFiles = Array.isArray(payload.files) ? payload.files : [];
        setCommitFiles(loadedFiles);
        if (loadedFiles.length) {
          setSelectedFile(loadedFiles[0]);
          requestFile(loadedFiles[0], payload.commit || selectedCommit);
        } else {
          setViewer({
            file: '',
            commit: payload.commit || selectedCommit,
            content: '// Nenhum arquivo encontrado nesse commit. Verifique se o hash pertence ao repositório aberto.',
            diff: 'Sem diff disponível para este commit.',
            loading: false
          });
        }
      }
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [selectedFile, selectedCommit]);

  const submitComment = () => {
    if (!session || !commentBody.trim()) return;
    vscodeApi?.postMessage({
      type: 'addReviewComment',
      payload: {
        id: session.id,
        body: commentBody,
        file: selectedFile,
        line: Number(commentLine) || 1,
        commit: selectedCommit,
        severity: commentSeverity,
        status: commentStatus
      }
    });
    setCommentBody('');
  };

  const visibleLines = (viewer.content || '// Selecione um arquivo alterado para visualizar o conteúdo.').split('\n').slice(0, 220);
  const visibleDiff = (viewer.diff || 'Sem diff disponível para este arquivo no contexto atual.').split('\n').slice(0, 220);

  return (
    <main className="center-panel simple git-review-center">
      <header className="center-header">
        <div>
          <span className="eyebrow">Git Review</span>
          <h1>Seguir alterações do Git</h1>
          <p>Baseie a revisão em PR, commit ou branch, abra o arquivo alterado na tela e registre comentários vinculados à linha.</p>
        </div>
        <div className="header-actions">
          <button onClick={() => vscodeApi?.postMessage({ type: 'requestState' })}><RefreshCw size={16} /> Atualizar Git</button>
          <button className="primary" onClick={() => vscodeApi?.postMessage({ type: 'startReview' })}><Play size={16} /> Criar sessão</button>
        </div>
      </header>

      <section className="git-context-grid">
        <article><GitPullRequest size={18} /><span>Origem</span><strong>{git.currentBranch ?? session?.sourceBranch ?? 'sem branch'}</strong></article>
        <article><GitCommit size={18} /><span>Base</span><strong>{git.baseBranch ?? session?.targetBranch ?? 'main'}</strong></article>
        <article><FolderOpen size={18} /><span>Arquivos</span><strong>{files.length}</strong></article>
        <article><MessageSquare size={18} /><span>Comentários</span><strong>{session?.comments?.length ?? 0}</strong></article>
      </section>

      <section className="git-review-workspace">
        <aside className="git-change-list">
          <div className="section-title compact">
            <div>
              <h2>Alterações</h2>
              <p className="muted">Arquivos vindos do diff atual.</p>
            </div>
          </div>
          <div className="git-scroll-list">
            {files.length ? files.map((file) => (
              <button key={file} className={selectedFile === file ? 'active' : ''} onClick={() => setSelectedFile(file)}>
                <FolderOpen size={15} />
                <span>{file}</span>
              </button>
            )) : <p className="empty-state">Nenhum arquivo alterado encontrado no Git.</p>}
          </div>

          <div className="section-title compact commits-title">
            <div>
              <h2>Commits</h2>
              <p className="muted">Use como referência da revisão.</p>
            </div>
          </div>
          <div className="git-scroll-list commits">
            {commits.length ? commits.slice(0, 20).map((commit) => {
              const hash = commit.split(' ')[0];
              return (
                <button key={commit} className={selectedCommit === hash ? 'active' : ''} onClick={() => selectCommit(commit)}>
                  <GitCommit size={15} />
                  <span>{commit}</span>
                </button>
              );
            }) : <p className="empty-state">Nenhum commit listado.</p>}
          </div>
        </aside>

        <section className="git-file-viewer">
          <div className="file-viewer-toolbar">
            <div>
              <span className="eyebrow">Arquivo selecionado</span>
              <h2>{selectedFile}</h2>
              <p className="muted">Commit/base: {selectedCommit}</p>
            </div>
            <div className="header-actions">
              <button disabled={!selectedFile} onClick={() => { requestFile(selectedFile, selectedCommit); vscodeApi?.postMessage({ type: 'openWorkspaceFile', payload: { file: selectedFile, line: Number(commentLine) || 1, commit: selectedCommit } }); }}>Abrir no VS Code</button>
              <button disabled={!selectedFile} onClick={() => { requestFile(selectedFile, selectedCommit); vscodeApi?.postMessage({ type: 'openDiff', payload: { file: selectedFile, line: Number(commentLine) || 1, commit: selectedCommit } }); }}>Abrir diff</button>
            </div>
          </div>

          <div className="split-code-review">
            <div className="code-pane">
              <h3>Conteúdo do arquivo {viewer.loading ? '· carregando...' : ''}</h3>
              <pre aria-busy={viewer.loading}>{visibleLines.map((line, index) => (
                <button key={`${index}-${line}`} className={Number(commentLine) === index + 1 ? 'code-line active' : 'code-line'} onClick={() => setCommentLine(index + 1)}>
                  <span>{index + 1}</span><code>{line || ' '}</code>
                </button>
              ))}</pre>
            </div>
            <div className="code-pane diff-pane">
              <h3>Diff do Git {viewer.loading ? '· carregando...' : ''}</h3>
              <pre>{visibleDiff.map((line, index) => <code key={`${index}-${line}`} className={line.startsWith('+') ? 'added' : line.startsWith('-') ? 'removed' : ''}>{line || ' '}</code>)}</pre>
            </div>
          </div>
        </section>

        <aside className="git-comment-panel">
          <h2>Comentário inline</h2>
          <p className="muted">O comentário fica vinculado ao arquivo, linha e commit selecionados.</p>
          <label>Arquivo<input value={selectedFile} readOnly /></label>
          <label>Linha<input type="number" min="1" value={commentLine} onChange={(event) => setCommentLine(event.target.value)} /></label>
          <label>Commit<input value={selectedCommit} onChange={(event) => setSelectedCommit(event.target.value)} /></label>
          <label>Severidade<select value={commentSeverity} onChange={(event) => setCommentSeverity(event.target.value)}><option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option><option value="CRITICAL">Crítica</option></select></label>
          <label>Status<select value={commentStatus} onChange={(event) => setCommentStatus(event.target.value)}><option value="OPEN">Aberto</option><option value="NEEDS_CHANGES">Ajuste solicitado</option><option value="RESOLVED">Resolvido</option><option value="APPROVED">Aprovado</option></select></label>
          <label>Comentário<textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} /></label>
          <button className="primary full" disabled={!session || !selectedFile || !commentBody.trim()} onClick={submitComment}><MessageSquare size={16} /> Publicar comentário</button>
          {!session && <p className="empty-state">Crie uma sessão de review antes de comentar.</p>}
          <div className="comments-list compact-comments">
            {(session?.comments ?? []).filter((comment) => comment.file === selectedFile).map((comment) => (
              <article key={comment.id} className="comment-item">
                <header><span>{comment.file}:{comment.line}</span></header>
                <p>{comment.body}</p>
                <small>{comment.commit ?? 'sem commit'} · {comment.severity ?? 'MEDIUM'} · {comment.status ?? 'NEEDS_CHANGES'} · público</small>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

function SmartDiffPanel({ changedFiles = [] }) {
  const files = changedFiles.length ? changedFiles.slice(0, 3) : ['src/Application/UserService.ts', 'src/Infrastructure/UserRepository.ts', 'src/Presentation/AuthController.ts'];
  return (
    <section className="smart-diff-panel" aria-label="Diff inteligente arquitetural">
      <div className="section-title compact">
        <div>
          <h2>Diff inteligente</h2>
          <p className="muted">Impacto arquitetural por camada, arquivo e regra.</p>
        </div>
        <Badge>Preview</Badge>
      </div>
      <div className="diff-map">
        {files.map((file, index) => (
          <article key={file} className={index === 0 ? 'hotspot' : ''}>
            <span>{index === 0 ? 'Aplicação' : index === 1 ? 'Infraestrutura' : 'Interface'}</span>
            <strong>{file}</strong>
            <small>{index === 0 ? 'DIP crítico · abrir comentário inline' : index === 1 ? 'Persistência concreta isolada' : 'Endpoint sem violação crítica'}</small>
          </article>
        ))}
      </div>
    </section>
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

function CommentsPanel({ session, full = false }) {
  const files = useMemo(() => {
    const fromSession = session?.changedFiles ?? [];
    const fromComments = (session?.comments ?? []).map((comment) => comment.file).filter(Boolean);
    return Array.from(new Set([...fromSession, ...fromComments])).filter(Boolean);
  }, [session]);
  const comments = session?.comments ?? [];
  const [selectedFile, setSelectedFile] = useState(files[0] ?? '');
  const [draft, setDraft] = useState('Revisar responsabilidade deste trecho.');
  const [line, setLine] = useState(1);
  const [severity, setSeverity] = useState('MEDIUM');
  const [status, setStatus] = useState('NEEDS_CHANGES');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [fileFilter, setFileFilter] = useState('ALL');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!selectedFile && files.length) setSelectedFile(files[0]);
    if (selectedFile && files.length && !files.includes(selectedFile)) setSelectedFile(files[0]);
  }, [files, selectedFile]);

  const filteredComments = comments.filter((comment) => {
    const byStatus = statusFilter === 'ALL' || (comment.status ?? 'NEEDS_CHANGES') === statusFilter;
    const bySeverity = severityFilter === 'ALL' || (comment.severity ?? 'MEDIUM') === severityFilter;
    const byFile = fileFilter === 'ALL' || comment.file === fileFilter;
    const text = `${comment.body ?? ''} ${comment.file ?? ''} ${comment.commit ?? ''}`.toLowerCase();
    const byQuery = !query.trim() || text.includes(query.toLowerCase());
    return byStatus && bySeverity && byFile && byQuery;
  });

  const groupedComments = filteredComments.reduce((groups, comment) => {
    const key = comment.file || 'sem-arquivo';
    groups[key] = groups[key] ?? [];
    groups[key].push(comment);
    return groups;
  }, {});

  const openCount = comments.filter((comment) => !['RESOLVED', 'APPROVED'].includes(comment.status ?? 'NEEDS_CHANGES')).length;
  const criticalCount = comments.filter((comment) => (comment.severity ?? 'MEDIUM') === 'CRITICAL').length;
  const resolvedCount = comments.filter((comment) => ['RESOLVED', 'APPROVED'].includes(comment.status ?? '')).length;
  const impact = calculateCommentImpact(comments);

  const addComment = () => {
    if (!session || !draft.trim() || !selectedFile) return;
    vscodeApi?.postMessage({
      type: 'addReviewComment',
      payload: {
        id: session.id,
        body: draft,
        file: selectedFile,
        line: Number(line) || 1,
        commit: session.commits?.[0],
        severity,
        status
      }
    });
    setDraft('');
  };

  return (
    <section className={full ? 'comments-workspace' : 'sessions-panel'}>
      <div className="section-title">
        <div>
          <h2>Comentários</h2>
          <p className="muted">Central oficial da discussão técnica: arquivo, linha, severidade, status, thread e impacto no score.</p>
        </div>
        {full && <Badge>{comments.length} públicos</Badge>}
      </div>

      {full && (
        <section className="comment-impact-grid" aria-label="Impacto dos comentários">
          <SummaryCard title="Impacto no score" value={`-${impact}`} label="penalidade atual" color={impact > 25 ? 'red' : impact > 10 ? 'yellow' : 'green'} />
          <SummaryCard title="Abertos" value={String(openCount)} label="bloqueiam decisão" color="yellow" />
          <SummaryCard title="Críticos" value={String(criticalCount)} label="risco alto" color="red" />
          <SummaryCard title="Resolvidos" value={String(resolvedCount)} label="concluídos" color="green" />
        </section>
      )}

      <div className="comment-form enhanced-comment-form">
        <select value={selectedFile} onChange={(event) => setSelectedFile(event.target.value)} aria-label="Arquivo do comentário">
          {files.length ? files.map((file) => <option key={file} value={file}>{file}</option>) : <option value="">Sem arquivo carregado</option>}
        </select>
        <input type="number" min="1" value={line} onChange={(event) => setLine(event.target.value)} aria-label="Linha" />
        <select value={severity} onChange={(event) => setSeverity(event.target.value)} aria-label="Severidade"><option value="LOW">Baixa</option><option value="MEDIUM">Média</option><option value="HIGH">Alta</option><option value="CRITICAL">Crítica</option></select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Status"><option value="OPEN">Aberto</option><option value="NEEDS_CHANGES">Ajuste solicitado</option><option value="RESOLVED">Resolvido</option><option value="APPROVED">Aprovado</option></select>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Comentário técnico público" />
        <Tooltip label="Adicionar comentário público vinculado ao arquivo e linha">
          <button disabled={!session || !selectedFile || !draft.trim()} onClick={addComment}><MessageSquare size={16} /> Inserir</button>
        </Tooltip>
      </div>

      {full && (
        <div className="comments-toolbar" aria-label="Filtros de comentários">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar comentário, arquivo ou commit" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">Todos status</option>
            <option value="OPEN">Abertos</option>
            <option value="NEEDS_CHANGES">Ajuste solicitado</option>
            <option value="RESOLVED">Resolvidos</option>
            <option value="APPROVED">Aprovados</option>
          </select>
          <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)}>
            <option value="ALL">Todas severidades</option>
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
            <option value="CRITICAL">Crítica</option>
          </select>
          <select value={fileFilter} onChange={(event) => setFileFilter(event.target.value)}>
            <option value="ALL">Todos arquivos</option>
            {files.map((file) => <option key={file} value={file}>{file}</option>)}
          </select>
        </div>
      )}

      <div className="comments-list grouped-comments">
        {Object.keys(groupedComments).length ? Object.entries(groupedComments).map(([file, items]) => (
          <section className="comment-file-group" key={file}>
            {full && <header><strong>{file}</strong><span>{items.length} comentário(s)</span></header>}
            {items.map((comment) => <CommentItem key={comment.id} session={session} comment={comment} showThread={full} />)}
          </section>
        )) : <p className="empty-state">Nenhum comentário encontrado para os filtros atuais.</p>}
      </div>
    </section>
  );
}

function calculateCommentImpact(comments = []) {
  const weights = { LOW: 3, MEDIUM: 7, HIGH: 12, CRITICAL: 20 };
  return comments.reduce((total, comment) => {
    if (['RESOLVED', 'APPROVED'].includes(comment.status ?? '')) return total;
    return total + (weights[comment.severity ?? 'MEDIUM'] ?? 7);
  }, 0);
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
  const [mention, setMention] = useState(session?.author ?? 'dev');
  const [threadTarget, setThreadTarget] = useState(session?.comments?.[0]?.threadId ?? 'review-geral');
  const firstFile = session?.changedFiles?.[0] ?? '';
  const moduleName = firstFile ? firstFile.split('/').slice(0, 2).join('/') || firstFile : 'módulo atual';
  const comments = session?.comments ?? [];
  const findings = session?.findings ?? [];
  const messages = session?.collaborationMessages ?? [];
  const notifications = session?.notifications ?? [];
  const participants = buildCollaborationParticipants(session);
  const pendingByPerson = buildPendingByPerson(session);
  const waitingDev = comments.filter((comment) => ['OPEN', 'NEEDS_CHANGES'].includes(comment.status ?? 'NEEDS_CHANGES')).length + findings.filter((finding) => ['NEEDS_CHANGES', 'REOPENED'].includes(finding.status ?? 'NEEDS_CHANGES')).length;
  const waitingReviewer = comments.filter((comment) => comment.status === 'RESOLVED').length + findings.filter((finding) => finding.status === 'FIXED').length;
  const blocked = Boolean(session?.mergeDecision?.blocked) || comments.some((comment) => comment.severity === 'CRITICAL' && !['RESOLVED', 'APPROVED'].includes(comment.status ?? ''));
  const workflowState = blocked ? 'BLOQUEADO' : waitingDev > 0 ? 'AGUARDANDO DEV' : waitingReviewer > 0 ? 'AGUARDANDO REVIEWER' : 'PRONTO PARA APROVAÇÃO';
  const threadOptions = Array.from(new Set(['review-geral', ...comments.map((comment) => comment.threadId || `${comment.file}:${comment.line}`), ...messages.map((item) => item.threadId)])).filter(Boolean);
  const selectedThreadMessages = messages.filter((item) => (item.threadId || item.id) === threadTarget);
  const assigneeOptions = Array.from(new Set([session?.author, session?.reviewer, 'dev', 'reviewer', ...comments.map((comment) => comment.author)])).filter(Boolean);

  useEffect(() => {
    if (session?.author && mention === 'dev') setMention(session.author);
  }, [session?.author]);

  const sendMessage = () => {
    if (!session || !message.trim()) return;
    const body = message.includes('@') ? message : `@${mention} ${message}`;
    vscodeApi?.postMessage({ type: 'addCollaborationMessage', payload: { id: session.id, body, threadId: threadTarget } });
    setMessage('');
  };

  return (
    <section className="sessions-panel collaboration-workspace">
      <div className="section-title">
        <div>
          <h2>Colaboração</h2>
          <p className="muted">Central operacional do fluxo humano: papéis, responsáveis, pendências, threads, menções, aprovações e bloqueios.</p>
        </div>
        <span className={blocked ? 'merge blocked' : 'merge'}>{workflowState}</span>
      </div>

      <section className="collaboration-status-grid">
        <SummaryCard title="Aguardando dev" value={String(waitingDev)} label="correções pendentes" color={waitingDev ? 'yellow' : 'green'} />
        <SummaryCard title="Aguardando reviewer" value={String(waitingReviewer)} label="validações pendentes" color={waitingReviewer ? 'blue' : 'green'} />
        <SummaryCard title="Bloqueios" value={String(session?.mergeDecision?.reasons?.length ?? (blocked ? 1 : 0))} label="impedem merge" color={blocked ? 'red' : 'green'} />
        <SummaryCard title="Notificações" value={String(notifications.filter((item) => !item.read).length)} label="menções não lidas" color="blue" />
      </section>

      <section className="collaboration-layout">
        <aside className="collaboration-side">
          <section className="sessions-panel nested-panel">
            <div className="section-title"><h2>Papéis da revisão</h2></div>
            <div className="participant-list">
              {participants.map((person) => (
                <article key={`${person.role}-${person.name}`} className="participant-card">
                  <strong>{person.name}</strong>
                  <span>{person.role}</span>
                  <Badge>{person.state}</Badge>
                </article>
              ))}
            </div>
          </section>

          <section className="sessions-panel nested-panel">
            <div className="section-title"><h2>Pendências por pessoa</h2></div>
            <div className="ownership-list">
              {pendingByPerson.length ? pendingByPerson.map((item) => (
                <article key={item.name} className="ownership-card">
                  <div><strong>{item.name}</strong><span>{item.role}</span></div>
                  <b>{item.count}</b>
                  <small>{item.description}</small>
                </article>
              )) : <p className="empty-state">Sem pendências atribuídas.</p>}
            </div>
          </section>
        </aside>

        <section className="collaboration-main">
          <div className="collab-form collaboration-message-form">
            <select value={threadTarget} onChange={(event) => setThreadTarget(event.target.value)} aria-label="Thread alvo">
              {threadOptions.map((thread) => <option key={thread} value={thread}>{thread}</option>)}
            </select>
            <select value={mention} onChange={(event) => setMention(event.target.value)} aria-label="Pessoa mencionada">
              {assigneeOptions.map((person) => <option key={person} value={person}>{person}</option>)}
            </select>
            <input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Mensagem com @menção" />
            <button disabled={!session || !message.trim()} onClick={sendMessage}><MessageSquare size={16} /> Enviar</button>
          </div>

          <div className="workflow-actions collaboration-actions">
            <button disabled={!session || !firstFile} onClick={() => vscodeApi?.postMessage({ type: 'approvePartial', payload: { id: session.id, scope: 'file', target: firstFile } })}>Aprovar arquivo</button>
            <button disabled={!session || !firstFile} onClick={() => vscodeApi?.postMessage({ type: 'approvePartial', payload: { id: session.id, scope: 'module', target: moduleName } })}>Aprovar módulo</button>
            <button disabled={!session} onClick={() => vscodeApi?.postMessage({ type: 'refreshMergeDecision', payload: { id: session.id } })}>Atualizar bloqueio</button>
          </div>

          <section className="sessions-panel nested-panel">
            <div className="section-title"><h2>Threads e respostas</h2><Badge>{threadTarget}</Badge></div>
            <div className="thread-board">
              {comments.filter((comment) => (comment.threadId || `${comment.file}:${comment.line}`) === threadTarget).map((comment) => (
                <article key={comment.id} className="thread-message reviewer-message">
                  <strong>{comment.author || 'reviewer'}</strong>
                  <span>{comment.file}:{comment.line} · {comment.severity} · {comment.status}</span>
                  <p>{comment.body}</p>
                </article>
              ))}
              {selectedThreadMessages.length ? selectedThreadMessages.map((item) => (
                <article key={item.id} className="thread-message">
                  <strong>{item.author}</strong>
                  <span>{item.mentions?.length ? `menciona ${item.mentions.map((m) => `@${m}`).join(', ')}` : 'mensagem geral'}</span>
                  <p>{item.body}</p>
                </article>
              )) : <p className="empty-state">Sem respostas colaborativas nessa thread.</p>}
            </div>
          </section>
        </section>
      </section>

      <section className="collab-grid collaboration-evidence-grid">
        <TextListPanel title="Comentários aguardando resposta" items={comments.filter((comment) => !['RESOLVED', 'APPROVED'].includes(comment.status ?? '')).map((comment) => `${comment.file}:${comment.line} · ${comment.status} · responsável: ${session?.author ?? 'dev'}`)} />
        <TextListPanel title="Bloqueios de merge" items={(session?.mergeDecision?.reasons ?? []).length ? session.mergeDecision.reasons : (blocked ? ['Comentário crítico aberto ou validação pendente.'] : [])} />
        <TextListPanel title="Aprovações parciais" items={(session?.partialApprovals ?? []).map((approval) => `${approval.reviewer} aprovou ${approval.scope}: ${approval.target}`)} />
      </section>
    </section>
  );
}

function buildCollaborationParticipants(session) {
  if (!session) return [];
  const reviewer = session.reviewer || 'reviewer';
  const author = session.author || 'dev';
  const mentioned = Array.from(new Set((session.notifications ?? []).map((item) => item.recipient))).filter((name) => ![reviewer, author].includes(name));
  return [
    { name: reviewer, role: 'Reviewer', state: session.mergeDecision?.blocked ? 'validando bloqueios' : 'apto a aprovar' },
    { name: author, role: 'Developer', state: (session.comments ?? []).some((comment) => !['RESOLVED', 'APPROVED'].includes(comment.status ?? '')) ? 'corrigir pendências' : 'sem pendências' },
    ...mentioned.map((name) => ({ name, role: 'Mencionado', state: 'aguardando resposta' }))
  ];
}

function buildPendingByPerson(session) {
  if (!session) return [];
  const rows = [];
  const author = session.author || 'dev';
  const reviewer = session.reviewer || 'reviewer';
  const devPending = (session.comments ?? []).filter((comment) => ['OPEN', 'NEEDS_CHANGES'].includes(comment.status ?? 'NEEDS_CHANGES')).length
    + (session.findings ?? []).filter((finding) => ['NEEDS_CHANGES', 'REOPENED'].includes(finding.status ?? 'NEEDS_CHANGES')).length;
  const reviewerPending = (session.comments ?? []).filter((comment) => comment.status === 'RESOLVED').length
    + (session.findings ?? []).filter((finding) => finding.status === 'FIXED').length;
  if (devPending) rows.push({ name: author, role: 'Developer', count: devPending, description: 'itens aguardando correção ou resposta' });
  if (reviewerPending) rows.push({ name: reviewer, role: 'Reviewer', count: reviewerPending, description: 'itens aguardando revalidação' });
  (session.notifications ?? []).filter((item) => !item.read).forEach((item) => rows.push({ name: item.recipient, role: 'Mencionado', count: 1, description: item.message }));
  return rows;
}


function VSCodeContextPanel({ vscodeContext }) {
  const problems = vscodeContext?.problems ?? [];
  const tests = vscodeContext?.tests ?? { available: false, lastRunStatus: 'NOT_RUN' };

  return (
    <section className="sessions-panel vscode-context-panel">
      <div className="section-title">
        <div>
          <h2>VS Code: Problems e Testes</h2>
          <p className="muted">Erros reais da aba Problems e integração com o Test Explorer disponível no VS Code.</p>
        </div>
        <button className="panel-action" onClick={() => vscodeApi?.postMessage({ type: 'runVSCodeTests' })}>
          <Play size={16} /> Executar testes do VS Code
        </button>
      </div>
      <div className="vscode-context-grid">
        <article>
          <strong>{problems.length}</strong>
          <span>Problemas detectados</span>
          <small>{problems.filter((item) => item.severity === 'Error').length} erros · {problems.filter((item) => item.severity === 'Warning').length} avisos</small>
        </article>
        <article>
          <strong>{tests.available ? 'Disponível' : 'Indisponível'}</strong>
          <span>Test Explorer</span>
          <small>{tests.lastRunStatus}{tests.lastRunAt ? ` · ${new Date(tests.lastRunAt).toLocaleString()}` : ''}</small>
        </article>
      </div>
      <div className="problems-list">
        {problems.length ? problems.slice(0, 8).map((problem, index) => (
          <button key={`${problem.file}-${problem.line}-${index}`} onClick={() => vscodeApi?.postMessage({ type: 'openWorkspaceFile', payload: { file: problem.file, line: problem.line } })}>
            <AlertTriangle size={15} />
            <span><strong>{problem.file}:{problem.line}</strong><small>{problem.severity} · {problem.source ?? 'VS Code'} · {problem.message}</small></span>
          </button>
        )) : <p className="empty-state">Nenhum problema ativo na aba Problems para o workspace atual.</p>}
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

function CommentItem({ session, comment, showThread = false }) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);
  const history = comment.history ?? [];
  const threadLabel = comment.threadId || `${comment.file}:${comment.line}`;

  const openFile = () => vscodeApi?.postMessage({
    type: 'openWorkspaceFile',
    payload: { file: comment.file, line: comment.line ?? 1, commit: comment.commit ?? 'HEAD' }
  });
  const openDiff = () => vscodeApi?.postMessage({
    type: 'openDiff',
    payload: { file: comment.file, line: comment.line ?? 1, commit: comment.commit ?? 'HEAD' }
  });

  return (
    <article className={`comment-item severity-${(comment.severity ?? 'MEDIUM').toLowerCase()}`}>
      <header>
        <span>{comment.file}:{comment.line}</span>
        <div className="comment-header-actions">
          <button onClick={openFile}>Arquivo</button>
          <button onClick={openDiff}>Diff</button>
          <button onClick={() => setEditing((value) => !value)}><Pencil size={15} /></button>
        </div>
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
      <div className="comment-meta-row">
        <Badge>{comment.severity ?? 'MEDIUM'}</Badge>
        <Badge>{comment.status ?? 'NEEDS_CHANGES'}</Badge>
        <Badge>{comment.commit ?? 'sem commit'}</Badge>
        <Badge>público</Badge>
      </div>
      <div className="finding-actions">
        {['OPEN', 'NEEDS_CHANGES', 'RESOLVED', 'APPROVED'].map((status) => (
          <button
            key={status}
            className={(comment.status ?? 'NEEDS_CHANGES') === status ? 'active' : ''}
            onClick={() => vscodeApi?.postMessage({ type: 'updateReviewCommentStatus', payload: { id: session.id, commentId: comment.id, status } })}
          >
            {status}
          </button>
        ))}
      </div>
      {showThread && (
        <section className="comment-thread">
          <strong>Thread {threadLabel}</strong>
          <div className="thread-line"><span>Reviewer</span><p>{comment.body}</p></div>
          {history.length ? history.slice(-3).map((item, index) => (
            <div className="thread-line" key={`${comment.id}-history-${index}`}><span>{item.author ?? 'sistema'}</span><p>{item.body ?? item.status ?? 'alteração registrada'}</p></div>
          )) : <small>Sem respostas ou edições adicionais.</small>}
        </section>
      )}
      <small>{history.length} edição(ões) · impacto estimado: -{['RESOLVED', 'APPROVED'].includes(comment.status ?? '') ? 0 : ({ LOW: 3, MEDIUM: 7, HIGH: 12, CRITICAL: 20 }[comment.severity ?? 'MEDIUM'] ?? 7)} ponto(s)</small>
    </article>
  );
}


function SummaryCard({ title, value, label, color }) {
  return (
    <div className={`summary-card accent-${color}`}>
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
    <div className="table-shell">
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
    </div>
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

function Rightbar({ metrics, state, onSetView, onStartReview, onToggle }) {
  return (
    <aside className="rightbar">
      <header>
        <span>Revisão atual</span>
        <div>
          <button className="sidebar-toggle inline" title="Ocultar painel lateral direito" onClick={onToggle}><PanelRightClose size={16} /></button>
          <RefreshCw size={17} />
          <MoreVertical size={17} />
        </div>
      </header>

      <section className="quality-card">
        <h4>Score de Qualidade</h4>
        <Ring score={metrics?.qualityScore ?? 100} />
        <strong>{qualityLabel(metrics?.qualityScore ?? 100)}</strong>
      </section>

      <section className="kpi-stack">
        <Metric title="Comentários" value={String(metrics?.commentsCount ?? 0)} color="red" />
        <Metric title="Problems" value={String(state?.vscode?.problems?.length ?? 0)} color="yellow" />
        <Metric title="Abertos" value={String(metrics?.openCommentsCount ?? 0)} color="green" bar />
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
  const hotspots = intelligence.hotspots ?? [];
  const moduleHotspots = intelligence.moduleHotspots ?? [];
  const correlations = intelligence.correlations ?? [];
  const riskAnalysis = intelligence.riskAnalysis ?? [];
  const topRisk = Math.max(0, ...hotspots.map((item) => item.riskScore ?? 0), ...moduleHotspots.map((item) => item.riskScore ?? 0));

  return (
    <main className="center-panel simple intelligence-page">
      <header className="center-header">
        <div>
          <span className="eyebrow">Inteligência</span>
          <h1>Interpretação analítica da revisão</h1>
          <p>Transforma comentários, findings, histórico, Problems e testes em riscos, hotspots e recomendações acionáveis.</p>
        </div>
      </header>
      <section className="summary-grid">
        <SummaryCard title="Hotspots" value={String(hotspots.length + moduleHotspots.length)} label="arquivos e módulos críticos" color="red" />
        <SummaryCard title="Correlação" value={String(correlations.length)} label="comentários + findings" color="yellow" />
        <SummaryCard title="Risco" value={String(topRisk)} label="maior pontuação local" color={topRisk >= 10 ? 'red' : 'blue'} />
        <SummaryCard title="Recomendações" value={String(intelligence.recommendations?.length ?? 0)} label="ações propostas" color="green" />
      </section>
      <section className="intelligence-layout">
        <div className="intelligence-main">
          <IntelligenceRiskPanel risks={riskAnalysis} />
          <HotspotPanel title="Hotspots por arquivo" items={hotspots} />
          <CorrelationPanel correlations={correlations} />
          <IntelligencePanel intelligence={intelligence} />
        </div>
        <aside className="intelligence-side">
          <HotspotPanel title="Hotspots por módulo" items={moduleHotspots} compact />
          <TextListPanel title="Recomendações inteligentes" items={intelligence.recommendations ?? []} />
          <TextListPanel title="Padrões detectados" items={intelligence.patterns ?? []} />
          <TextListPanel title="Comparação histórica" items={intelligence.comparisons ?? []} />
          <TextListPanel title="Erros recorrentes" items={(intelligence.recurringErrors ?? []).map((item) => `${item.rule}: ${item.count}`)} />
        </aside>
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

function IntelligenceRiskPanel({ risks = [] }) {
  return (
    <section className="sessions-panel intelligence-risk">
      <div className="section-title">
        <div>
          <h2>Análise de risco arquitetural</h2>
          <p className="muted">Interpretação dos sinais combinados da sessão atual e do histórico local.</p>
        </div>
      </div>
      <div className="risk-list">
        {risks.length ? risks.map((risk) => (
          <article key={risk}>
            <Shield size={18} />
            <p>{risk}</p>
          </article>
        )) : <p className="empty-state">Sem dados suficientes para risco arquitetural.</p>}
      </div>
    </section>
  );
}

function HotspotPanel({ title, items = [], compact = false }) {
  return (
    <section className={`sessions-panel hotspot-panel ${compact ? 'compact' : ''}`}>
      <div className="section-title">
        <div>
          <h2>{title}</h2>
          <p className="muted">Concentração de comentários, findings e severidade.</p>
        </div>
      </div>
      <div className="hotspot-list">
        {items.length ? items.map((item) => (
          <article key={`${item.kind}-${item.target}`}>
            <div className="hotspot-head">
              <strong>{item.target}</strong>
              <Badge>risco {item.riskScore}</Badge>
            </div>
            <div className="hotspot-meter"><i style={{ width: `${Math.min(100, (item.riskScore / 20) * 100)}%` }} /></div>
            <div className="hotspot-meta">
              <span>{item.comments} comentários</span>
              <span>{item.findings} findings</span>
              <span>{item.critical} críticos</span>
            </div>
          </article>
        )) : <p className="empty-state">Nenhum hotspot detectado ainda.</p>}
      </div>
    </section>
  );
}

function CorrelationPanel({ correlations = [] }) {
  return (
    <section className="sessions-panel correlation-panel">
      <div className="section-title">
        <div>
          <h2>Correlação entre comentários e sinais técnicos</h2>
          <p className="muted">Relaciona comentários públicos com findings e sinais altos/críticos por arquivo.</p>
        </div>
      </div>
      <div className="correlation-list">
        {correlations.length ? correlations.map((item) => (
          <article key={item.target}>
            <header>
              <strong>{item.target}</strong>
              <Badge>{item.criticalSignals} sinais fortes</Badge>
            </header>
            <p>{item.interpretation}</p>
            <div className="correlation-metrics">
              <span>{item.comments} comentários</span>
              <span>{item.openComments} abertos</span>
              <span>{item.findings} findings</span>
            </div>
          </article>
        )) : <p className="empty-state">Sem correlações suficientes ainda.</p>}
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
  const sessions = state?.sessions ?? [];
  return (
    <main className="center-panel simple">
      <header className="center-header">
        <div><span className="eyebrow">Code Review</span><h1>Histórico de revisões</h1><p>Linha do tempo de reviews, correções, revalidações e decisões de aprovação.</p></div>
      </header>
      <section className="history-toolbar" aria-label="Filtros do histórico">
        <button className="active">Todas</button>
        <button>Com ajuste</button>
        <button>Aprovadas</button>
        <button>Reabertas</button>
        <span>{sessions.length} sessões registradas</span>
      </section>
      <section className="history-layout">
        <ReviewSessionsPanel sessions={sessions} currentSession={state?.currentSession} />
        <section className="review-workspace single history-detail">
          <div className="workspace-main">
            <h2>Timeline da sessão atual</h2>
            <Timeline session={state?.currentSession} />
          </div>
        </section>
      </section>
    </main>
  );
}
function CommentsCenter({ state }) {
  const session = state?.currentSession;
  return (
    <main className="center-panel simple comments-only">
      <header className="center-header">
        <div>
          <span className="eyebrow">Code Review</span>
          <h1>Comentários da revisão</h1>
          <p>Discussão pública vinculada a arquivo, linha, commit e decisão da sessão.</p>
        </div>
        <div className="header-actions">
          <button disabled={!session} onClick={() => vscodeApi?.postMessage({ type: 'exportReviewReport' })}><FileDown size={16} /> Exportar discussão</button>
          <button disabled={!session} className="primary" onClick={() => vscodeApi?.postMessage({ type: 'refreshMergeDecision', payload: { id: session?.id } })}><RefreshCw size={16} /> Recalcular score/status</button>
        </div>
      </header>
      <CommentsPanel session={session} full />
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

function ConformitiesCenter({ state }) {
  const comments = state?.currentSession?.comments ?? [];
  const resolved = comments.filter((comment) => ['RESOLVED', 'APPROVED'].includes(comment.status)).length;
  const total = comments.length || 1;
  const adherence = Math.round((resolved / total) * 100);
  const conformities = [
    ['Comentários públicos', 'Comentários vinculados a arquivo, linha e commit.', comments.length ? 'Com evidência' : 'Aguardando comentários'],
    ['Score rastreável', 'Pontuação derivada de severidade, status e Problems/Testes.', 'Ativo'],
    ['Integração VS Code', 'Leitura de Problems, abertura de arquivo e diff.', 'Ativo'],
    ['Fluxo reviewer/dev', 'Status da sessão orientado por comentários.', state?.currentSession?.status ?? 'OPEN'],
    ['Histórico auditável', 'Sessões, eventos e alterações ficam registradas.', `${state?.sessions?.length ?? 0} sessões`]
  ];

  return (
    <main className="center-panel simple conformities-only">
      <header className="center-header">
        <div>
          <span className="eyebrow">Conformidades</span>
          <h1>Boas práticas atendidas</h1>
          <p>Esta tela mostra aderências e evidências positivas. Problemas, erros e violações ficam em Diagnósticos.</p>
        </div>
      </header>
      <section className="summary-grid">
        <SummaryCard title="Aderência" value={`${adherence}%`} label="comentários resolvidos/aprovados" color="green" />
        <SummaryCard title="Evidências" value={String(conformities.length)} label="práticas mapeadas" color="blue" />
        <SummaryCard title="Resolvidos" value={String(resolved)} label="comentários concluídos" color="green" />
        <SummaryCard title="Status" value={state?.currentSession?.status ?? 'OPEN'} label="sessão atual" color="yellow" />
      </section>
      <section className="sessions-panel">
        <div className="section-title">
          <div>
            <h2>Evidências de conformidade</h2>
            <p className="muted">Lista positiva de práticas atendidas ou prontas para auditoria.</p>
          </div>
        </div>
        <div className="conformity-list">
          {conformities.map(([title, description, status]) => (
            <article className="conformity-item" key={title}>
              <CheckCircle2 size={18} />
              <div><strong>{title}</strong><p>{description}</p></div>
              <Badge>{status}</Badge>
            </article>
          ))}
        </div>
      </section>
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
  const height = Math.min(260, Math.max(210, window.innerHeight - 32));
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


function ResizeHandle({ side, onResizeStart }) {
  return (
    <button
      className={`resize-handle ${side}`}
      title="Redimensionar painel lateral"
      aria-label="Redimensionar painel lateral"
      onMouseDown={(event) => onResizeStart(event, side)}
    >
      <GripVertical size={14} />
    </button>
  );
}

function CollapsedSidebarToggle({ side, onToggle }) {
  const Icon = side === 'left' ? PanelLeftOpen : PanelRightOpen;
  const label = side === 'left' ? 'Mostrar menu lateral esquerdo' : 'Mostrar painel lateral direito';
  return (
    <aside className={`collapsed-sidebar ${side}`}>
      <button title={label} aria-label={label} onClick={onToggle}>
        <Icon size={18} />
      </button>
    </aside>
  );
}

function App() {
  const initialView = document.body?.dataset?.initialView || 'dashboard';
  const [view, setView] = useState(initialView);
  const [state, setState] = useState();
  const [snackbar, setSnackbar] = useState('Carregando contexto da revisão...');
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [leftSidebarHidden, setLeftSidebarHidden] = useState(false);
  const [rightSidebarHidden, setRightSidebarHidden] = useState(false);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(282);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(430);

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

  const startSidebarResize = (event, side) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = side === 'left' ? leftSidebarWidth : rightSidebarWidth;

    const onMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      if (side === 'left') {
        setLeftSidebarWidth(Math.min(420, Math.max(220, startWidth + delta)));
      } else {
        setRightSidebarWidth(Math.min(560, Math.max(300, startWidth - delta)));
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      className="app-shell"
      style={{
        '--left-sidebar-width': leftSidebarHidden ? '48px' : `${leftSidebarWidth}px`,
        '--right-sidebar-width': rightSidebarHidden ? '48px' : `${rightSidebarWidth}px`
      }}
    >
      <div className={`sidebar-region left ${leftSidebarHidden ? 'collapsed' : ''}`}>
        {leftSidebarHidden ? (
          <CollapsedSidebarToggle side="left" onToggle={() => setLeftSidebarHidden(false)} />
        ) : (
          <>
            <ReviewLeftbar view={view} setView={setView} state={state} onStartTour={startTour} onToggle={() => setLeftSidebarHidden(true)} />
            <ResizeHandle side="left" onResizeStart={startSidebarResize} />
          </>
        )}
      </div>
      <ReviewCenter view={view} state={state} onStartReview={startReview} />
      <div className={`sidebar-region right ${rightSidebarHidden ? 'collapsed' : ''}`}>
        {rightSidebarHidden ? (
          <CollapsedSidebarToggle side="right" onToggle={() => setRightSidebarHidden(false)} />
        ) : (
          <>
            <ResizeHandle side="right" onResizeStart={startSidebarResize} />
            <Rightbar metrics={state?.metrics} state={state} onSetView={setView} onStartReview={startReview} onToggle={() => setRightSidebarHidden(true)} />
          </>
        )}
      </div>
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
