import { ConfigFileOptions, EmitModes, Modes } from "@odata2ts/odata2ts";

const config: ConfigFileOptions = {
  debug: true,
  mode: Modes.service,
  emitMode: EmitModes.ts,
  prettier: true,
  // TrippinService does not generate IDs on the server, but the client side => demo service
  disableAutoManagedKey: true,
  allowRenaming: true,
  // for the fun of it
  enablePrimitivePropertyServices: true,
  naming: {
    models: {
      suffix: "Model",
    },
  },
  services: {
    trippin: {
      source: "resource/trippin.xml",
      output: "build/trippin",
      propertiesByName: [
        {
          name: "UserName",
          mappedName: "user",
        },
        {
          name: "Gender",
          mappedName: "TraditionalGenderCategories",
        },
        ...["createdAt", "createdBy", "modifiedAt", "modifiedBy"].map((prop) => ({ name: prop, managed: true })),
      ],
    },
    converterV2: {
      source: "resource/data-types-v2.xml",
      output: "build/converter-v2",
      converters: [
        "@odata2ts/converter-v2-to-v4",
        "@odata2ts/converter-luxon",
        "@odata2ts/converter-big-number",
        {
          module: "@odata2ts/converter-common",
          use: ["int64ToBigIntConverter"],
        },
      ],
    },
    converterV4: {
      source: "resource/data-types-v4.xml",
      output: "build/converter-v4",
      v4BigNumberAsString: true,
      converters: [
        "@odata2ts/converter-luxon",
        "@odata2ts/converter-big-number",
        {
          module: "@odata2ts/converter-common",
          use: ["dateTimeOffsetToDateConverter", "simpleDurationConverter", "int64ToBigIntConverter"],
        },
      ],
    },
  },
};

export default config;
