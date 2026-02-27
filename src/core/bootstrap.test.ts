import assert from "node:assert/strict";
import test from "node:test";

import { createToolAuthorizerFromPolicyPath } from "./bootstrap.js";

test("createToolAuthorizerFromPolicyPath loads default bundle and authorizes", async () => {
  const authorizer = await createToolAuthorizerFromPolicyPath({
    engine: {
      evaluate: async () => ({
        permitMatched: true,
        forbidMatched: false,
        policyRef: "policy:allow"
      })
    },
    policyPath: "agentguard/policies"
  });

  const decision = await authorizer.authorize({
    toolName: "lookup",
    params: {},
    context: {
      traceId: "t-boot",
      principal: "user-boot"
    }
  });

  assert.equal(decision.allowed, true);
  assert.equal(decision.reasonCode, "allowed");
});

test("createToolAuthorizerFromPolicyPath fails when required files are missing", async () => {
  await assert.rejects(async () => {
    await createToolAuthorizerFromPolicyPath({
      engine: {
        evaluate: async () => ({
          permitMatched: true,
          forbidMatched: false
        })
      },
      policyPath: "./missing-policy-path"
    });
  });
});
