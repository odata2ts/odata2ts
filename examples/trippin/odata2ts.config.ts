import { ConfigFileOptions, EmitModes, Modes } from "@odata2ts/odata2ts";

const config: ConfigFileOptions = {
  debug: true,
  mode: Modes.service,
  emitMode: EmitModes.js_dts,
  // TrippinService does not generate IDs on the server, but the client side => demo service
  disableAutoManagedKey: true,
  allowRenaming: true,
  naming: {
    models: {
      suffix: "Model",
    },
  },
  services: {
    trippin: {
      source: "resource/trippin.xml",
      output: "build/trippin",
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
  },
};

export default config;
