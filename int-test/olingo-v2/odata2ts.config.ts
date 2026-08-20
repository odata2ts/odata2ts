import { ConfigFileOptions, EmitModes, KeyProperties, ManagedPropertyMode, Modes, TypeModel } from "@odata2ts/odata2ts";

/** The running server to refresh from, or `undefined` to read the committed snapshot - see below. */
const SOURCE_URL = process.env.LIBRARY_BASE_URL;
const SOURCE = "resource/library-v2.xml";

/**
 * Generates the odata2ts client for the "Library" OData V2 test model, as served by the Apache Olingo 2
 * implementation (repo `odata2ts/test-server-olingo-v2`).
 *
 * The source is a committed snapshot of the server's actual `$metadata` (`resource/library-v2.xml`).
 * odata2ts is deliberately tested against the metadata Olingo really emits - one entity set per concrete
 * media type, the full inheritance hierarchy it renders but cannot serialize, `ConcurrencyMode` as a
 * facet - rather than against the idealized reference model.
 *
 * The snapshot refreshes itself from a running server: point `LIBRARY_BASE_URL` at one and the first
 * service downloads `$metadata` and overwrites the file, which the services after it then read, so a
 * model change never has to be copied in by hand. It is the same variable the test setup takes an externally started server from, so
 * one export covers both halves:
 *
 * ```
 * LIBRARY_BASE_URL=http://localhost:4004/odata/v2/library yarn build
 * ```
 *
 * Unset - which is how CI runs, where the container only comes up for the test run and `yarn build`
 * happens before it - the committed snapshot is used as-is and generation stays offline.
 */
const config: ConfigFileOptions = {
  mode: Modes.service,
  emitMode: EmitModes.ts,
  // also pretty-prints the downloaded metadata before it is stored
  prettier: true,
  // we definitely want to type check the generated artifacts
  debug: true,
  // On against the default, which is unbundled since the file layout became the user's choice. Nothing
  // here is about the layout - the V2 axes are - and the suites import from the bundled paths, so this
  // keeps the package to its actual subject.
  bundledFileGeneration: true,
  // on, because the property services are a generator feature of their own and otherwise never
  // meet a real server: see test/feature/PropertyServices.test.ts
  enablePrimitivePropertyServices: true,
  /**
   * Both on, because this is what Olingo does: an expanded collection valued navigation property arrives
   * as `{"Copies": {"results": [...]}}` - the V2 serialisation of a feed - and a deep insert is accepted
   * in that same shape. The client
   * hands the structure through untouched, so stating it here is what makes the generated types describe
   * the actual traffic - see test/feature/ResultsWrapping.test.ts.
   *
   * The payload side is its own option because a service which answers with the wrapping does not
   * necessarily expect it (odata2ts#237); Olingo happens to accept both, which is exactly why the option
   * cannot be derived from the response side.
   */
  v2: { responseResultsWrapping: true, payloadResultsWrapping: true },
  services: {
    library: {
      serviceName: "Library",
      // the one service that refreshes the snapshot; the others below read the file it leaves behind,
      // so this entry has to stay first
      sourceUrl: SOURCE_URL,
      source: SOURCE,
      refreshFile: true,
      output: "src-generated/library",
    },
    /**
     * The same model a third time, with renaming switched on - the V2 half of what
     * `int-test/asp-net` does for V4.
     *
     * Renaming is not version-neutral, which is why it needs a home on both sides. The mapping between the
     * TypeScript name and the OData one has to survive whatever the client builds, and V2 builds several of
     * those things differently: a key predicate carries a type prefix (`Books(guid'…')`), `$expand` cannot
     * nest query options, and a binding is stated as `__metadata.uri` rather than `@odata.bind`. A mapping
     * proven over V4 says nothing about any of them.
     *
     * Generated separately rather than replacing the raw client, for the same reason as over there: the
     * point is the mapping, and a mapping is only observable where both name forms are visible at once.
     * See test/feature/Renaming.test.ts.
     */
    libraryRenamed: {
      serviceName: "LibraryRenamed",
      source: SOURCE,
      output: "src-generated/library-renamed",
      allowRenaming: true,
      // `Location_` (the shelf mark) and `Location` (the branch an item sits in) both become `location`
      // under camelCase, and the generator refuses to emit an interface declaring one name twice. The very
      // same clash as in the V4 metadata, since it is the same model.
      propertiesByName: [{ name: "Location_", mappedName: "shelfLocation" }],
      // `Branch` exists in two namespaces here as well
      byTypeAndName: [{ name: "PublisherRegistry.Branch", type: TypeModel.EntityType, mappedName: "PublisherBranch" }],
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
      source: SOURCE,
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
    /**
     * The same model a fourth time, with `v2ResponseAsV4` switched on: every response is reshaped as its
     * V4 equivalent (`{value: [...]}` instead of `{d: {results: [...]}}`, the bare entity plus `@odata.*`
     * control information instead of `{d: {...entity, __metadata}}`, expanded navigation properties
     * unwrapped instead of `results`-wrapped, unexpanded ones simply absent instead of `__deferred`). See
     * `test/feature/V2ResponseAsV4.test.ts`.
     *
     * Generated separately rather than replacing the raw client, for the same reason as `libraryRenamed`
     * and `libraryConverted`: the raw V2 shape is worth pinning in its own right (`ResultsWrapping.test.ts`,
     * `core/CrudOperations.test.ts`), so the reshaped one needs its own client to be observable at all.
     */
    libraryAsV4: {
      serviceName: "LibraryAsV4",
      source: SOURCE,
      output: "src-generated/library-as-v4",
      enablePrimitivePropertyServices: true,
      // override the top-level wrapping options: responseAsV4 already reshapes an expanded collection
      // valued nav prop as a plain array (dropping the `results` envelope entirely) and Olingo accepts an
      // unwrapped deep-insert payload just as well (see ResultsWrapping.test.ts) - stating the wrapping in
      // the generated types here would describe traffic this client no longer sends or receives
      v2: { responseAsV4: true, responseResultsWrapping: false, payloadResultsWrapping: false },
    },
    /**
     * The same model a fifth time, under `managedPropertyMode: "strictOmit"` - the V2 half of what
     * `int-test/asp-net` and `int-test/cap` do for V4.
     *
     * The mode reshapes write models by managed state, and on this server that state does not come from a
     * vocabulary term at all: `Loan.LoanedAt` is marked by `sap:updatable="false"`, which the digester
     * normalizes to `Core.Immutable` before anything downstream sees it. So this is the one place that
     * shows the V2 dialects actually reaching the option, rather than the option working on a V4 term.
     *
     * V2 also puts a different question to `update()`: it has no `Prefer: return=representation`, so a PUT
     * answers 204 and what the server kept of an immutable property is only visible on the read after it.
     * See test/feature/ImmutableProperties.test.ts.
     */
    libraryStrict: {
      serviceName: "LibraryStrict",
      source: SOURCE,
      output: "src-generated/library-strict",
      managedPropertyMode: ManagedPropertyMode.strictOmit,
      // The servers now declare every generated key, so a key left bare really is the client's - which
      // is what makes `strict` safe here and pointless anywhere else: it demands a non-nullable key on
      // create, and after this release only `Branch` and `Copy` still are one.
      keyProperties: KeyProperties.strict,
    },
  },
};

export default config;
