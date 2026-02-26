export type DecisionEffect = "permit" | "forbid";

export type DecisionReasonCode =
  | "allowed"
  | "explicit_deny"
  | "not_permitted"
  | "engine_error"
  | "context_missing"
  | "policy_load_error";

export interface AuthorizationContext {
  traceId: string;
  principal?: string;
  claims?: Record<string, unknown>;
}

export interface ToolInvocationRequest {
  toolName: string;
  params: Record<string, unknown>;
  context: AuthorizationContext;
}

export interface AuthorizationDecision {
  allowed: boolean;
  effect: DecisionEffect;
  reasonCode: DecisionReasonCode;
  policyRef?: string;
}

export interface CedarEvaluationResult {
  permitMatched: boolean;
  forbidMatched: boolean;
  policyRef?: string;
}

export interface CedarEngine {
  evaluate(request: ToolInvocationRequest): Promise<CedarEvaluationResult>;
}

export interface PolicyBundle {
  sourcePath: string;
  loadedAt: number;
}

export interface PolicyLoader {
  load(resolvedPath: string): Promise<PolicyBundle>;
}

export interface AuditRecord {
  traceId: string;
  principal: string;
  action: string;
  resource: string;
  decision: "allow" | "deny";
  reasonCode: DecisionReasonCode;
  policyRef?: string;
  input: Record<string, unknown>;
  createdAt: string;
}

export interface AuditSink {
  write(record: AuditRecord): Promise<void>;
}
