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
    },
  },
};

export default config;
