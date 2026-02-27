import {
  createToolAuthorizerFromPolicyPath,
  type CedarEngine,
  type PolicyLoader
} from "../core/index.js";
import type { AuditSink } from "../core/index.js";
import {
  createAgentGuardProcessor,
  type AgentGuardProcessor,
  type AgentGuardProcessorOptions
} from "./plugin.js";

const NOOP_AUDIT_SINK: AuditSink = {
  async write(): Promise<void> {
    return;
  }
};

export interface CreateDoctrineProcessorFromPolicyPathOptions
  extends Omit<AgentGuardProcessorOptions, "authorizer" | "auditSink"> {
  engine: CedarEngine;
  auditSink?: AuditSink;
  policyLoader?: PolicyLoader;
}

export async function createDoctrineProcessorFromPolicyPath(
  options: CreateDoctrineProcessorFromPolicyPathOptions
): Promise<AgentGuardProcessor> {
  const authorizer = await createToolAuthorizerFromPolicyPath({
    engine: options.engine,
    policyPath: options.policyPath,
    env: options.env,
    policyLoader: options.policyLoader
  });

  return createAgentGuardProcessor({
    authorizer,
    auditSink: options.auditSink ?? NOOP_AUDIT_SINK,
    policyPath: options.policyPath,
    env: options.env,
    validatePolicyPathOnStartup: options.validatePolicyPathOnStartup,
    toolMetadataByName: options.toolMetadataByName
  });
}
