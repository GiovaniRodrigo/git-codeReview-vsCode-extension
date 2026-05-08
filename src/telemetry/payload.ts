export interface TelemetryEvent {
  name: string;
  properties?: Record<string, string | number | boolean>;
}

export interface TelemetryPayload extends TelemetryEvent {
  timestamp: string;
  sessionId: string;
  extensionVersion: string;
  vscodeVersion: string;
}

export function buildTelemetryPayload(
  event: TelemetryEvent,
  context: {
    sessionId: string;
    extensionVersion: string;
    vscodeVersion: string;
    now?: Date;
  }
): TelemetryPayload {
  return {
    name: event.name,
    properties: event.properties,
    timestamp: (context.now ?? new Date()).toISOString(),
    sessionId: context.sessionId,
    extensionVersion: context.extensionVersion,
    vscodeVersion: context.vscodeVersion
  };
}
