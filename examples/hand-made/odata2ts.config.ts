import { ConfigFileOptions, EmitModes, TypeModel } from "@odata2ts/odata2ts";

const config: ConfigFileOptions = {
  debug: false,
  allowRenaming: true,
  emitMode: EmitModes.ts,
  prettier: true,
  services: {
    edgeCases: {
      serviceName: "example",
      source: "resource/edge-cases.xml",
      output: "src/generated/edge-cases",
    },
    schemas: {
      serviceName: "namespaces",
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
