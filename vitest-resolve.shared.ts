import { fileURLToPath } from "node:url";

/**
 * Resolves the source entry point of a local workspace package. Used to alias the internal
 * `@odata2ts/*` bare specifiers to their `src/` during Vitest runs, so tests resolve against
 * source instead of the compiled `lib/` — no topological pre-build of dependencies required.
 *
 * Only in-repo packages belong here. External `@odata2ts/*` contracts (e.g. `converter-api`,
 * `http-client-api`) come from sibling repos via npm and must keep resolving through node_modules.
 */
const src = (name: string) => fileURLToPath(new URL(`./packages/${name}/src/index.ts`, import.meta.url));

export const workspaceAlias = {
  "@odata2ts/odata-core": src("odata-core"),
  "@odata2ts/odata-query-objects": src("odata-query-objects"),
  "@odata2ts/odata-query-builder": src("odata-query-builder"),
  "@odata2ts/odata-service": src("odata-service"),
  "@odata2ts/odata2ts": src("odata2ts"),
};
