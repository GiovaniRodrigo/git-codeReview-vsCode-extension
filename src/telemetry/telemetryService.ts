import * as crypto from "node:crypto";
import * as vscode from "vscode";
import { ConfigService } from "../utils/config";
import { buildTelemetryPayload, TelemetryEvent } from "./payload";

const sessionKey = "codeReview.telemetry.sessionId";

export class TelemetryService implements vscode.Disposable {
  private readonly output = vscode.window.createOutputChannel("Code Review Telemetry");
  private readonly sessionId: string;

  public constructor(private readonly context: vscode.ExtensionContext) {
    this.sessionId = getOrCreateSessionId(context);
  }

  public track(name: string, properties?: TelemetryEvent["properties"]): void {
    const enabled = ConfigService.isTelemetryEnabled();
    const endpoint = ConfigService.get<string>("telemetry.endpoint", "").trim();

    if (!enabled || !endpoint) {
      return;
    }

    const payload = buildTelemetryPayload({ name, properties }, {
      sessionId: this.sessionId,
      extensionVersion: this.context.extension.packageJSON.version ?? "unknown",
      vscodeVersion: vscode.version
    });

    void this.send(endpoint, payload);
  }

  public dispose(): void {
    this.output.dispose();
  }

  private async send(endpoint: string, payload: unknown): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3_000);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!response.ok) {
        this.output.appendLine(`Telemetry request failed: HTTP ${response.status}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.output.appendLine(`Telemetry request failed: ${message}`);
    } finally {
      clearTimeout(timeout);
    }
  }
}

function getOrCreateSessionId(context: vscode.ExtensionContext): string {
  const existing = context.globalState.get<string>(sessionKey);
  if (existing) {
    return existing;
  }

  const sessionId = crypto.randomUUID();
  void context.globalState.update(sessionKey, sessionId);
  return sessionId;
}
