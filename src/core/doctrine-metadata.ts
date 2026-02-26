export type DoctrineAction = "execute" | "read" | "write" | "delete";

export type DoctrineSensitivity = "safe" | "sensitive" | "restricted";

export interface DoctrineToolMetadata {
  action?: DoctrineAction;
  sensitivity?: DoctrineSensitivity;
  category?: string;
  parameterConstraints?: Record<string, unknown>;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function parseAction(value: unknown): DoctrineAction | undefined {
  if (value === "execute" || value === "read" || value === "write" || value === "delete") {
    return value;
  }

  return undefined;
}

function parseSensitivity(value: unknown): DoctrineSensitivity | undefined {
  if (value === "safe" || value === "sensitive" || value === "restricted") {
    return value;
  }

  return undefined;
}

export function parseDoctrineToolMetadata(value: unknown): DoctrineToolMetadata | null {
  const input = asRecord(value);
  if (!input) {
    return null;
  }

  const action = parseAction(input.action);
  const sensitivity = parseSensitivity(input.sensitivity);
  const category = typeof input.category === "string" ? input.category : undefined;
  const parameterConstraints = asRecord(input.parameterConstraints) ?? undefined;

  if (!action && !sensitivity && !category && !parameterConstraints) {
    return null;
  }

  return {
    action,
    sensitivity,
    category,
    parameterConstraints
  };
}

export function extractDoctrineToolMetadataFromTool(tool: unknown): DoctrineToolMetadata | null {
  const toolRecord = asRecord(tool);
  if (!toolRecord) {
    return null;
  }

  const mcp = asRecord(toolRecord.mcp);
  const meta = asRecord(mcp?._meta);

  return parseDoctrineToolMetadata(meta?.doctrine);
}
