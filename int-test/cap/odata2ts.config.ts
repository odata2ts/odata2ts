import { ConfigFileOptions, EmitModes, Modes } from "@odata2ts/odata2ts";

/**
 * Generates the odata2ts client for the standardized "Library" OData V4 test model, as served by the
 * SAP CAP implementation (repo `odata2ts/test-server-cap`).
 *
 * The source is a committed snapshot of the server's actual `$metadata` (`resource/library.xml`), so
 * generation stays offline and server-independent - odata2ts is deliberately tested against the metadata
 * CAP really emits (flat mode, aspect-based media hierarchy, alternate keys only in metadata, ...), not
 * against the idealized reference model. Refresh the snapshot from the running server (or the server
 * repo's `npm run metadata`) whenever the model changes.
 */
const config: ConfigFileOptions = {
  mode: Modes.service,
  emitMode: EmitModes.ts,
  prettier: true,
  // we definitely want to type check the generated artifacts
  debug: true,
  services: {
    library: {
      serviceName: "Library",
      source: "resource/library.xml",
      output: "src-generated/library",
    },
  },
};

export default config;
