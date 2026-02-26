import type { DecisionReasonCode } from "./types.js";

export class AuthorizationError extends Error {
  readonly code: DecisionReasonCode;

  constructor(code: DecisionReasonCode, message = "Tool execution denied") {
    super(message);
    this.code = code;
    this.name = "AuthorizationError";
  }
}
