# Integration Tests: SAP CAP

Runs odata2ts against [`odata2ts/test-server-cap`](https://github.com/odata2ts/test-server-cap), the
SAP CAP implementation of the standardized "Library" OData V4 feature test model.

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
not race reads in another.

## Generation

The client is generated offline from `resource/library.xml`, a committed snapshot of the server's
actual `$metadata`. odata2ts is deliberately tested against the metadata CAP really emits - flat mode,
the aspect-based media hierarchy, alternate keys that exist only in the metadata - rather than against
the idealized reference model. Refresh the snapshot from the running server (or via the server repo's
`npm run metadata`) whenever the model changes.

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
