# Integration Tests: ASP.NET Core

Runs odata2ts against [`odata2ts/test-server-asp-net`](https://github.com/odata2ts/test-server-asp-net),
the ASP.NET Core implementation of the standardized "Library" OData V4 feature test model.

See [../README.md](../README.md) for how this group fits into the repository and for the test-file scheme
used here. The server is consumed as a Docker image, started and stopped around the test run by
`test/globalSetup.ts`:

```bash
yarn int-test:asp-net
```

Override the image with `ASPNET_SERVER_IMAGE`, or point at an already running server with
`LIBRARY_BASE_URL` to work without Docker.

## Why this package exists next to `cap`

The same reference model, a completely different server stack - which is the point: a feature that works
against one implementation is not thereby proven. Two things in particular are only testable here.

**The binding notations.** `test/feature/Binding.test.ts` is the first place `@odata.bind` and the 4.01
`{"@id": …}` are exercised end to end. Until now the feature (odata2ts#38) was proven at generator level
only, against fixtures - and a fixture cannot show that the link actually moved on the other side. The
file asserts the round trip _and_ that the previously linked entity is left untouched, because getting
that wrong is silent: the server answers 204 either way.

**Query options in the request body.** `test/feature/QueryInRequestBody.test.ts` proves odata2ts#383:
`asPostRequest()` moves the query string into a `text/plain` body of `POST <resource>/$query`. It is the
only end-to-end coverage the feature has, because the live Trippin service does not implement `$query` -
it answers 500 to any POST against it, whatever the body, and so cannot tell a correct request from a
broken one. The file also covers the case the feature exists for: a query whose URL exceeds the server's
8 KB request line, rejected as a GET and answered as a POST.

**Both shapes of binary content.** This is the only server we have that emits `HasStream`, so
`test/feature/Blobs.test.ts` is where the media-entity form of odata2ts#149 is provable at all: `EBook`
and `AudiobookChapter` carry their content at `$value`, while `Audiobook.Sample` is a named stream
property. The two are addressed differently, and the file pins the URLs because getting it wrong yields a
404 rather than a wrong payload: `Sample` is declared on the subtype and exists **only** behind the type
cast, whereas `$value` addresses the entity itself and must **not** carry the cast segment. CAP models
none of this as a media entity, which is why the same feature looks different in `int-test/cap`.

**Operation overloads.** The reference model carries two overload pairs, and generating this client is
what surfaced odata2ts#423 - both overloads produced the same Q-object name, so the generated file did
not compile. `test/core/Operations.test.ts` covers the resulting behaviour.

## Observed ASP.NET behaviour

Where the server does not support something, the test asserts that rather than being dropped:

- **No individual property access.** `…/Media(<id>)/Title`, its `/$value` form and a collection-valued
  property all answer 404, so the whole `enablePrimitivePropertyServices` surface is unusable here. CAP
  serves it, see `int-test/cap/test/feature/PropertyServices.test.ts` for what that looks like.
- **No complex property as a resource.** `…/Branches(1)/Address` answers 404 as well - the value is only
  reachable through `$select` on the entity.
- **The type cast works on a collection, not on a single entity.** `/Media/Library.Catalog.Book` is served,
  `/Media(<id>)/Library.Catalog.Book` is not. The cast _q-properties_ do work on a single entity.
- **`$select` on a write request is ignored**: create, update and patch answer with the full entity. Same
  as CAP.
- **Composition stops at query options.** Query options on a composable function's result are served; a
  bound operation behind it (`/NewReleases()/Library.Circulation.AvailableCopies()`) is not.
- **Spatial values contradict the generated typing**: `Edm.GeographyPoint` becomes `string` in the model
  while the payload carries GeoJSON. That is a generator limitation, pinned in `DataTypes.test.ts`.

## Generation

The client is generated offline from `resource/library.xml`, a committed snapshot of the server's actual
`$metadata`, so generation stays server-independent. That metadata deliberately is what ASP.NET Core
OData really emits, not the idealized reference model: it has no `TypeDefinition`, no `Partner`
attributes and no `SRID` facets, none of which the model builder can express. The server's
`FEATURE-COVERAGE.md` records why.

`enableBindingProps` is switched on, since proving the binding notations is the point of this package. A
binding is stated by the key of the entity to bind; the URL the query objects build from it is only worth
anything if a real server resolves it.

`bundledFileGeneration` is off, so this package generates a folder per model plus the barrel files, while
`int-test/cap` keeps the bundled default. That way both file layouts are exercised at runtime instead of
only being type-checked. Models are therefore imported from their namespace barrel
(`src-generated/library/library-catalog/index.js`), not from one bundled model file.

### The 4.01 client

`src-generated/library-401` is the model once more with `odataVersionV4: "4.01"`. Unlike
`enableNativeInOperator`, this axis cannot be split across the two V4 packages - CAP does not speak 4.01, so
this server is the only place it can be held against anything. It is additive rather than a replacement,
which is what the difference needs anyway: the point is that the two versions spell the same request
differently, and that is only visible with both clients present.

Everything the option changes is payload, so a type check sees none of it. `feature/ODataVersion401.test.ts`
asserts the binding notation on the query object itself (`Location: {"@id": …}` against
`"Location@odata.bind": …`), because this is the one difference a server would swallow either way: ASP.NET
accepts both, so a client emitting the 4.0 spelling while announcing 4.01 would pass every behavioural test.

It also pins a limitation. odata2ts announces the version through `OData-Version`, a header on requests
carrying a body - and a GET carries none. This server therefore answers read requests in 4.0 form, so the
short-form control information a 4.01 client is _typed_ for (`@count`) arrives undefined while the value
sits under `@odata.count`. The response typing of `odataVersionV4: "4.01"` is a promise this server does not
keep on reads.

### The renamed client

The model is generated a **second** time, into `src-generated/library-renamed`, with `allowRenaming` on.
This is the only place that option meets a running server, and `test/feature/Renaming.test.ts` is the only
file which uses the resulting client.

Generated separately rather than replacing the raw one, because the point is the _mapping_ between the two
name forms, and a mapping is only observable where both ends are visible: with a single, renamed client a
wrongly built URL and a broken name mapping look exactly alike. The test writes through the renamed client
and reads back through the raw one, which is what pins down that the value really landed under the OData
name on the server.

The option renames what the caller writes, never what is sent - the model reads `title`, the wire still
says `Title` - and that has to hold in every `$select`, `$filter` and `$orderby`, in the key predicate of a
URL, in a request payload and when the response is read back. A fixture test accepts a broken mapping just
as happily as a correct one, and so does `tsc`.

Two names need help there, since renaming creates clashes the metadata does not have:

- `Location_` (a shelf mark) and `Location` (the branch an item sits in) both become `location` under
  camelCase. `propertiesByName` maps the former to `shelfLocation`. Without it the generator aborts - it
  does not emit an interface declaring the same name twice, because at runtime the second declaration
  simply wins and one of the two properties becomes unreachable.
- `Branch` exists in two namespaces. Unbundled generation keeps both, since they live in folders of their
  own, but two types of that name are a trap for the reader, so `byTypeAndName` gives the one in
  `PublisherRegistry` the name `PublisherBranch`. Bundled generation would have invented `Branch2`.
