import { ConfigFileOptions, EmitModes, Modes } from "@odata2ts/odata2ts";

const config: ConfigFileOptions = {
  debug: false,
  mode: Modes.service,
  // this demo service does not generate IDs, but requires the client to create new IDs
  disableAutoManagedKey: true,
  allowRenaming: true,
  enablePrimitivePropertyServices: true,
  converters: ["@odata2ts/converter-big-number"],
  naming: {
    models: {
      suffix: "Model",
    },
  },
  services: {
    odata: {
      source: "resource/odata.xml",
      output: "build/odata",
      emitMode: EmitModes.js_dts,
    },
  },
};

export default config;
