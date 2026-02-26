import type {
  AuthorizationDecision,
  CedarEngine,
  PolicyBundle,
  ToolInvocationRequest
} from "./types.js";

export interface AuthorizerDependencies {
  bundle: PolicyBundle | null;
  engine: CedarEngine;
}

export class ToolAuthorizer {
  constructor(private readonly deps: AuthorizerDependencies) {}

  async authorize(request: ToolInvocationRequest): Promise<AuthorizationDecision> {
    if (!this.deps.bundle) {
      return {
        allowed: false,
        effect: "forbid",
        reasonCode: "policy_load_error"
      };
    }

    if (!request.context.principal) {
      return {
        allowed: false,
        effect: "forbid",
        reasonCode: "context_missing"
      };
    }

    try {
      const result = await this.deps.engine.evaluate(request);

      if (result.forbidMatched) {
        return {
          allowed: false,
          effect: "forbid",
          reasonCode: "explicit_deny",
          policyRef: result.policyRef
        };
      }

      if (result.permitMatched) {
        return {
          allowed: true,
          effect: "permit",
          reasonCode: "allowed",
          policyRef: result.policyRef
        };
      }

      return {
        allowed: false,
        effect: "forbid",
        reasonCode: "not_permitted",
        policyRef: result.policyRef
      };
    } catch {
      return {
        allowed: false,
        effect: "forbid",
        reasonCode: "engine_error"
      };
    }
  }
}
