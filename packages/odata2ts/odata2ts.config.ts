import "dotenv/config";

import { ConfigFileOptions, EmitModes, Modes } from "@odata2ts/odata2ts";

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
      sourceUrl: "https://services.odata.org/TripPinRESTierService/$metadata",
      source: "tmp/test/v4/trippin-test.xml",
      output: "build/v4/trippin",
      naming: {
        services: {
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
