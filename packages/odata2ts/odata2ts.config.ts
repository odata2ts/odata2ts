import "dotenv/config";

import { ConfigFileOptions, EmitModes, Modes, TypeModel } from "./lib";

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
    vanilla: {
      source: "int-test/fixture/v4/trippin.xml",
      output: "build/v4/vanilla",
      bundledFileGeneration: false,
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
      byTypeAndName: [
        {
          type: TypeModel.Any,
          name: "Product",
          mappedName: "theProduct",
        },
        {
          type: TypeModel.EntityType,
          name: "Trippin.Person",
          mappedName: "ThePerson",
          keys: ["UserName"],
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
