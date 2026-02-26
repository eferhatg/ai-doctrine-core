import type { PolicyBundle } from "./types.js";

export interface BundleCompiler {
  parse(path: string): Promise<unknown>;
  validate(parsed: unknown): Promise<void>;
  compile(parsed: unknown): Promise<PolicyBundle>;
  smoke(bundle: PolicyBundle): Promise<void>;
}

export interface ReloadLogger {
  info(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

export class PolicyReloader {
  constructor(
    private activeBundle: PolicyBundle,
    private readonly compiler: BundleCompiler,
    private readonly logger: ReloadLogger
  ) {}

  current(): PolicyBundle {
    return this.activeBundle;
  }

  async reload(path: string): Promise<boolean> {
    try {
      const parsed = await this.compiler.parse(path);
      await this.compiler.validate(parsed);
      const nextBundle = await this.compiler.compile(parsed);
      await this.compiler.smoke(nextBundle);

      this.activeBundle = nextBundle;
      this.logger.info("Policy bundle reloaded", { path });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown_error";
      this.logger.error("Policy reload failed", { path, message });
      return false;
    }
  }
}
