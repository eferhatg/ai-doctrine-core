import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";

import type { PolicyBundle, PolicyLoader } from "./types.js";

const REQUIRED_POLICY_FILES = ["bundle.json", "schema.cedar", "policies.cedar", "entities.json"];

export class FileSystemPolicyLoader implements PolicyLoader {
  async load(resolvedPath: string): Promise<PolicyBundle> {
    for (const fileName of REQUIRED_POLICY_FILES) {
      const filePath = join(resolvedPath, fileName);
      await access(filePath, constants.R_OK);
    }

    return {
      sourcePath: resolvedPath,
      loadedAt: Date.now()
    };
  }
}
