import { ConfigOptions, ProjectOptions } from "./src/OptionModel";

export default {
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
      suffix: "Model",
    },
    custom: {
      ODataDemo: {
        entityType: {
          Product: {
            mappedName: "product",
            properties: {
              ReleaseDate: {
                mappedName: "released",
                converter: "DateTimeToDateTimeOffset",
              },
            },
          },
        },
      },
    },
  },
} as ConfigOptions;
