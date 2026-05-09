import * as vscode from 'vscode';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ReviewSessionService } from '../application/reviewSessionService';
import {
  isReviewSessionStatus,
  isReviewCommentStatus,
  isValidationFindingStatus,
  isValidationSeverity,
  ReviewNavigationKind
} from '../domain/reviewSession';

type ReviewView = 'dashboard' | 'analysis';

const execFileAsync = promisify(execFile);

export class ReviewPanel {
  private panel?: vscode.WebviewPanel;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly service: ReviewSessionService
  ) {}

  open(view: ReviewView): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
      this.postState();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'codeReviewDashboard',
      view === 'dashboard' ? 'Code Review Dashboard' : 'Review Analysis',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'dist')]
      }
    );

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });

    this.panel.webview.onDidReceiveMessage((message) => this.handleMessage(message).catch((error) => this.handleError(error)));
    this.panel.webview.html = getWebviewHtml(this.panel.webview, this.context.extensionUri, view);
    this.postState();
  }

  async startReview(): Promise<void> {
    if (!this.panel) {
      this.open('analysis');
    }

    const author = await getGitUserName();
    const reviewer = vscode.env.machineId;
    const session = await this.service.startReview(author, reviewer);

    this.post({ type: 'reviewSessionStarted', payload: session });
    vscode.window.showInformationMessage('Review session iniciada.');
  }

  private async handleMessage(message: { type?: string; payload?: Record<string, unknown> }): Promise<void> {
    if (message.type === 'requestState') {
      await this.postState();
    }

    if (message.type === 'startReview') {
      await this.startReview();
    }

    if (message.type === 'openReview' && typeof message.payload?.id === 'string') {
      await this.service.openReview(message.payload.id);
      await this.postState();
    }

    if (
      message.type === 'updateReviewStatus'
      && typeof message.payload?.id === 'string'
      && typeof message.payload?.status === 'string'
      && isReviewSessionStatus(message.payload.status)
    ) {
      await this.service.updateStatus(message.payload.id, message.payload.status);
      await this.postState();
    }

    if (
      message.type === 'navigateReview'
      && typeof message.payload?.id === 'string'
      && isNavigationKind(message.payload.kind)
      && typeof message.payload.ref === 'string'
    ) {
      await this.service.navigate(message.payload.id, {
        kind: message.payload.kind,
        ref: message.payload.ref,
        file: typeof message.payload.file === 'string' ? message.payload.file : undefined,
        line: typeof message.payload.line === 'number' ? message.payload.line : undefined
      });
      await this.postState();
    }

    if (
      message.type === 'addReviewComment'
      && typeof message.payload?.id === 'string'
      && typeof message.payload.body === 'string'
      && typeof message.payload.file === 'string'
      && typeof message.payload.line === 'number'
    ) {
      await this.service.addComment(message.payload.id, {
        body: message.payload.body,
        author: vscode.env.machineId,
        file: message.payload.file,
        line: message.payload.line,
        commit: typeof message.payload.commit === 'string' ? message.payload.commit : undefined,
        threadId: typeof message.payload.threadId === 'string' ? message.payload.threadId : undefined,
        severity: typeof message.payload.severity === 'string' && isValidationSeverity(message.payload.severity) ? message.payload.severity : undefined,
        status: typeof message.payload.status === 'string' && isReviewCommentStatus(message.payload.status) ? message.payload.status : undefined
      });
      await this.refreshReviewDecorations();
      await this.postState();
    }

    if (
      message.type === 'updateReviewCommentStatus'
      && typeof message.payload?.id === 'string'
      && typeof message.payload.commentId === 'string'
      && typeof message.payload.status === 'string'
      && isReviewCommentStatus(message.payload.status)
    ) {
      await this.service.updateCommentStatus(message.payload.id, message.payload.commentId, message.payload.status);
      await this.refreshReviewDecorations();
      await this.postState();
    }

    if (
      message.type === 'editReviewComment'
      && typeof message.payload?.id === 'string'
      && typeof message.payload.commentId === 'string'
      && typeof message.payload.body === 'string'
    ) {
      await this.service.editComment(message.payload.id, message.payload.commentId, message.payload.body, vscode.env.machineId);
      await this.postState();
    }

    if (
      message.type === 'createValidationFinding'
      && typeof message.payload?.id === 'string'
      && typeof message.payload.rule === 'string'
      && typeof message.payload.severity === 'string'
      && isValidationSeverity(message.payload.severity)
      && typeof message.payload.description === 'string'
      && typeof message.payload.file === 'string'
      && typeof message.payload.line === 'number'
      && typeof message.payload.commit === 'string'
    ) {
      await this.service.createFinding(message.payload.id, {
        rule: message.payload.rule,
        severity: message.payload.severity,
        description: message.payload.description,
        file: message.payload.file,
        line: message.payload.line,
        commit: message.payload.commit,
        responsible: vscode.env.machineId
      });
      await this.postState();
    }

    if (
      message.type === 'updateValidationFindingStatus'
      && typeof message.payload?.id === 'string'
      && typeof message.payload.findingId === 'string'
      && typeof message.payload.status === 'string'
      && isValidationFindingStatus(message.payload.status)
    ) {
      await this.service.updateFindingStatus(message.payload.id, message.payload.findingId, message.payload.status);
      await this.postState();
    }

    if (
      message.type === 'registerCorrectionAttempt'
      && typeof message.payload?.id === 'string'
      && typeof message.payload.findingId === 'string'
      && typeof message.payload.commit === 'string'
      && typeof message.payload.description === 'string'
    ) {
      await this.service.registerCorrection(message.payload.id, message.payload.findingId, {
        author: vscode.env.machineId,
        commit: message.payload.commit,
        description: message.payload.description
      });
      await this.postState();
    }

    if (
      message.type === 'revalidateFinding'
      && typeof message.payload?.id === 'string'
      && typeof message.payload.findingId === 'string'
      && typeof message.payload.result === 'string'
      && isValidationFindingStatus(message.payload.result)
      && typeof message.payload.notes === 'string'
    ) {
      await this.service.revalidate(message.payload.id, message.payload.findingId, {
        reviewer: vscode.env.machineId,
        result: message.payload.result,
        notes: message.payload.notes
      });
      await this.postState();
    }

    if (message.type === 'runArchitectureValidation' && typeof message.payload?.id === 'string') {
      const result = await this.service.runArchitectureValidation(message.payload.id);
      this.post({ type: 'architectureValidationCompleted', payload: { count: result.findings.length } });
      await this.postState();
    }

    if (
      message.type === 'addCollaborationMessage'
      && typeof message.payload?.id === 'string'
      && typeof message.payload.body === 'string'
    ) {
      await this.service.addCollaborationMessage(message.payload.id, {
        author: vscode.env.machineId,
        body: message.payload.body,
        threadId: typeof message.payload.threadId === 'string' ? message.payload.threadId : undefined
      });
      await this.postState();
    }

    if (
      message.type === 'approvePartial'
      && typeof message.payload?.id === 'string'
      && (message.payload.scope === 'module' || message.payload.scope === 'file')
      && typeof message.payload.target === 'string'
    ) {
      await this.service.approvePartial(message.payload.id, {
        scope: message.payload.scope,
        target: message.payload.target,
        reviewer: vscode.env.machineId
      });
      await this.postState();
    }

    if (message.type === 'refreshMergeDecision' && typeof message.payload?.id === 'string') {
      await this.service.refreshMergeDecision(message.payload.id);
      await this.postState();
    }

    if (message.type === 'openWorkspaceFile' && typeof message.payload?.file === 'string') {
      await this.openWorkspaceFile(
        message.payload.file,
        typeof message.payload.line === 'number' ? message.payload.line : 1,
        typeof message.payload.commit === 'string' ? message.payload.commit : 'HEAD'
      );
      this.post({ type: 'operationCompleted', payload: { message: `Arquivo aberto: ${message.payload.file}` } });
    }

    if (message.type === 'openDiff' && typeof message.payload?.file === 'string') {
      await this.openGitDiff(
        message.payload.file,
        typeof message.payload.commit === 'string' ? message.payload.commit : 'HEAD'
      );
      this.post({ type: 'operationCompleted', payload: { message: `Diff aberto: ${message.payload.file}` } });
    }

    if (message.type === 'exportReviewReport') {
      const state = await this.service.getDashboardState();
      const report = buildMarkdownReport(state);
      const document = await vscode.workspace.openTextDocument({ content: report, language: 'markdown' });
      await vscode.window.showTextDocument(document, { preview: false });
      this.post({ type: 'operationCompleted', payload: { message: 'Relatório de revisão gerado.' } });
    }

    if (message.type === 'exportLocalDatabase') {
      const data = await this.service.exportLocalDatabase();
      const document = await vscode.workspace.openTextDocument({ content: data, language: 'json' });
      await vscode.window.showTextDocument(document, { preview: false });
      this.post({ type: 'operationCompleted', payload: { message: 'Banco local exportado.' } });
    }

    if (message.type === 'createBackup') {
      const backupPath = await this.service.createBackup();
      this.post({ type: 'operationCompleted', payload: { message: `Backup criado em: ${backupPath}` } });
    }



    if (
      message.type === 'loadGitFile'
      && typeof message.payload?.file === 'string'
    ) {
      const payload = await this.loadGitFile(
        message.payload.file,
        typeof message.payload.commit === 'string' ? message.payload.commit : 'HEAD'
      );
      this.post({ type: 'gitFileLoaded', payload });
    }

    if (
      message.type === 'loadCommitFiles'
      && typeof message.payload?.commit === 'string'
    ) {
      const payload = await this.loadCommitFiles(message.payload.commit);
      this.post({ type: 'commitFilesLoaded', payload });
    }

    if (message.type === 'syncRemote') {
      const syncedPath = await this.service.syncRemote();
      this.post({ type: 'operationCompleted', payload: { message: `Sincronizacao concluida em: ${syncedPath}` } });
    }
  }



  private async loadCommitFiles(commit = 'HEAD'): Promise<{ commit: string; files: string[] }> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error('Abra um workspace para carregar arquivos do commit.');
    }

    const normalizedCommit = commit?.trim() || 'HEAD';
    const cwd = workspaceFolder.uri.fsPath;
    const strategies = [
      ['diff-tree', '--no-commit-id', '--name-only', '-r', normalizedCommit],
      ['show', '--format=', '--name-only', normalizedCommit],
      ['diff', '--name-only', `${normalizedCommit}^`, normalizedCommit]
    ];

    for (const args of strategies) {
      try {
        const { stdout } = await execFileAsync('git', args, { cwd, maxBuffer: 1024 * 1024 * 4 });
        const files = stdout
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line && !line.startsWith('commit ') && !line.startsWith('Author:') && !line.startsWith('Date:'));

        if (files.length) {
          return { commit: normalizedCommit, files: Array.from(new Set(files)) };
        }
      } catch {
        // Tenta a próxima estratégia.
      }
    }

    return { commit: normalizedCommit, files: [] };
  }

  private async loadGitFile(file: string, commit = 'HEAD'): Promise<{ file: string; commit: string; content: string; diff: string }> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error('Abra um workspace para carregar arquivos do Git.');
    }

    const cwd = workspaceFolder.uri.fsPath;
    const normalized = file.replace(/^\/+/, '');

    const [content, diff] = await Promise.all([
      this.readGitFile(cwd, normalized, commit),
      this.readGitDiff(cwd, normalized, commit)
    ]);

    return { file: normalized, commit, content, diff };
  }

  private async readGitFile(cwd: string, file: string, commit: string): Promise<string> {
    const normalizedCommit = commit?.trim() || 'HEAD';

    try {
      const { stdout } = await execFileAsync('git', ['show', `${normalizedCommit}:${file}`], { cwd, maxBuffer: 1024 * 1024 * 8 });
      return stdout;
    } catch {
      // Arquivos novos, removidos ou fora do commit podem nao existir em commit:path.
      // Nesse caso tentamos o workspace atual e, se falhar, devolvemos uma mensagem segura para o webview.
    }

    try {
      const uri = vscode.Uri.joinPath(vscode.Uri.file(cwd), file);
      const bytes = await vscode.workspace.fs.readFile(uri);
      return Buffer.from(bytes).toString('utf8');
    } catch {
      return [
        `// Arquivo nao encontrado no workspace atual: ${file}`,
        `// Commit/base solicitado: ${normalizedCommit}`,
        '// Isso pode acontecer quando o arquivo foi removido, renomeado, pertence a outro branch ou existe apenas no diff.',
        '// Use o painel de Diff para revisar a alteracao sem depender do arquivo fisico.'
      ].join('\n');
    }
  }

  private async readGitDiff(cwd: string, file: string, commit = 'HEAD'): Promise<string> {
    const normalizedCommit = commit?.trim() || 'HEAD';
    const diffCommands = [
      ['diff', '--', file],
      ['diff', '--cached', '--', file],
      ['diff', `${normalizedCommit}^!`, '--', file],
      ['show', '--format=', '--patch', normalizedCommit, '--', file]
    ];

    for (const args of diffCommands) {
      try {
        const { stdout } = await execFileAsync('git', args, { cwd, maxBuffer: 1024 * 1024 * 12 });
        if (stdout.trim()) return stdout;
      } catch {
        // Tenta a proxima estrategia.
      }
    }

    return `Sem diff disponível para este arquivo no contexto atual: ${file}`;
  }

  private async openWorkspaceFile(file: string, line = 1, commit = 'HEAD'): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error('Abra um workspace para navegar até arquivos da revisão.');
    }

    const normalized = file.replace(/^\/+/, '');
    const uri = vscode.Uri.joinPath(workspaceFolder.uri, normalized);

    try {
      await vscode.workspace.fs.stat(uri);
      const document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document, { preview: false });
      const position = new vscode.Position(Math.max(0, line - 1), 0);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
      return;
    } catch {
      // O arquivo pode existir apenas no commit/diff. Abrimos um documento virtual seguro.
    }

    const content = await this.readGitFile(workspaceFolder.uri.fsPath, normalized, commit);
    const document = await vscode.workspace.openTextDocument({ content, language: guessLanguage(normalized) });
    await vscode.window.showTextDocument(document, { preview: false });
  }

  private async openGitDiff(file: string, commit = 'HEAD'): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      throw new Error('Abra um workspace para navegar até arquivos da revisão.');
    }

    const normalized = file.replace(/^\/+/, '');
    const diff = await this.readGitDiff(workspaceFolder.uri.fsPath, normalized, commit);
    const document = await vscode.workspace.openTextDocument({ content: diff, language: 'diff' });
    await vscode.window.showTextDocument(document, { preview: false });
  }

  private handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Code Review: ${message}`);
    this.post({ type: 'operationFailed', payload: { message } });
  }

  private async postState(): Promise<void> {
    const state = await this.service.getDashboardState();
    const vscodeContext = await this.collectVSCodeContext();
    this.post({ type: 'dashboardState', payload: { ...state, vscode: vscodeContext } });
  }

  private async collectVSCodeContext(): Promise<{ problems: Array<{ file: string; line: number; severity: string; message: string; source?: string }>; tests: { available: boolean; lastRunStatus: string; lastRunAt?: string } }> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const problems = vscode.languages.getDiagnostics()
      .filter(([uri]) => !workspaceFolder || uri.fsPath.startsWith(workspaceFolder.uri.fsPath))
      .flatMap(([uri, diagnostics]) => diagnostics.map((diagnostic) => ({
        file: workspaceFolder ? vscode.workspace.asRelativePath(uri, false) : uri.fsPath,
        line: diagnostic.range.start.line + 1,
        severity: vscode.DiagnosticSeverity[diagnostic.severity] ?? 'Unknown',
        message: diagnostic.message,
        source: diagnostic.source
      })))
      .slice(0, 200);

    const commands = await vscode.commands.getCommands(true);
    const testsAvailable = commands.includes('testing.runAll') || commands.some((command) => command.startsWith('testing.'));
    const lastRun = this.context.workspaceState.get<{ status: string; at?: string }>('codeReview.lastVSCodeTestRun', { status: 'NOT_RUN' });

    return {
      problems,
      tests: {
        available: testsAvailable,
        lastRunStatus: lastRun.status,
        lastRunAt: lastRun.at
      }
    };
  }

  private async runVSCodeTests(): Promise<void> {
    try {
      await vscode.commands.executeCommand('testing.runAll');
      await this.context.workspaceState.update('codeReview.lastVSCodeTestRun', { status: 'RUN_REQUESTED', at: new Date().toISOString() });
      vscode.window.showInformationMessage('Execucao de testes solicitada ao VS Code Test Explorer.');
    } catch {
      await this.context.workspaceState.update('codeReview.lastVSCodeTestRun', { status: 'UNAVAILABLE', at: new Date().toISOString() });
      vscode.window.showWarningMessage('O VS Code Test Explorer nao esta disponivel para este workspace.');
    }
  }

  private async refreshReviewDecorations(): Promise<void> {
    const state = await this.service.getDashboardState();
    const editor = vscode.window.activeTextEditor;
    if (!editor || !state.currentSession) return;

    const activeFile = vscode.workspace.asRelativePath(editor.document.uri, false);
    const comments = (state.currentSession.comments ?? []).filter((comment) => comment.file === activeFile);
    if (!comments.length) return;

    const decoration = vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      overviewRulerLane: vscode.OverviewRulerLane.Right,
      after: { contentText: '  Code Review', color: new vscode.ThemeColor('editorCodeLens.foreground') },
      border: '1px solid',
      borderColor: new vscode.ThemeColor('editorWarning.foreground')
    });

    editor.setDecorations(decoration, comments.map((comment) => {
      const line = Math.max(0, comment.line - 1);
      return {
        range: new vscode.Range(line, 0, line, 0),
        hoverMessage: new vscode.MarkdownString(`**Code Review** (${comment.severity}/${comment.status})\n\n${comment.body}`)
      };
    }));

    this.context.subscriptions.push(decoration);
  }

  private post(message: unknown): void {
    this.panel?.webview.postMessage(message);
  }
}

function isNavigationKind(value: unknown): value is ReviewNavigationKind {
  return value === 'commit' || value === 'diff' || value === 'file' || value === 'comment' || value === 'validation';
}

function buildMarkdownReport(state: Awaited<ReturnType<ReviewSessionService['getDashboardState']>>): string {
  const session = state.currentSession;
  const lines = [
    '# Relatório de Code Review',
    '',
    `- Branch atual: ${state.git.currentBranch}`,
    `- Branch destino: ${state.git.baseBranch}`,
    `- Score: ${state.metrics.qualityScore}/100`,
    `- Findings: ${state.metrics.findingsCount}`,
    `- Correções: ${state.metrics.correctionsCount}`,
    `- Reincidência: ${state.metrics.recurrenceRate}%`,
    '',
    '## Sessão atual',
    '',
    session ? `- ID: ${session.id}` : '- Nenhuma sessão ativa.',
    session ? `- Status: ${session.status}` : '',
    session ? `- Arquivos alterados: ${session.changedFiles.length}` : '',
    '',
    '## Findings',
    '',
    ...(session?.findings?.length ? session.findings.map((finding) => `- [${finding.status}] ${finding.severity} ${finding.rule} em ${finding.file}:${finding.line} — ${finding.description}`) : ['- Nenhum finding registrado.']),
    '',
    '## Comentários',
    '',
    ...(session?.comments?.length ? session.comments.map((comment) => `- ${comment.file}:${comment.line} — ${comment.body}`) : ['- Nenhum comentário registrado.']),
    '',
    '## Histórico',
    '',
    ...(session?.history?.length ? session.history.map((entry) => `- ${entry.createdAt} — ${entry.message}`) : ['- Sem histórico.'])
  ];

  return lines.filter((line) => line !== '').join('\n');
}

function guessLanguage(file: string): string {
  if (file.endsWith('.ts') || file.endsWith('.tsx')) return 'typescript';
  if (file.endsWith('.js') || file.endsWith('.jsx')) return 'javascript';
  if (file.endsWith('.json')) return 'json';
  if (file.endsWith('.md')) return 'markdown';
  if (file.endsWith('.php')) return 'php';
  if (file.endsWith('.css')) return 'css';
  if (file.endsWith('.html')) return 'html';
  return 'plaintext';
}

function getWebviewHtml(webview: vscode.Webview, extensionUri: vscode.Uri, initialView = 'dashboard'): string {
  const distUri = vscode.Uri.joinPath(extensionUri, 'webview-ui', 'dist');
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'assets', 'index.js'));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distUri, 'assets', 'index.css'));
  const nonce = getNonce();

  return /* html */ `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};" />
  <link rel="stylesheet" href="${styleUri}" />
  <title>Code Review</title>
</head>
<body data-initial-view="${initialView}">
  <div id="root"></div>
  <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
</body>
</html>`;
}

async function getGitUserName(): Promise<string> {
  const config = vscode.workspace.getConfiguration('git');
  return config.get<string>('user.name') ?? vscode.env.machineId;
}

function getNonce(): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < 32; i += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
