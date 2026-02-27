import type { CedarEngine, CedarEvaluationResult, ToolInvocationRequest } from "./types.js";

export interface CedarAuthorizationRequest {
  principal: string;
  action: string;
  resource: string;
  context: Record<string, unknown>;
}

export interface CedarAuthorizationResponse {
  decision: "allow" | "deny";
  effect?: "permit" | "forbid";
  policyRef?: string;
}

export interface CedarWasmEvaluator {
  isAuthorized(request: CedarAuthorizationRequest): Promise<CedarAuthorizationResponse>;
}

export interface CedarAdapterOptions {
  action?: string;
}

function resolveActionFromClaims(claims: Record<string, unknown> | undefined): string | undefined {
  const doctrine = claims?.doctrine;
  if (!doctrine || typeof doctrine !== "object" || Array.isArray(doctrine)) {
    return undefined;
  }

  const action = (doctrine as Record<string, unknown>).action;
  return typeof action === "string" ? action : undefined;
}

export function toCedarAuthorizationRequest(
  request: ToolInvocationRequest,
  options: CedarAdapterOptions = {}
): CedarAuthorizationRequest {
  const principalId = request.context.principal ?? "anonymous";
  const action = options.action ?? resolveActionFromClaims(request.context.claims) ?? "execute";

  return {
    principal: `Agent::${principalId}`,
    action: `Action::\"${action}\"`,
    resource: `Tool::${request.toolName}`,
    context: {
      traceId: request.context.traceId,
      claims: request.context.claims ?? {},
      params: request.params
    }
  };
}

export function fromCedarAuthorizationResponse(
  response: CedarAuthorizationResponse
): CedarEvaluationResult {
  if (response.decision === "allow") {
    return {
      permitMatched: true,
      forbidMatched: false,
      policyRef: response.policyRef
    };
  }

  return {
    permitMatched: false,
    forbidMatched: response.effect === "forbid",
    policyRef: response.policyRef
  };
}

export class CedarWasmEngine implements CedarEngine {
  constructor(
    private readonly evaluator: CedarWasmEvaluator,
    private readonly options: CedarAdapterOptions = {}
  ) {}

  async evaluate(request: ToolInvocationRequest): Promise<CedarEvaluationResult> {
    const cedarRequest = toCedarAuthorizationRequest(request, this.options);
    const response = await this.evaluator.isAuthorized(cedarRequest);
    return fromCedarAuthorizationResponse(response);
  }
}
