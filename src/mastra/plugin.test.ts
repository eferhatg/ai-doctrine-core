import assert from "node:assert/strict";
import test from "node:test";

import { createAgentGuardProcessor } from "./plugin.js";

test("unguarded tools are allowed in opt-in mode", async () => {
  let authorizeCalls = 0;

  const processor = createAgentGuardProcessor({
    authorizer: {
      authorize: async () => {
        authorizeCalls += 1;
        return {
          allowed: true,
          effect: "permit",
          reasonCode: "allowed"
        };
      }
    } as never,
    auditSink: {
      write: async () => {}
    },
    policyPath: "agentguard/policies"
  });

  await processor.beforeToolCall({
    toolName: "weather",
    params: {},
    context: { traceId: "t-1" }
  });

  assert.equal(authorizeCalls, 0);
});

test("guarded tools trigger authorization and deny when not permitted", async () => {
  const processor = createAgentGuardProcessor({
    authorizer: {
      authorize: async () => ({
        allowed: false,
        effect: "forbid",
        reasonCode: "not_permitted"
      })
    } as never,
    auditSink: {
      write: async () => {}
    },
    policyPath: "agentguard/policies"
  });

  await assert.rejects(async () => {
    await processor.beforeToolCall({
      toolName: "sendEmail",
      params: { to: "user@example.com" },
      tool: {
        mcp: {
          _meta: {
            doctrine: {
              action: "write",
              sensitivity: "sensitive"
            }
          }
        }
      },
      context: {
        traceId: "t-2",
        principal: "user-1"
      }
    });
  });
});

test("processOutputStep enforces tool calls before execution", async () => {
  let authorizeCalls = 0;

  const processor = createAgentGuardProcessor({
    authorizer: {
      authorize: async () => {
        authorizeCalls += 1;
        return {
          allowed: true,
          effect: "permit",
          reasonCode: "allowed"
        };
      }
    } as never,
    auditSink: {
      write: async () => {}
    },
    toolMetadataByName: {
      guardedLookup: {
        action: "read",
        sensitivity: "safe"
      }
    },
    policyPath: "agentguard/policies"
  });

  const result = await processor.processOutputStep?.({
    toolCalls: [
      {
        toolName: "guardedLookup",
        params: { id: "123" },
        context: { traceId: "t-3", principal: "user-2" }
      }
    ]
  });

  assert.equal(authorizeCalls, 1);
  assert.deepEqual(result, { messages: [] });
});

test("processor creation fails for invalid startup policy path", () => {
  assert.throws(() => {
    createAgentGuardProcessor({
      authorizer: {
        authorize: async () => ({
          allowed: true,
          effect: "permit",
          reasonCode: "allowed"
        })
      } as never,
      auditSink: {
        write: async () => {}
      },
      policyPath: "./missing-policy-path"
    });
  });
});
