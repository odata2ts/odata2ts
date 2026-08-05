import { getDefaultConfig, getMinimalConfig } from "../src/index.js";

/**
 * The file layout is pinned to the bundled form, deliberately and against the default: the fixtures these
 * tests compare against are one file per kind of artefact, so unbundling would only scatter the very output
 * under test across folders. Which layout the generator produces is covered elsewhere - by
 * `ProjectManager.test.ts` on the unit side and by the integration packages at runtime.
 *
 * Cases that are *about* the layout override it, see `app.test.ts`.
 */
export function getTestConfig() {
  const config = getDefaultConfig();
  config.allowRenaming = true;
  config.bundledFileGeneration = true;

  return config;
}

export function getTestConfigMinimal() {
  const config = getMinimalConfig();
  config.allowRenaming = true;
  config.bundledFileGeneration = true;

  return config;
}
