import * as vscode from "vscode";

export function getCommonStyles(): string {
  return `
    :root {
      color-scheme: light dark;
      --border: var(--vscode-panel-border);
      --muted: var(--vscode-descriptionForeground);
      --surface: var(--vscode-editor-background);
      --field: var(--vscode-input-background);
      --field-border: var(--vscode-input-border);
      --accent: var(--vscode-button-background);
      --accent-text: var(--vscode-button-foreground);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--surface);
    }
    header, .filters, .summary, main { padding: 12px 16px; }
    header {
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    h1 {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }
    .muted { color: var(--muted); }
    .hidden { display: none !important; }
    
    input, select {
      width: 100%;
      min-height: 30px;
      color: var(--vscode-input-foreground);
      background: var(--field);
      border: 1px solid var(--field-border);
      border-radius: 4px;
      padding: 5px 8px;
    }

    button {
      min-height: 28px;
      color: var(--accent-text);
      background: var(--accent);
      border: 0;
      border-radius: 4px;
      padding: 4px 10px;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    button.secondary {
      background: transparent;
      color: var(--vscode-foreground);
      border: 1px solid var(--border);
    }
    
    .risk {
      border: 1px solid var(--border);
      border-radius: 999px;
      color: var(--vscode-badge-foreground);
      background: var(--vscode-badge-background);
      padding: 1px 7px;
      font-size: 11px;
      text-transform: uppercase;
    }
    .risk-high {
      color: var(--vscode-editorError-foreground);
      background: transparent;
      border-color: var(--vscode-editorError-foreground);
    }
    .risk-medium {
      color: var(--vscode-editorWarning-foreground);
      background: transparent;
      border-color: var(--vscode-editorWarning-foreground);
    }
    
    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      color: var(--muted);
      gap: 12px;
    }
    .placeholder-icon {
      font-size: 32px;
      opacity: 0.5;
    }
    .placeholder-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--vscode-foreground);
    }
    .placeholder-text {
      max-width: 320px;
    }
  `;
}
