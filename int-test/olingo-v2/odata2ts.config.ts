import { ConfigFileOptions, EmitModes, Modes } from "@odata2ts/odata2ts";

/**
 * Generates the odata2ts client for the "Library" OData V2 test model, as served by the Apache Olingo 2
 * implementation (repo `odata2ts/test-server-olingo-v2`).
 *
 * The source is a committed snapshot of the server's actual `$metadata` (`resource/library-v2.xml`), so
 * generation stays offline and server-independent. odata2ts is deliberately tested against the metadata
 * Olingo really emits - one entity set per concrete media type, the full inheritance hierarchy it renders
 * but cannot serialize, `ConcurrencyMode` as a facet - rather than against the idealized reference model.
 * Refresh the snapshot from the running server whenever the model changes.
 */
const config: ConfigFileOptions = {
  mode: Modes.service,
  emitMode: EmitModes.ts,
  prettier: true,
  // we definitely want to type check the generated artifacts
  debug: true,
  // on, because the property services are a generator feature of their own and otherwise never
  // meet a real server: see test/feature/PropertyServices.test.ts
  enablePrimitivePropertyServices: true,
  // on, because this is the only genuine OData V2 server we have - the one place where the V2 binding
  // notation the query objects build can be held against a real deserializer:
  // see test/feature/Binding.test.ts
  enableBindingProps: true,
  services: {
    library: {
      serviceName: "Library",
      source: "resource/library-v2.xml",
      output: "src-generated/library",
    },
    /**
     * The same model a second time, with converters switched on.
     *
     * V2 is where converters matter most: its JSON format hands over every timestamp as
     * `/Date(<ticks>)/` and every numeric type that does not fit a JS number as a string, so the raw
     * model types those as `string` and leaves the caller to parse them. The converters turn that into
     * `DateTime`, `BigNumber` and `bigint` on the way in and back on the way out.
     *
     * Generated separately rather than replacing the raw client, because both halves are worth testing:
     * `feature/DataTypes.test.ts` pins what the server actually sends, and `feature/Converters.test.ts`
     * pins what the converters make of it. Neither is meaningful without the other.
     */
    libraryConverted: {
      serviceName: "LibraryConverted",
      source: "resource/library-v2.xml",
      output: "src-generated/library-converted",
      enablePrimitivePropertyServices: true,
      converters: [
        // maps V2's own spellings onto the V4 ones, so a date is an ISO string before anything else
        // touches it - the base every other converter here builds on
        "@odata2ts/converter-v2-to-v4",
        "@odata2ts/converter-luxon",
        "@odata2ts/converter-big-number",
        {
          module: "@odata2ts/converter-common",
          use: ["int64ToBigIntConverter"],
        },
      ],
    },
  },
};

export default config;
