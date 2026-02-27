import { ToolAuthorizer } from "./authorizer.js";
import { FileSystemPolicyLoader } from "./policy-loader.js";
import { resolvePolicyPath } from "./policy-path.js";

import type { CedarEngine, PolicyLoader } from "./types.js";

export interface CreateToolAuthorizerOptions {
  engine: CedarEngine;
  policyPath?: string;
  env?: Record<string, string | undefined>;
  policyLoader?: PolicyLoader;
}

export async function createToolAuthorizerFromPolicyPath(
  options: CreateToolAuthorizerOptions
): Promise<ToolAuthorizer> {
  const resolvedPath = resolvePolicyPath(
    { policyPath: options.policyPath },
    options.env ?? process.env
  );

  const loader = options.policyLoader ?? new FileSystemPolicyLoader();
  const bundle = await loader.load(resolvedPath);

  return new ToolAuthorizer({
    bundle,
    engine: options.engine
  });
}
