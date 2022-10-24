import { ConfigFileOptions, NamingStrategies } from "./src/OptionModel";

const config: ConfigFileOptions = {
  mode: "all",
  debug: true,
  prettier: true,
  emitMode: "js_dts",
  /*  services: [
    {
      name: "Trippin",
      mappedName: "TrippinService",
      source: "/int-test/fixture/v4/trippin.xml",
      output: "build/v4/trippin",
      propertyTypes: [
        {
          name: "ID",
          mappedName: "id",
          managed: true,
        },
        {
          name: "createdAt",
          managed: true,
        },
        {
          name: "createdBy",
          managed: true,
        },
        {
          name: "modifiedAt",
          managed: true,
        },
        {
          name: "modifiedBy",
          managed: true,
        },
      ],
      modelTypes: [
        {
          name: "Product",
          mappedName: "prod666uct",
          properties: [
            {
              name: "ReleaseDate",
              mappedName: "released",
            },
          ],
        },
      ],
    },
  ],*/
  generation: {
    models: {
      suffix: "Model",
      idModels: {
        suffix: "Key",
      },
      editableModels: {
        suffix: "Edit",
      },
    },
    queryObjects: {
      namingStrategy: NamingStrategies.CONSTANT_CASE,
      suffix: "QueryObject",
    },
  },
};

export default config;
