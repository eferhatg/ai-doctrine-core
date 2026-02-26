import type {
  AuditRecord,
  AuditSink,
  AuthorizationDecision,
  ToolInvocationRequest
} from "./types.js";

export type Redactor = (value: unknown, keyPath: string) => unknown;

export function defaultRedactor(value: unknown, keyPath: string): unknown {
  const normalized = keyPath.toLowerCase();
  if (
    normalized.includes("password") ||
    normalized.includes("token") ||
    normalized.includes("secret")
  ) {
    return "[REDACTED]";
  }
  return value;
}

export function redactObject(
  input: Record<string, unknown>,
  redactor: Redactor,
  prefix = ""
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    const keyPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = redactObject(value as Record<string, unknown>, redactor, keyPath);
    } else {
      out[key] = redactor(value, keyPath);
    }
  }

  return out;
}

export async function logDecision(
  sink: AuditSink,
  request: ToolInvocationRequest,
  decision: AuthorizationDecision,
  redactor: Redactor = defaultRedactor
): Promise<void> {
  const record: AuditRecord = {
    traceId: request.context.traceId,
    principal: request.context.principal ?? "anonymous",
    action: "tool.execute",
    resource: request.toolName,
    decision: decision.allowed ? "allow" : "deny",
    reasonCode: decision.reasonCode,
    policyRef: decision.policyRef,
    input: redactObject(request.params, redactor),
    createdAt: new Date().toISOString()
  };

  await sink.write(record);
}
