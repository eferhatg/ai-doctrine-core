import { statSync } from "node:fs";

export interface PolicyPathOptions {
  policyPath?: string;
}

export function resolvePolicyPath(
  options: PolicyPathOptions,
  env: Record<string, string | undefined> = {}
): string {
  if (options.policyPath && options.policyPath.trim().length > 0) {
    return options.policyPath;
  }

  if (env.AGENTGUARD_POLICY_PATH && env.AGENTGUARD_POLICY_PATH.trim().length > 0) {
    return env.AGENTGUARD_POLICY_PATH;
  }

  return "agentguard/policies";
}

export function validateResolvedPolicyPath(path: string): void {
  try {
    const stats = statSync(path);
    if (!stats.isDirectory()) {
      throw new Error("resolved policy path is not a directory");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    throw new Error(`Invalid policy path '${path}': ${message}`);
  }
}
