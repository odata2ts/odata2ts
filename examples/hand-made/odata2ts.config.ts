import { ConfigFileOptions, EmitModes, Modes } from "@odata2ts/odata2ts";

const config: ConfigFileOptions = {
  debug: false,
  allowRenaming: true,
  services: {
    odata: {
      serviceName: "example",
      source: "resource/edge-cases.xml",
      output: "src/generated",
      emitMode: EmitModes.ts,
      prettier: true,
    },
  },
};

export default config;
