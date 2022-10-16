import { ConfigFileOptions } from "./src/OptionModel";

const config: ConfigFileOptions = {
  mode: "all",
  debug: false,
  prettier: true,
  emitMode: "ts",
  modelSuffix: "Model",
  generation: {
    model: {
      suffix: "Model",
    },
    idModel: {
      suffix: "IdModel",
    },
    converters: [
      "@odata2ts/converter-v2-to-v4",
      {
        module: "@odata2ts/converter-luxon",
        use: ["DateTimeOffsetToLuxon", "DurationToLuxon"],
      },
    ],
    custom: {
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
  },
};

export default config;
