import { ConfigFileOptions, EmitModes, Modes } from "@odata2ts/odata2ts";

const managedProps = ["createdAt", "createdBy", "modifiedAt", "modifiedBy"];

const config: ConfigFileOptions = {
  debug: true,
  mode: Modes.service,
  emitMode: EmitModes.ts,
  prettier: true,
  allowRenaming: true,
  naming: {
    models: {
      suffix: "Model",
    },
  },
  services: {
    catalog: {
      serviceName: "catalog",
      source: "http://localhost:4004/admin",
      sourceUrlConfig: {
        username: "alice",
        password: "",
      },
      output: "src/catalog",
    },
    catV2: {
      serviceName: "catV2",
      source: "resource/v2/catalog-v2-srv.xml",
      output: "src/catV2",
    },
    admin: {
      serviceName: "admin",
      source: "",
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
