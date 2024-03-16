import { ConfigFileOptions, EmitModes, Modes, TypeModel } from "@odata2ts/odata2ts";

const config: ConfigFileOptions = {
  debug: false,
  allowRenaming: true,
  emitMode: EmitModes.ts,
  prettier: true,
  services: {
    abstractAndOpen: {
      serviceName: "abstractAndOpen",
      source: "resource/abstractAndOpen.xml",
      output: "src/generated/abstract-and-open",
    },
    edgeCases: {
      serviceName: "edgeCase",
      source: "resource/edge-cases.xml",
      output: "src/generated/edge-cases",
    },
    autoNameClashResolution: {
      serviceName: "autoNameClashResolution",
      source: "resource/multiple-schemas.xml",
      output: "src/generated/schemas",
    },
    manualRenaming: {
      serviceName: "manualRenaming",
      source: "resource/multiple-schemas.xml",
      output: "src/generated/manual-renaming",
      byTypeAndName: [
        // This solves the problem of duplicate names (same name in different namespaces)
        // by renaming one of those entities, which must be addressed by its fully qualified name.
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
    renamingByRegExp: {
      serviceName: "regexpRenaming",
      source: "resource/multiple-schemas.xml",
      output: "src/generated/regexp-renaming",
      byTypeAndName: [
        // renaming "MY.org.xyz" to "My_xyz"
        {
          type: TypeModel.Any,
          name: /MY\.org\.(.*)/,
          mappedName: `My_$1}`,
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
