/**
 * Two services, so a run without arguments has to produce both and a run naming one has to produce only
 * that one. Typed loosely on purpose: this file is loaded by the CLI's own TypeScript loader from a
 * directory outside the workspace resolution, so it must not import from `@odata2ts/odata2ts`.
 */
export default {
  emitMode: "ts",
  services: {
    alpha: { serviceName: "Alpha", source: "../dummy.xml", output: "build/alpha" },
    beta: { serviceName: "Beta", source: "../dummy.xml", output: "build/beta" },
  },
};
