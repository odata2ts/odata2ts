import { ConfigFileOptions, EmitModes, Modes, TypeModel } from "@odata2ts/odata2ts";

/**
 * Generates the odata2ts client for the standardized "Library" OData V4 test model, as served by the
 * ASP.NET Core implementation (repo `odata2ts/test-server-asp-net`).
 *
 * The source is a committed snapshot of the server's actual `$metadata` (`resource/library.xml`), so
 * generation stays offline and server-independent - odata2ts is tested against the metadata ASP.NET Core
 * OData really emits, not against the idealized reference model. Notably that metadata has no
 * `TypeDefinition`, no `Partner` attributes and no `SRID` facets, none of which the model builder can
 * express; see FEATURE-COVERAGE.md in the server repo.
 *
 * `enableBindingProps` is on, because this server is the first one we have that actually honours the
 * binding notations - proving them out end to end is the point of this package.
 *
 * `bundledFileGeneration` is off, as a division of labour: `int-test/cap` keeps the bundled default, so
 * both file layouts are exercised at runtime rather than only type-checked.
 *
 * The model is generated a second time, with `allowRenaming` on - see the `libraryRenamed` service below.
 */
const config: ConfigFileOptions = {
  mode: Modes.service,
  emitMode: EmitModes.ts,
  prettier: true,
  debug: true,
  // off, so that one of the two file layouts meets a real server: this package generates a folder per
  // model, `int-test/cap` keeps the bundled default
  bundledFileGeneration: false,
  enableBindingProps: true,
  // on, because the property services are a generator feature of their own and otherwise never
  // meet a real server: see test/feature/PropertyServices.test.ts
  enablePrimitivePropertyServices: true,
  // on, because a deep insert can only be proven against a server that actually stores the nested
  // entities: see test/feature/DeepInsert.test.ts
  enableDeepInsertProps: true,
  services: {
    library: {
      serviceName: "Library",
      source: "resource/library.xml",
      output: "src-generated/library",
    },
    /**
     * The same model a second time, with renaming switched on.
     *
     * Generated separately rather than replacing the raw client, because the point is the *mapping* between
     * the two name forms, and a mapping is only observable where both ends are visible. With a single,
     * renamed client a wrongly built URL and a broken name mapping look exactly alike; next to a client
     * whose names are the server's own, they do not.
     *
     * `allowRenaming` is a generator feature which nevertheless has to hold on the wire: it renames what the
     * caller writes, never what is sent. Every `$select`, `$filter` and `$orderby`, every key predicate and
     * every payload has to carry the OData name again, and the response has to be read back into the renamed
     * property. Only a server rejects the wrong spelling - a fixture test accepts a broken mapping just as
     * happily as a correct one. See test/feature/Renaming.test.ts.
     */
    libraryRenamed: {
      serviceName: "LibraryRenamed",
      source: "resource/library.xml",
      output: "src-generated/library-renamed",
      allowRenaming: true,
      // `Location_` (the shelf mark) and `Location` (the branch an item sits in) are distinct OData names,
      // but camelCase collapses both onto `location`. The generator refuses to emit that, so one of them
      // has to be told apart by hand - which is what this option is for.
      propertiesByName: [{ name: "Location_", mappedName: "shelfLocation" }],
      // The model carries `Branch` twice, in two namespaces. Unbundled generation keeps both - they live in
      // folders of their own and the barrels re-export each namespace under its own name - but two types
      // called `Branch` are a trap for the reader. Bundled generation would have invented `Branch2` here;
      // this says what it actually is.
      byTypeAndName: [
        {
          name: "PublisherRegistry.Branch",
          type: TypeModel.EntityType,
          mappedName: "PublisherBranch",
        },
      ],
    },
  },
};

export default config;
