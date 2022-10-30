import { ConfigFileOptions, EmitModes, Modes, NamingStrategies } from "@odata2ts/odata2model";

const config: ConfigFileOptions = {
  debug: false,
  mode: Modes.service,
  emitMode: EmitModes.ts,
  prettier: true,
  services: {
    odata: {
      source: "int-test/fixture/v2/odata.xml",
      output: "build/v2/odata",
    },
    trippin: {
      // serviceName: "TrippinService",
      source: "int-test/fixture/v4/trippin.xml",
      output: "build/v4/trippin",
      propertyTypes: [
        {
          name: "ID",
          mappedName: "id",
          managed: true,
        },
        ...["createdAt", "createdBy", "modifiedAt", "modifiedBy"].map((prop) => ({
          name: prop,
          managed: true,
        })),
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
  naming: {
    models: {
      suffix: "Model",
      idModels: {
        suffix: "Key",
      },
    },
    queryObjects: {
      namingStrategy: NamingStrategies.CONSTANT_CASE,
      suffix: "QueryObject",
    },
  },
};

export default config;
