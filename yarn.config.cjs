/**
 * Yarn constraints: the root package.json is the single source of truth for dependency versions.
 *
 * Every workspace has to declare the tools its own scripts invoke — Yarn only exposes the binaries of
 * dependencies a workspace declares itself (it does not fall back to the root's node_modules/.bin).
 * That would invite version drift across a dozen package.json files, so this constraint pins every
 * duplicated range back to whatever the root declares.
 *
 * Check: `yarn constraints` (also runs in CI) — fix: `yarn constraints --fix`.
 */

/** @type {import('@yarnpkg/types').Yarn.Config} */
module.exports = {
  constraints({ Yarn }) {
    const root = Yarn.workspace({ cwd: "." });

    // peerDependencies are excluded on purpose: they express what a consumer has to bring along
    // (e.g. odata2ts's `typescript: ">= 4.7"` floor, verified by int-test/ts-floor-check), not what
    // this repo installs.
    for (const dependency of [
      ...Yarn.dependencies({ type: "dependencies" }),
      ...Yarn.dependencies({ type: "devDependencies" }),
    ]) {
      if (dependency.workspace.cwd === root.cwd) continue;
      // workspace:^ links resolve locally and have no root counterpart
      if (dependency.range.startsWith("workspace:")) continue;

      const rootDependency = Yarn.dependency({ workspace: root, ident: dependency.ident });
      if (rootDependency) {
        dependency.update(rootDependency.range);
      }
    }
  },
};
