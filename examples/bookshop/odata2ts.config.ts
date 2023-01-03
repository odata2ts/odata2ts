import { ConfigFileOptions, EmitModes, Modes } from "@odata2ts/odata2model";

const managedProps = ["createdAt", "createdBy", "modifiedAt", "modifiedBy"];

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
    catalog: {
      serviceName: "catalog",
      source: "resource/catalog-srv.xml",
      output: "src/catalog",
    },
    catV2: {
      serviceName: "catV2",
      source: "resource/v2/catalog-v2-srv.xml",
      output: "src/catV2",
    },
    admin: {
      serviceName: "admin",
      source: "resource/admin-srv.xml",
      output: "src/admin",
      propertiesByName: [
        ...managedProps.map((name) => ({
          name,
          managed: true,
        })),
      ],
    },
    adminV2: {
      serviceName: "adminV2",
      source: "resource/v2/admin-v2-srv.xml",
      output: "src/adminV2",
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
