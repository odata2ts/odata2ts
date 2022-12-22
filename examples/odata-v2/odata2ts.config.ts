import { ConfigFileOptions, EmitModes, Modes, NamingOptions, PropertyGenerationOptions } from "@odata2ts/odata2model";

const config: ConfigFileOptions = {
  debug: false,
  mode: Modes.service,
  naming: {
    models: {
      suffix: "Model",
    },
  },
  services: {
    "odata-js": {
      source: "resource/odata.xml",
      output: "build/odata",
      emitMode: EmitModes.js_dts,
    },
    odata: {
      source: "resource/odata.xml",
      output: "src/odata",
      emitMode: EmitModes.ts,
      prettier: true,
    },
  },
};

export default config;
