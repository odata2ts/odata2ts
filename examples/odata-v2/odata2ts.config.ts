import { ConfigFileOptions, EmitModes, Modes } from "@odata2ts/odata2model";

const config: ConfigFileOptions = {
  debug: false,
  mode: Modes.service,
  // this demo service does not generate IDs, but requires the client to create new IDs
  disableAutoManagedKey: true,
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
