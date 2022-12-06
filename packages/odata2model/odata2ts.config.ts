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
    odata: {
      source: "int-test/fixture/v2/odata.xml",
      output: "build/v2/odata",
    },
    trippin: {
      // serviceName: "TrippinService",
      source: "int-test/fixture/v4/trippin.xml",
      output: "build/v4/trippin",
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
      propertyTypes: [
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
    nw2: {
      source: "int-test/fixture/v2/northwind.xml",
      output: "build/v2/northwind",
    },
    nw4: {
      source: "int-test/fixture/v4/northwind.xml",
      output: "build/v4/northwind",
    },
  },
};

export default config;
