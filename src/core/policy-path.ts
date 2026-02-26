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
