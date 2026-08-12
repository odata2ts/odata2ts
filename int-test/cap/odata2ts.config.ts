import { ConfigFileOptions, EmitModes, Modes } from "@odata2ts/odata2ts";

/** The running server to refresh from, or `undefined` to read the committed snapshots - see below. */
const SOURCE_URL = process.env.LIBRARY_BASE_URL;
/** One server, two endpoints: the V2 adapter sits on the same host under `/v2/`. */
const SOURCE_URL_V2 = SOURCE_URL?.replace(/\/v4\//, "/v2/");
const SOURCE = "resource/library.xml";
const SOURCE_V2 = "resource/library-v2.xml";

/**
 * Generates the odata2ts clients for the standardized "Library" test model, as served by the SAP CAP
 * implementation (repo `odata2ts/test-server-cap`) - once as OData V4 and once as OData V2.
 *
 * The sources are committed snapshots of the server's actual `$metadata` (`resource/library.xml` and
 * `resource/library-v2.xml`) - odata2ts is deliberately tested against the metadata CAP really emits
 * (flat mode, aspect-based media hierarchy, alternate keys only in metadata, ...), not against the
 * idealized reference model.
 *
 * The snapshots refresh themselves from a running server: point `LIBRARY_BASE_URL` at one and the first
 * service on each endpoint downloads `$metadata` and overwrites its file, which the services after it
 * then read, so a model change never has to be copied in by hand. It is the same variable the test setup takes an externally started server from,
 * and the V2 path is derived from it exactly as the setup derives it:
 *
 * ```
 * LIBRARY_BASE_URL=http://localhost:4004/odata/v4/library yarn build
 * ```
 *
 * Unset - which is how CI runs, where the container only comes up for the test run and `yarn build`
 * happens before it - the committed snapshots are used as-is and generation stays offline.
 *
 * The V2 model is not a second model: it is the very same service, translated on the fly by the
 * `@cap-js-community/odata-v2-adapter` middleware that CAP runs in front of its V4 endpoint. Everything
 * the V2 client sees is therefore that translation - which is exactly what makes it worth testing, since
 * it is the shape SAP systems actually put on the wire. See test/v2/ and the server repo's
 * FEATURE-COVERAGE-V2.md.
 */
const config: ConfigFileOptions = {
  mode: Modes.service,
  emitMode: EmitModes.ts,
  // also pretty-prints the downloaded metadata before it is stored
  prettier: true,
  // we definitely want to type check the generated artifacts
  debug: true,
  // On against the default, which is unbundled since the file layout became the user's choice. This is the
  // division of labour with `int-test/asp-net`: that package generates a folder per model, this one keeps
  // the bundled form, so both layouts are exercised at runtime rather than only type-checked.
  bundledFileGeneration: true,
  // on, because the property services are a generator feature of their own and otherwise never
  // meet a real server: see test/feature/PropertyServices.test.ts
  enablePrimitivePropertyServices: true,
  services: {
    library: {
      serviceName: "Library",
      // the one service that refreshes the snapshot; the others below read the file it leaves behind,
      // so this entry has to stay first
      sourceUrl: SOURCE_URL,
      source: SOURCE,
      refreshFile: true,
      output: "src-generated/library",
      // V4 only, and on here rather than in `int-test/asp-net`, which keeps the emulating default: the
      // option has exactly two states and both are worth having against a real server, so they are split
      // across the two V4 packages instead of duplicating a suite. `test/core/QueryFunctionality.test.ts`
      // covers it on either side - the assertion differs only in the URL that reaches the server.
      v4: { enableNativeInOperator: true },
    },
    /**
     * The V4 model with `unflattenComplexTypes`, which is what this whole server is the case for:
     * CAP states `Member.Address` as four flat properties and never as the `<ComplexType>` it declares
     * elsewhere, so only a real CAP server settles whether odata2ts puts it back together correctly.
     *
     * Generated next to the raw client rather than replacing it, because both halves are the point: the raw
     * one proves what the server actually sends and keeps the flat form covered, this one proves the
     * reshaping. See test/feature/UnflattenComplexTypes.test.ts.
     */
    libraryShaped: {
      serviceName: "LibraryShaped",
      source: SOURCE,
      output: "src-generated/library-shaped",
      unflattenComplexTypes: true,
    },
    /**
     * The same option against the V2 rendition, since the adapter flattens exactly as the V4 endpoint does
     * but the client builds different URLs and payloads for it. See test/v2/feature/UnflattenComplexTypes.test.ts.
     */
    libraryShapedV2: {
      serviceName: "LibraryShapedV2",
      // as above, the first service on the V2 endpoint is the one that refreshes its snapshot
      sourceUrl: SOURCE_URL_V2,
      source: SOURCE_V2,
      refreshFile: true,
      output: "src-generated/library-shaped-v2",
      unflattenComplexTypes: true,
      v2: {
        responseResultsWrapping: true,
        payloadResultsWrapping: false,
      },
    },
    /**
     * The V4 model a second time, with converters switched on.
     *
     * Converters had only ever met a real server as V2, through `int-test/olingo-v2`, and V2 is a
     * different problem: there every timestamp arrives as `/Date(<ticks>)/` and every wide numeric type as
     * a string, so the raw client types them as `string` and the converter has something to parse. V4 hands
     * over real ISO values - and types `Edm.Decimal` and `Edm.Int64` as `number`, which is precisely where
     * precision goes missing without anyone noticing.
     *
     * `v4BigNumberAsString` belongs with them rather than being its own variant: it asks the server for
     * those two types as strings (`IEEE754Compatible` in accept and content-type). Without it the converter
     * would be handed a number which has already lost its precision, and converting that is pointless. The
     * two options only mean anything together.
     *
     * Generated separately rather than replacing the raw client, because both halves are the point: the raw
     * one shows what the server actually sends, the converted one what the converters make of it. See
     * test/feature/Converters.test.ts.
     */
    libraryConverted: {
      serviceName: "LibraryConverted",
      source: SOURCE,
      output: "src-generated/library-converted",
      v4: { bigNumberAsString: true },
      converters: [
        "@odata2ts/converter-luxon",
        "@odata2ts/converter-big-number",
        { module: "@odata2ts/converter-common", use: ["int64ToBigIntConverter"] },
      ],
    },
    libraryV2: {
      serviceName: "LibraryV2",
      source: SOURCE_V2,
      output: "src-generated/library-v2",
      /**
       * Response wrapped, payload not - and this server is the reason the two are separate options
       * (odata2ts#237).
       *
       * The adapter answers with V2's extra results object around a collection valued attribute, exactly
       * as the native server in `int-test/olingo-v2` does, and the client hands that structure through
       * untouched. It refuses the very same shape in a request though: a payload carrying
       * `{"Keywords": {"results": [...]}}` comes back as 400 "Value must be an array". Olingo accepts
       * either, so only this side settles the question - see test/v2/feature/ResultsWrapping.test.ts.
       */
      v2: {
        responseResultsWrapping: true,
        payloadResultsWrapping: false,
      },
    },
  },
};

export default config;
