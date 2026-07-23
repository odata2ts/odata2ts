# Integration Tests

Every package in this folder tests odata2ts against a **real, running OData server** that this repo
starts and stops itself. It is the third workspace group, next to `packages/` and `examples/`.

Each group has its own purpose and its own way of being run:

| group        | what                                              | run by                                                         |
| ------------ | ------------------------------------------------- | -------------------------------------------------------------- |
| `packages/*` | the library, unit tests with a mocked HTTP client | `yarn test`, `yarn coverage`, `Unit Tests With Coverage` in CI |
| `int-test/*` | real servers, started as Docker containers        | `yarn int-test`, `Integration Tests` in CI                     |
| `examples/*` | showcases of generator configuration              | **on demand only** - never part of a pipeline                  |

`examples/*` have `test` / `int-test` scripts of their own, but neither the root scripts nor CI ever
invoke them; run them explicitly when you want them, e.g.
`yarn workspace @odata2ts/example-main int-test`.

The groups are selected by path, not by package name: `yarn test` uses `--include 'packages/*'` and
`yarn int-test` uses `--include 'int-test/*'`. `vitest.workspace.ts` likewise only lists `packages/*`,
so the coverage run cannot even see the other two groups.

## The servers

| package                  | server                                                          |
| ------------------------ | --------------------------------------------------------------- |
| [`cap`](./cap/README.md) | SAP CAP implementation of the standardized "Library" test model |

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
| `feature/CrudQuery.test.ts`       | system query options on `create`/`add`/`update`/`patch`                        |

Where a server does not support something, the test asserts the rejection rather than being dropped -
that keeps the limitation visible instead of silently untested.

## Adding another test server

The odata2ts side is language-agnostic: a server implemented in ASP.NET, Java or anything else is
consumed exactly like CAP, because all it has to provide is a Docker image serving the standardized
test model. Adding one means:

1. a new package `int-test/<server>`, laid out as above,
2. a `globalSetup.ts` pointing at that server's image and service path,
3. one more entry in the matrix in `.github/workflows/integration-test.yml`,
4. a `README.md` in the package describing that server's quirks.

No compiler, SDK or runtime of the server's language is ever needed in this repository.
