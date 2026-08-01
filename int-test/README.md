# Integration Tests

Every package in this folder tests odata2ts against a **real, running OData server** that this repo
starts and stops itself. It is the third workspace group, next to `packages/` and `examples/`.

Each group has its own purpose and its own way of being run:

| group        | what                                                       | run by                                                         |
| ------------ | ---------------------------------------------------------- | -------------------------------------------------------------- |
| `packages/*` | the library, unit tests with a mocked HTTP client          | `yarn test`, `yarn coverage`, `Unit Tests With Coverage` in CI |
| `examples/*` | generator showcases; `test/` runs against generated output | `yarn test`, `yarn coverage`, `Unit Tests With Coverage` in CI |
| `int-test/*` | real servers, started as Docker containers                 | `yarn int-test`, `Container Integration Tests` in CI           |

`examples/*` deliberately stay in the main run. Their `test/` suites exercise the artifacts the
generator really produced, and that is the only place a generator regression surfaces - a fixture-based
test inside `packages/*` compares the generator against itself and cannot catch one. They are
mock-based and deterministic, so they cost little.

Two exceptions run outside that main stage, both because they depend on something external:

- `examples/main/int-test/**` talks to the live services at `services.odata.org`. It is excluded in
  `vite.config.ts` and has its own `Integration Tests` job.
- `examples/ts-floor-check` needs a separately installed TypeScript version and has its own job too.

The groups are selected by path, not by package name: `yarn test` uses
`--include 'packages/*' --include 'examples/*'`, `yarn int-test` uses `--include 'int-test/*'`.

For the coverage run the mechanism is a different one, and it is worth knowing: **there is no
`vitest.workspace.ts`** — Vitest 4 removed the workspace concept, and a file of that name is silently
ignored. `vitest run --coverage` walks the whole repository from the root `vite.config.ts`, so keeping
`int-test/**` out of it is done by the `exclude` there. Without that entry the coverage run would try to
start Docker containers.

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
