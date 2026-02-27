import {
  AuthorizationError,
  ToolAuthorizer,
  extractDoctrineToolMetadataFromTool,
  logDecision,
  resolvePolicyPath,
  validateResolvedPolicyPath
} from "../core/index.js";
import type { AuditSink, ToolInvocationRequest } from "../core/index.js";

export interface ToolCall {
  toolName: string;
  params: Record<string, unknown>;
  tool?: unknown;
  context: {
    traceId: string;
    principal?: string;
    claims?: Record<string, unknown>;
  };
}

export interface ToolCallProcessor {
  beforeToolCall(call: ToolCall): Promise<void>;
}

export interface AgentGuardProcessorOptions {
  authorizer: ToolAuthorizer;
  auditSink: AuditSink;
  policyPath?: string;
  env?: Record<string, string | undefined>;
  validatePolicyPathOnStartup?: boolean;
}

function validateAgentGuardProcessorOptions(options: AgentGuardProcessorOptions): void {
  if (!options.authorizer || typeof options.authorizer.authorize !== "function") {
    throw new TypeError("AgentGuard processor requires a valid authorizer");
  }

  if (!options.auditSink || typeof options.auditSink.write !== "function") {
    throw new TypeError("AgentGuard processor requires a valid audit sink");
  }

  if (options.validatePolicyPathOnStartup === false) {
    return;
  }

  const resolvedPolicyPath = resolvePolicyPath(
    { policyPath: options.policyPath },
    options.env ?? process.env
  );
  validateResolvedPolicyPath(resolvedPolicyPath);
}

export function createAgentGuardProcessor(
  options: AgentGuardProcessorOptions
): ToolCallProcessor {
  validateAgentGuardProcessorOptions(options);

  return {
    async beforeToolCall(call: ToolCall): Promise<void> {
      const doctrine = extractDoctrineToolMetadataFromTool(call.tool);
      if (!doctrine) {
        return;
      }

      const request: ToolInvocationRequest = {
        toolName: call.toolName,
        params: call.params,
        context: {
          ...call.context,
          claims: {
            ...(call.context.claims ?? {}),
            doctrine
          }
        }
      };

      const decision = await options.authorizer.authorize(request);
      await logDecision(options.auditSink, request, decision);

      if (!decision.allowed) {
        throw new AuthorizationError(decision.reasonCode);
      }
    }
  };
}
