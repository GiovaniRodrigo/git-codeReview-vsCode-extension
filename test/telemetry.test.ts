import test from "node:test";
import assert from "node:assert/strict";
import { buildTelemetryPayload } from "../src/telemetry/payload";

test("buildTelemetryPayload creates a minimal event envelope", () => {
  const payload = buildTelemetryPayload({
    name: "command.refresh",
    properties: { source: "view" }
  }, {
    sessionId: "session-1",
    extensionVersion: "0.1.0",
    vscodeVersion: "1.90.0",
    now: new Date("2026-05-07T10:00:00.000Z")
  });

  assert.deepEqual(payload, {
    name: "command.refresh",
    properties: { source: "view" },
    timestamp: "2026-05-07T10:00:00.000Z",
    sessionId: "session-1",
    extensionVersion: "0.1.0",
    vscodeVersion: "1.90.0"
  });
});
