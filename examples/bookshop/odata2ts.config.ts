import { ConfigFileOptions, EmitModes, Modes, UrlSourceConfiguration } from "@odata2ts/odata2ts";

const managedProps = ["createdAt", "createdBy", "modifiedAt", "modifiedBy"];

const authConfig: UrlSourceConfiguration = {
  username: "alice",
  password: "",
};

const config: ConfigFileOptions = {
  debug: false,
  mode: Modes.service,
  emitMode: EmitModes.ts,
  prettier: true,
  allowRenaming: true,
  enablePrimitivePropertyServices: true,
  v4BigNumberAsString: true,
  converters: ["@odata2ts/converter-big-number"],
  refreshFile: true,
  naming: {
    models: {
      suffix: "Model",
    },
  },
  services: {
    catalog: {
      serviceName: "catalog",
      sourceUrl: "http://localhost:4004/browse",
      source: "build/catalog-srv.xml",
      output: "src/catalog",
    },
    catV2: {
      serviceName: "catV2",
      sourceUrl: "http://localhost:4004/v2/browse",
      source: "resource/v2/catalog-v2-srv.xml",
      output: "src/catV2",
    },
    admin: {
      serviceName: "admin",
      sourceUrl: "http://localhost:4004/odata/v4/admin",
      sourceUrlConfig: authConfig,
      source: "build/admin-srv.xml",
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
