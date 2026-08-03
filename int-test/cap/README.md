# Integration Tests: SAP CAP

Runs odata2ts against [`odata2ts/test-server-cap`](https://github.com/odata2ts/test-server-cap), the
SAP CAP implementation of the standardized "Library" OData V4 feature test model - **twice**: once over
OData V4, and once over the OData **V2** face that the same server presents through
[`@cap-js-community/odata-v2-adapter`](https://github.com/cap-js-community/odata-v2-adapter).

See [../README.md](../README.md) for how this group fits into the repository as a whole and for the
test-file scheme used here.

The server is consumed as a **Docker image**, started and stopped around the test run by
`test/globalSetup.ts` via [testcontainers](https://node.testcontainers.org/):

```bash
yarn int-test:cap
```

## Provisioning the server

`globalSetup` has two modes:

- **managed container** (default): pulls the image, waits for the service to answer, maps a dynamic
  host port, and stops + removes the container afterwards. Needs a running Docker daemon. Override the
  image with `CAP_SERVER_IMAGE`.
- **external server**: if `LIBRARY_BASE_URL` is set, that URL is used as-is and no container is
  started - for machines without Docker, or to test against a server you started yourself:

  ```bash
  LIBRARY_BASE_URL=http://localhost:4004/odata/v4/library yarn int-test:cap
  ```

  Note that the CAP server only serves its custom operations when started through the full `cds`
  tooling (`cds build` / `cds watch` from `@sap/cds-dk`), as the Docker image does. The bare
  `cds-serve` binary from `@sap/cds` serves the generic CRUD surface but loads no TypeScript handlers,
  so `test/core/Operations.test.ts` fails with 501 against such a server while the other files pass.

Because all test files share one server instance, `fileParallelism` is off - writes in one file must
not race reads in another. That applies across the two protocol versions as well: `test/v2/` writes to
the same rows as `test/core/`, so both restore the seed values they touch.

The V2 base URL is not configured anywhere. `globalSetup` derives it from the V4 one by swapping the
version segment, because that is what the adapter does - there is one server, on one port.

## Generation

The client is generated offline from `resource/library.xml`, a committed snapshot of the server's
actual `$metadata`. odata2ts is deliberately tested against the metadata CAP really emits - flat mode,
the aspect-based media hierarchy, alternate keys that exist only in the metadata - rather than against
the idealized reference model. Refresh the snapshot from the running server (or via the server repo's
`npm run metadata`) whenever the model changes.

A second client is generated the same way from `resource/library-v2.xml`, the snapshot of
`/odata/v2/library/$metadata`. It is not a second model: the adapter translates the one service on the
fly, so that file is the translation, and testing against it is what makes the translation visible.

Assertions use the fixed seed data from `db/data/*.csv` in the server repo.

## Observed CAP behaviour

Where CAP does not support something, the test asserts the rejection rather than being dropped, so the
limitation stays visible:

- `$select` on a **write** request is not honoured: CAP returns the full entity for
  `create`/`update`/`patch` regardless. It does honour `Prefer: return=representation`, which is what
  `update<true>()` / `patch<true>()` send.
- `add()` on the collection-valued `Keywords` property is refused with _"Method POST is not allowed for
  singletons and individual entities"_ - CAP stores such a property as a plain array element instead of
  exposing it as an addressable collection resource.
- **A lambda over a primitive collection takes the server down.** `$filter=Keywords/all(a:a ne 'X')` is
  valid OData and exactly what the query builder renders, but `@sap/cds` 10.0.3 throws an uncaught
  `TypeError` in its own OData parser (`libx/odata/parse/afterburner.js`, `_validateXpr`) and the process
  exits. Since all test files share one server, the test for it is `test.skip`ped rather than asserted -
  the same expression works against ASP.NET. Lambdas over _navigation_ collections are fine here.
- **An invalid query option is silently accepted.** `$top=-1` answers 200 with the unrestricted set, where
  ASP.NET refuses it with 400. A client gets nothing to react to, which is why both behaviours are pinned.
- **Binary content has only one shape here.** CAP emits no `HasStream`, so the reference model's media
  entities arrive as plain `Edm.Stream` properties (`EBook.content`) next to the genuinely named stream
  property (`Audiobook.Sample`). `test/feature/Blobs.test.ts` therefore addresses both by property name,
  with no `$value` and no type cast segment - the same feature reaches the ASP.NET server as
  `…/Media(<id>)/$value` and `…/Media(<id>)/Library.Catalog.Audiobook/Sample`. CAP also answers with the
  MIME type declared in its model rather than the uploaded one, where ASP.NET returns what it was given.

## The V2 suite

`test/v2/` mirrors the V4 folders file by file, against the same server through the V2 adapter. It exists
because V2 is a different client in odata2ts - other services, other response models, other q-object paths -
and until now it met no running server anywhere in this repository.

Everything the adapter does to the _model_ is documented on the server side, in
[FEATURE-COVERAGE-V2.md](https://github.com/odata2ts/test-server-cap/blob/main/FEATURE-COVERAGE-V2.md).
What belongs here is what the **client** does with it:

- **`Edm.Byte` and `Edm.SByte` are typed as `string` but arrive as numbers.** odata2ts groups them with the
  string-serialised numeric types in `DataModelDigestionV2.mapODataType`, while V2's JSON format puts them
  among the plain numbers - so `book.AgeRating === "16"` is `false` although both sides are typed `string`.
  The other string-typed numbers (`Int64`, `Decimal`, `Double`, `Single`) are mapped correctly.
  Pinned in `test/v2/feature/DataTypes.test.ts`.
- **Binary content changes shape between the versions.** What the V4 metadata declares as `Edm.Stream`
  properties (`EBook.content`, `Audiobook.Sample`) the adapter re-expresses as media link entries, since
  V2 has no stream type - so the same rows are reached as `EBooks(<id>)/content` over V4 and as
  `EBooks(guid'<id>')/$value` over V2, and an entity can carry only one payload here.
  `test/v2/feature/Blobs.test.ts` writes over one version and reads over the other to pin that they meet.
- **No ETag handling.** Nothing reads `__metadata.etag`, nothing sends `If-Match`, so `Copies` is
  create-only - as it is over V4, except that the V2 metadata actually declares the token.
- **A write answers with a body the typing does not admit.** V2 has no `Prefer: return=representation` and
  no `<true>` switch, so `update`/`patch` are typed `HttpResponseModel<undefined>`; this server answers 200
  with the full entity. The data is there and unreachable without a cast.
- **`QFunctionV2`/`QFunctionV4` needed a default for `ResponseStructure`.** A void V2 operation is a
  `FunctionImport` with `m:HttpMethod="POST"` - V2 has no separate action - and the generator then emits
  `QFunctionV2<Params>` with one type argument. Both classes required two, so the generated code did not
  compile. `QAction` already had the default; the function classes now do too.
