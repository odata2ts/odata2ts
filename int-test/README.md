# Integration Tests

This folder contains integration tests in general. Some are static like:

- cli: Testing the CLI
- ts-floor-check: Testing that the minimum TS Version promise holds

Others test odata2ts against a **real, running OData server** that this repo
starts and stops itself. Dockerized.

## The servers

| package                          | server                                                          |
| -------------------------------- | --------------------------------------------------------------- |
| [`cap`](./cap/README.md)         | SAP CAP implementation of the standardized "Library" test model |
| [`asp-net`](./asp-net/README.md) | ASP.NET Core implementation of the same model                   |

## Layout of a package

```
int-test/<server>/
├─ resource/<model>.xml   committed metadata snapshot - generation stays offline
├─ odata2ts.config.ts     generates the client from that snapshot
├─ src-generated/         generated client (gitignored, produced by `yarn build`)
└─ test/
   ├─ <Server>TestConstants.ts   service instance + seed-data keys
   ├─ core/                      what every OData server is expected to do
   └─ feature/                   individual features, incl. their limitations
```

Scripts: `build`/`generate` (offline codegen), `test` (the integration tests), `test-compile`
(type-check).

Test files follow the same scheme in every package, one concern per file:

| file                              | covers                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------ |
| `core/CrudOperations.test.ts`     | create, read, update, patch, delete - reading **without** system query options |
| `core/QueryFunctionality.test.ts` | the system query options on read requests                                      |
| `core/Operations.test.ts`         | functions and actions, bound and unbound                                       |
| `core/Singleton.test.ts`          | the singleton: addressed by name, read and written like an entity              |
| `feature/CrudQuery.test.ts`       | system query options on `create`/`add`/`update`/`patch`                        |
| `feature/Blobs.test.ts`           | binary content: stream properties and media entities                           |
| `feature/Subtypes.test.ts`        | type cast segment and derived types' properties (ASP.NET only - CAP is flat)   |

Where a server does not support something, the test asserts the rejection rather than being dropped -
that keeps the limitation visible instead of silently untested.

Two rules hold for every test here:

- **Errors are asserted with status _and_ message**, through `test/expectODataError.ts`. A bare
  `rejects.toThrow()` also passes for a typo in the URL or a 500 where a 404 was meant. The messages
  differ per server and are pinned as they arrive - ASP.NET sends no body with a 404, so the client's
  fallback text shows, while CAP sends `"Not Found"`.
- **Response structures are typed**, via `expectTypeOf`. That is the only place a regression in the
  generated typing surfaces, and it is checked by `yarn test-compile` (`tsc`), not at runtime. Note that
  `expectTypeOf` evaluates its argument, so pass the method (`cmd.execute`), never a live call.

These suites, not `examples/main`, are where important integration coverage belongs: everything in
`examples/main` is optional (see the repository's CLAUDE.md).

## Adding another test server

The odata2ts side is language-agnostic: a server implemented in ASP.NET, Java or anything else is
consumed exactly like CAP, because all it has to provide is a Docker image serving the standardized
test model. Adding one means:

1. a new package `int-test/<server>`, laid out as above,
2. a `globalSetup.ts` pointing at that server's image and service path,
3. one more entry in the matrix in `.github/workflows/integration-test.yml`,
4. a `README.md` in the package describing that server's quirks.

No compiler, SDK or runtime of the server's language is ever needed in this repository.
