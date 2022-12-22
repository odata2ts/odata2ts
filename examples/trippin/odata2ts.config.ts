import { ConfigFileOptions, EmitModes, Modes } from "@odata2ts/odata2model";

const config: ConfigFileOptions = {
  debug: false,
  mode: Modes.service,
  emitMode: EmitModes.ts,
  prettier: true,
  naming: {
    models: {
      suffix: "Model",
    },
  },
  services: {
    "trippin-js": {
      source: "resource/trippin.xml",
      output: "build/trippin",
      emitMode: EmitModes.js_dts,
    },
    trippin: {
      // serviceName: "TrippinService",
      source: "resource/trippin.xml",
      output: "src/trippin",
      naming: {
        // models: {
        //   propNamingStrategy: NamingStrategies.CONSTANT_CASE,
        // },
        services: {
          relatedServiceGetter: {
            prefix: "navTo",
            suffix: "",
          },
          operations: {
            function: {
              suffix: "Function",
            },
            action: {
              suffix: "Action",
            },
          },
        },
      },
      propertiesByName: [
        {
          name: "UserName",
          mappedName: "user",
        },
        {
          name: "Gender",
          mappedName: "TraditionalGenderCategories",
          managed: true,
        },
        ...["createdAt", "createdBy", "modifiedAt", "modifiedBy"].map((prop) => ({ name: prop, managed: true })),
      ],
      /*entitiesByName: [
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
      ],*/
    },
  },
};

export default config;
