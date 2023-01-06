import { ConfigFileOptions, EmitModes, Modes, NamingStrategies } from "@odata2ts/odata2ts";

const config: ConfigFileOptions = {
  debug: true,
  mode: Modes.service,
  emitMode: EmitModes.ts,
  // TrippinService does not generate IDs on the server, but the client side => demo service
  disableAutoManagedKey: true,
  allowRenaming: true,
  services: {
    trippin: {
      source: "resource/trippin.xml",
      output: "generated-src/TRIPPIN",
      naming: {
        models: {
          namingStrategy: NamingStrategies.CONSTANT_CASE,
          propNamingStrategy: NamingStrategies.CONSTANT_CASE, // TODO
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
          propNamingStrategy: NamingStrategies.CONSTANT_CASE, // TODO
          fileName: {
            prefix: "",
            suffix: "queryObjects",
            namingStrategy: NamingStrategies.CONSTANT_CASE,
          },
        },
        services: {
          suffix: "srv",
          namingStrategy: NamingStrategies.CONSTANT_CASE,
          privateProps: {
            namingStrategy: NamingStrategies.CONSTANT_CASE,
            suffix: "_",
          },
          publicProps: {
            namingStrategy: NamingStrategies.CONSTANT_CASE,
          },
          serviceResolverFunction: {
            namingStrategy: NamingStrategies.CONSTANT_CASE,
            suffix: "RSLVR",
          },
          relatedServiceGetter: {
            namingStrategy: NamingStrategies.CONSTANT_CASE,
            prefix: "navigateTo",
            suffix: "",
          },
          operations: {
            namingStrategy: NamingStrategies.CONSTANT_CASE,
            function: {
              suffix: "Func",
            },
            action: {
              suffix: "Act",
            },
          },
          fileNames: {
            namingStrategy: NamingStrategies.,
          },
        },
      },
      propertiesByName: [
        {
          name: "Gender",
          mappedName: "TraditionalGenderCategories",
          managed: true,
        },
        ...["createdAt", "createdBy", "modifiedAt", "modifiedBy"].map((prop) => ({ name: prop, managed: true })),
      ],
    },
  },
};

export default config;
