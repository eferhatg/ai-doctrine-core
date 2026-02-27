import {
  AuthorizationError,
  parseDoctrineToolMetadata,
  ToolAuthorizer,
  extractDoctrineToolMetadataFromTool,
  logDecision,
  resolvePolicyPath,
  validateResolvedPolicyPath
} from "../core/index.js";
import type { AuditSink, ToolInvocationRequest } from "../core/index.js";
import type { DoctrineToolMetadata } from "../core/index.js";

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
  processOutputStep?(args: ProcessOutputStepArgs): Promise<ProcessorMessageResult>;
}

export interface ProcessOutputStepArgs {
  toolCalls?: ToolCall[];
  currentStepOutput?: {
    toolCalls?: ToolCall[];
  };
}

export interface ProcessorMessageResult {
  messages?: unknown[];
}

export interface AgentGuardProcessorOptions {
  authorizer: ToolAuthorizer;
  auditSink: AuditSink;
  policyPath?: string;
  env?: Record<string, string | undefined>;
  validatePolicyPathOnStartup?: boolean;
  toolMetadataByName?: Record<string, DoctrineToolMetadata>;
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

function getDoctrineMetadata(
  call: ToolCall,
  options: AgentGuardProcessorOptions
): DoctrineToolMetadata | null {
  const fromTool = extractDoctrineToolMetadataFromTool(call.tool);
  if (fromTool) {
    return fromTool;
  }

  const fromRegistry = options.toolMetadataByName?.[call.toolName];
  if (!fromRegistry) {
    return null;
  }

  return parseDoctrineToolMetadata(fromRegistry);
}

function getStepToolCalls(args: ProcessOutputStepArgs): ToolCall[] {
  if (Array.isArray(args.toolCalls)) {
    return args.toolCalls;
  }

  if (Array.isArray(args.currentStepOutput?.toolCalls)) {
    return args.currentStepOutput.toolCalls;
  }

  return [];
}

export function createAgentGuardProcessor(
  options: AgentGuardProcessorOptions
): ToolCallProcessor {
  validateAgentGuardProcessorOptions(options);

  return {
    async beforeToolCall(call: ToolCall): Promise<void> {
      const doctrine = getDoctrineMetadata(call, options);
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
    },

    async processOutputStep(args: ProcessOutputStepArgs): Promise<ProcessorMessageResult> {
      for (const call of getStepToolCalls(args)) {
        await this.beforeToolCall(call);
      }

      return { messages: [] };
    }
  };
}
