import type { ToolCallProcessor } from "./plugin.js";

export interface AgentLike {
  name: string;
  processors?: ToolCallProcessor[];
}

export interface GuardedAgentOptions {
  processor: ToolCallProcessor;
}

export function withAgentGuard<T extends AgentLike>(
  agent: T,
  options: GuardedAgentOptions
): T {
  const existing = agent.processors ?? [];
  return {
    ...agent,
    processors: [...existing, options.processor]
  };
}

export function createGuardedAgent<T extends AgentLike>(
  baseConfig: T,
  options: GuardedAgentOptions
): T {
  return withAgentGuard(baseConfig, options);
}
