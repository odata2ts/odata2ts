import { ConfigFileOptions, EmitModes, Modes, NamingStrategies } from "@odata2ts/odata2ts";

const sharedPropConfig = [
  {
    name: "Gender",
    mappedName: "TraditionalGenderCategories",
    managed: true,
  },
  ...["createdAt", "createdBy", "modifiedAt", "modifiedBy"].map((prop) => ({ name: prop, managed: true })),
];

const config: ConfigFileOptions = {
  debug: true,
  mode: Modes.service,
  emitMode: EmitModes.ts,
  // TrippinService does not generate IDs on the server, but the client side => demo service
  disableAutoManagedKey: true,
  allowRenaming: true,
  services: {
    trippinMin: {
      source: "resource/trippin.xml",
      output: "generated-src/trippin-min",
      propertiesByName: sharedPropConfig,
      naming: {
        minimalDefaults: true,
      },
    },
    trippin: {
      source: "resource/trippin.xml",
      output: "generated-src/TRIPPIN",
      propertiesByName: sharedPropConfig,
      naming: {
        models: {
          namingStrategy: NamingStrategies.CONSTANT_CASE,
          propNamingStrategy: NamingStrategies.SNAKE_CASE,
          fileName: {
            prefix: "",
            suffix: "types",
            namingStrategy: NamingStrategies.CONSTANT_CASE,
          },
        },
        queryObjects: {
          prefix: "",
          suffix: "queryObject",
          namingStrategy: NamingStrategies.CONSTANT_CASE,
          propNamingStrategy: NamingStrategies.SNAKE_CASE,
          fileName: {
            prefix: "",
            suffix: "queryObjects",
            namingStrategy: NamingStrategies.CONSTANT_CASE,
          },
        },
        services: {
          prefix: "service",
          suffix: "",
          namingStrategy: NamingStrategies.CONSTANT_CASE,
          main: {
            applyServiceNaming: true,
            namingStrategy: NamingStrategies.NONE,
            prefix: "xxx_",
            suffix: "_xxxs",
          },
          privateProps: {
            namingStrategy: NamingStrategies.SNAKE_CASE,
            suffix: "_",
          },
          relatedServiceGetter: {
            namingStrategy: NamingStrategies.SNAKE_CASE,
            prefix: "navigateTo",
            suffix: "",
          },
          operations: {
            namingStrategy: NamingStrategies.SNAKE_CASE,
            function: {
              suffix: "Func",
            },
            action: {
              suffix: "Act",
            },
          },
        },
      },
    },
  },
};

export default config;
