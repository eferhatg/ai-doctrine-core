import {
  AuthorizationError,
  ToolAuthorizer,
  extractDoctrineToolMetadataFromTool,
  logDecision
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
}

export function createAgentGuardProcessor(
  options: AgentGuardProcessorOptions
): ToolCallProcessor {
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
