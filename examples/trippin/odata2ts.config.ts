import { ConfigFileOptions, EmitModes, Modes } from "@odata2ts/odata2ts";

const config: ConfigFileOptions = {
  debug: true,
  mode: Modes.service,
  emitMode: EmitModes.ts,
  prettier: true,
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
      sourceUrl: "https://services.odata.org/TripPinRESTierService",
      source: "resource/trippin.xml",
      output: "build/trippin",
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
