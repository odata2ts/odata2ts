import { ConfigFileOptions, EmitModes, Modes, NamingStrategies, TypeModel } from "@odata2ts/odata2ts";

function srcFolder(name: string, isSpecial = false) {
  return `resource/${isSpecial ? "specials/" : ""}${name}`;
}

function outputFolder(name: string, isSpecial = false) {
  return `src-generated/${isSpecial ? "specials/" : ""}${name}`;
}

const config: ConfigFileOptions = {
  mode: Modes.service,
  emitMode: EmitModes.ts,
  prettier: true,
  // we definitely want to type check stuff
  debug: true,
  services: {
    // Just the Trippin service with a bit of mapping
    trippin: {
      source: srcFolder("trippin.xml"),
      output: outputFolder("trippin"),
      // TrippinService does not generate IDs on the server, but the client side => demo service
      disableAutoManagedKey: true,
      allowRenaming: true,
      // for the fun of it
      enablePrimitivePropertyServices: true,
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
    // Just the Trippin service with a bit of mapping
    trippinRw: {
      serviceName: "TrippinRw",
      source: srcFolder("trippin-rw.xml"),
      output: outputFolder("trippin-rw"),
      // TrippinService does not generate IDs on the server, but the client side => demo service
      disableAutoManagedKey: true,
      allowRenaming: true,
      naming: {
        models: {
          suffix: "Model",
        },
      },
    },
    // Starting renaming from scratch: minimal defaults
    minimalDefaults: {
      source: srcFolder("trippin.xml"),
      output: outputFolder("trippin-min-naming"),
      // TrippinService does not generate IDs on the server, but the client side => demo service
      disableAutoManagedKey: true,
      naming: {
        minimalDefaults: true,
      },
    },
    // Full renaming example
    fullRenaming: {
      source: srcFolder("trippin.xml"),
      output: outputFolder("trippin-max-renaming"),
      // TrippinService does not generate IDs on the server, but the client side => demo service
      disableAutoManagedKey: true,
      allowRenaming: true,
      naming: {
        models: {
          namingStrategy: NamingStrategies.CONSTANT_CASE,
          propNamingStrategy: NamingStrategies.SNAKE_CASE,
          fileName: {
            prefix: "",
            suffix: "types",
            namingStrategy: NamingStrategies.CONSTANT_CASE,
          },
        },
        queryObjects: {
          prefix: "",
          suffix: "queryObject",
          namingStrategy: NamingStrategies.CONSTANT_CASE,
          propNamingStrategy: NamingStrategies.SNAKE_CASE,
          fileName: {
            prefix: "",
            suffix: "queryObjects",
            namingStrategy: NamingStrategies.CONSTANT_CASE,
          },
        },
        services: {
          prefix: "service",
          suffix: "",
          namingStrategy: NamingStrategies.CONSTANT_CASE,
          main: {
            applyServiceNaming: true,
            namingStrategy: NamingStrategies.NONE,
            prefix: "xxx_",
            suffix: "_xxxs",
          },
          privateProps: {
            namingStrategy: NamingStrategies.SNAKE_CASE,
            suffix: "_",
          },
          relatedServiceGetter: {
            namingStrategy: NamingStrategies.SNAKE_CASE,
            prefix: "navigateTo",
            suffix: "",
          },
          operations: {
            namingStrategy: NamingStrategies.SNAKE_CASE,
            function: {
              suffix: "Func",
            },
            action: {
              suffix: "Act",
            },
          },
        },
      },
      byTypeAndName: [
        { type: TypeModel.EntityType, name: "Person", mappedName: "ThePerson" },
        { type: TypeModel.EntitySet, name: "People", mappedName: "ThePeople" },
        { type: TypeModel.Singleton, name: "Me", mappedName: "MeMyselfAndI" },
        {
          type: TypeModel.OperationImportType,
          name: "GetPersonWithMostFriends",
          mappedName: "TheOneWithALotOfFriends",
        },
        { type: TypeModel.OperationImportType, name: "ResetDataSource", mappedName: "DoReset" },
      ],
    },
    // using all data types for v2
    dataTypesV2: {
      source: srcFolder("data-types-v2.xml"),
      output: outputFolder("data-types-v2"),
      disableAutoManagedKey: true,
      allowRenaming: true,
    },
    // using all data types for v2 and applying converters
    dataTypesV2Converted: {
      source: srcFolder("data-types-v2.xml"),
      output: outputFolder("data-types-v2-converted"),
      disableAutoManagedKey: true,
      allowRenaming: true,
      converters: [
        "@odata2ts/converter-v2-to-v4",
        "@odata2ts/converter-luxon",
        "@odata2ts/converter-big-number",
        {
          module: "@odata2ts/converter-common",
          use: ["int64ToBigIntConverter"],
        },
      ],
    },
    // using all data types for v4 and converters
    dataTypesV4: {
      source: srcFolder("data-types-v4.xml"),
      output: outputFolder("data-types-v4"),
      v4BigNumberAsString: true,
      disableAutoManagedKey: true,
      allowRenaming: true,
      enablePrimitivePropertyServices: true,
      converters: [
        "@odata2ts/converter-luxon",
        "@odata2ts/converter-big-number",
        {
          module: "@odata2ts/converter-common",
          use: ["dateTimeOffsetToDateConverter", "simpleDurationConverter", "int64ToBigIntConverter"],
        },
      ],
    },
    // Example of OData V2 service from odata.org
    odataV2: {
      source: srcFolder("odata-v2.xml"),
      output: outputFolder("odataV2"),
      allowRenaming: true,
      // this demo service does not generate IDs, but requires the client to create new IDs
      disableAutoManagedKey: true,
      enablePrimitivePropertyServices: true,
      naming: {
        models: {
          suffix: "Model",
        },
      },
      converters: ["@odata2ts/converter-big-number"],
    },
    abstractAndOpen: {
      serviceName: "abstractAndOpen",
      source: srcFolder("abstractAndOpen.xml", true),
      output: outputFolder("abstractAndOpen", true),
    },
    edgeCases: {
      disableAutomaticNameClashResolution: true,
      bundledFileGeneration: true,
      serviceName: "edgeCase",
      source: srcFolder("edge-cases.xml", true),
      output: outputFolder("edge-cases", true),
    },
    // Example of auto name clash resolution
    autoNameClashResolution: {
      serviceName: "autoNameClashResolution",
      source: srcFolder("multiple-schemas.xml", true),
      output: outputFolder("schemas", true),
    },
    // This solves the problem of duplicate names (same name in different namespaces)
    // by renaming one of those entities, which must be addressed by its fully qualified name.
    manualRenaming: {
      serviceName: "manualRenaming",
      source: srcFolder("multiple-schemas.xml", true),
      output: outputFolder("manual-renaming", true),
      byTypeAndName: [
        {
          type: TypeModel.EnumType,
          name: "MY.org.Enum",
          mappedName: "MyEnum",
        },
        {
          type: TypeModel.ComplexType,
          name: "MY.org.Complex",
          mappedName: "MyComplex",
        },
        {
          type: TypeModel.EntityType,
          name: "MY.org.Child",
          mappedName: "MyChild",
        },
        {
          type: TypeModel.Any,
          name: "NS1.Entity",
          mappedName: "MyEntity",
        },
        {
          type: TypeModel.OperationType,
          name: "NS*2.BoundFunc",
          mappedName: "BoundFunc_v2",
        },
        {
          type: TypeModel.Any,
          name: "NS3.BoundFunc",
          mappedName: "BoundFunc_v3",
        },
        {
          type: TypeModel.OperationType,
          name: "NS*2.BoundCollectionFunc",
          mappedName: "BoundCollectionFunc_v2",
        },
        {
          type: TypeModel.Any,
          name: "NS3.BoundCollectionFunc",
          mappedName: "BoundCollectionFunc_v3",
        },
        {
          type: TypeModel.OperationType,
          name: "NS*2.unboundFunc",
          mappedName: "unboundFunc_v2",
        },
      ],
    },
    // Example of renaming by regular expression
    renamingByRegExp: {
      serviceName: "regexpRenaming",
      source: srcFolder("multiple-schemas.xml", true),
      output: outputFolder("regexp-renaming", true),
      byTypeAndName: [
        // renaming "MY.org.xyz" to "My_xyz"
        {
          type: TypeModel.Any,
          name: /MY\.org\.(.*)/,
          mappedName: `My_$1`,
        },
        // renaming with regexp: "NS1.xyz" || "NS*2.xyz" || ... => "xyz_NS1" ||  "xyz_NS2" || ...
        {
          type: TypeModel.Any,
          name: /NS(\*)?(.)\.(.+)/,
          mappedName: "$3_NS$2",
        },
      ],
    },
  },
};

export default config;
