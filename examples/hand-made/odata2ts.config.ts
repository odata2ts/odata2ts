import { ConfigFileOptions, EmitModes, Modes } from "@odata2ts/odata2ts";

const config: ConfigFileOptions = {
  debug: false,
  allowRenaming: true,
  emitMode: EmitModes.ts,
  prettier: true,
  services: {
    edgeCases: {
      serviceName: "example",
      source: "resource/edge-cases.xml",
      output: "src/generated/edge-cases",
    },
    schemas: {
      serviceName: "namespaces",
      source: "resource/multiple-schemas.xml",
      output: "src/generated/schemas",
      entitiesByName: [
        // This solves the problem of duplicate entity names (same name in different namespaces)
        // by renaming one of those entities, which must be addressed by its fully qualified name.
        {
          name: "MY.org.Child",
          mappedName: "MyChild",
        },
        {
          name: /NS\*2\.(.+)/,
          mappedName: "$1_NS2",
        },
      ],
      operationsByName: [
        // This solves the problem of duplicate function & action names - which only occurs for
        // operations with the same name in different namespaces bound to the same entity -
        // by renaming one of those operations. This bound action or function must be addressed by
        // its fully qualified name.
        {
          name: "NS*2.unboundFunc",
          mappedName: "AltUnboundFunc",
        },
        {
          name: "NS3.BoundFunc",
          mappedName: "AltBoundFunc",
        },
        {
          name: "NS3.BoundCollectionFunc",
          mappedName: "AltBoundCollectionFunc",
        },
      ],
    },
  },
};

export default config;
