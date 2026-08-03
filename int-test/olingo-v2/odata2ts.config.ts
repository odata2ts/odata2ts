import { ConfigFileOptions, EmitModes, Modes } from "@odata2ts/odata2ts";

/**
 * Generates the odata2ts client for the "Library" OData V2 test model, as served by the Apache Olingo 2
 * implementation (repo `odata2ts/test-server-olingo-v2`).
 *
 * The source is a committed snapshot of the server's actual `$metadata` (`resource/library-v2.xml`), so
 * generation stays offline and server-independent. odata2ts is deliberately tested against the metadata
 * Olingo really emits - one entity set per concrete media type, the full inheritance hierarchy it renders
 * but cannot serialize, `ConcurrencyMode` as a facet - rather than against the idealized reference model.
 * Refresh the snapshot from the running server whenever the model changes.
 */
const config: ConfigFileOptions = {
  mode: Modes.service,
  emitMode: EmitModes.ts,
  prettier: true,
  // we definitely want to type check the generated artifacts
  debug: true,
  // on, because the property services are a generator feature of their own and otherwise never
  // meet a real server: see test/feature/PropertyServices.test.ts
  enablePrimitivePropertyServices: true,
  services: {
    library: {
      serviceName: "Library",
      source: "resource/library-v2.xml",
      output: "src-generated/library",
    },
  },
};

export default config;
