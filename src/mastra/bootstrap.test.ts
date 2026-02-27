import assert from "node:assert/strict";
import test from "node:test";

import { createDoctrineProcessorFromPolicyPath } from "./bootstrap.js";

test("createDoctrineProcessorFromPolicyPath returns a native-shaped processor", async () => {
  const processor = await createDoctrineProcessorFromPolicyPath({
    engine: {
      evaluate: async () => ({
        permitMatched: true,
        forbidMatched: false
      })
    },
    policyPath: "agentguard/policies"
  });

  assert.equal(processor.name, "doctrine-guard");
  assert.equal(typeof processor.beforeToolCall, "function");
});
