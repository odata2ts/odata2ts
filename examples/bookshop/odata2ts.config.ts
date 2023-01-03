import { ConfigFileOptions, EmitModes, Modes } from "@odata2ts/odata2model";

const managedProps = ["createdAt", "createdBy", "modifiedAt", "modifiedBy"];

const config: ConfigFileOptions = {
  debug: false,
  mode: Modes.service,
  naming: {
    models: {
      suffix: "Model",
    },
  },
  services: {
    catalog: {
      serviceName: "catalog",
      source: "resource/catalog-srv.xml",
      output: "src/catalog",
      emitMode: EmitModes.ts,
      prettier: true,
    },
    admin: {
      serviceName: "admin",
      source: "resource/admin-srv.xml",
      output: "src/admin",
      emitMode: EmitModes.ts,
      prettier: true,
      propertiesByName: [
        ...managedProps.map((name) => ({
          name,
          managed: true,
        })),
      ],
    },
  },
};

export default config;
