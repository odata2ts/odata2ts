import { ConfigFileOptions, EmitModes, KeyProperties, Modes } from "@odata2ts/odata2ts";

function srcFolder(name: string, isSpecial = false) {
  return `resource/${isSpecial ? "specials/" : ""}${name}`;
}

function outputFolder(name: string, isSpecial = false) {
  return `src-generated/${isSpecial ? "specials/" : ""}${name}`;
}

const config: ConfigFileOptions = {
  /**
   * These examples assign their keys themselves - `horst.user` is written by the test, not by the
   * server - so a key belongs in the create payload and is required there, `nullable` being `false`.
   * That is `strict`, the spec's own reading.
   *
   * Not the default, which assumes the opposite: `interoperable` leaves an unannotated key optional,
   * because most services generate one and say so nowhere. Trippin does say nothing either, but here
   * we happen to know better, which is exactly what this option is for.
   */
  keyProperties: KeyProperties.strict,
  mode: Modes.service,
  emitMode: EmitModes.ts,
  prettier: true,
  // otherwise: ts-nocheck above every generated file
  debug: true,
  services: {
    // Just the Trippin service with a bit of mapping
    trippin: {
      source: srcFolder("trippin.xml"),
      output: outputFolder("trippin"),
      // TrippinService does not generate IDs on the server, but the client side => demo service
      allowRenaming: true,
      naming: {
        models: {
          suffix: "Model",
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
        },
        ...["createdAt", "createdBy", "modifiedAt", "modifiedBy"].map((prop) => ({ name: prop, managed: true })),
      ],
    },
    // Actually a bit different ad better support for read & write operations
    trippinRw: {
      serviceName: "TrippinRw",
      source: srcFolder("trippin-rw.xml"),
      output: outputFolder("trippin-rw"),
      // TrippinService does not generate IDs on the server, but the client side => demo service
      allowRenaming: true,
      bundledFileGeneration: false,
      naming: {
        models: {
          suffix: "Model",
        },
      },
    },
    // Example of OData V2 service from odata.org
    odataV2: {
      source: srcFolder("odata-v2.xml"),
      output: outputFolder("odataV2"),
      allowRenaming: true,
      // this demo service does not generate IDs, but requires the client to create new IDs
      enablePrimitivePropertyServices: true,
      naming: {
        models: {
          suffix: "Model",
        },
      },
      converters: ["@odata2ts/converter-big-number"],
    },
  },
};

export default config;
