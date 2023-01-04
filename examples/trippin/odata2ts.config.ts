import { ConfigFileOptions, EmitModes, Modes, NamingOptions, PropertyGenerationOptions } from "@odata2ts/odata2model";

const sharedNaming: NamingOptions = {
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
};

const sharedPropNaming: Array<PropertyGenerationOptions> = [
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
];

const config: ConfigFileOptions = {
  debug: false,
  mode: Modes.service,
  // TrippinService does not generate IDs on the server, but the client side => demo service
  disableAutoManagedKey: true,
  allowRenaming: true,
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
      naming: sharedNaming,
      propertiesByName: sharedPropNaming,
    },
    trippin: {
      // serviceName: "TrippinService",
      source: "resource/trippin.xml",
      output: "src/trippin",
      emitMode: EmitModes.ts,
      prettier: true,
      naming: sharedNaming,
      propertiesByName: sharedPropNaming,
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
