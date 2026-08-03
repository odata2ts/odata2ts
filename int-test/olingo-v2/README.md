# Integration Tests: Apache Olingo 2

Runs odata2ts against [`odata2ts/test-server-olingo-v2`](https://github.com/odata2ts/test-server-olingo-v2),
the Apache Olingo 2 implementation of the standardized "Library" **OData V2** feature test model.

See [../README.md](../README.md) for how this group fits into the repository as a whole and for the
test-file scheme used here.

```bash
yarn int-test:olingo-v2
```

## Why a second V2 server

`int-test/cap/test/v2` already drives the V2 client against a V2 endpoint — but that one is an
**adapter**, `@cap-js-community/odata-v2-adapter`, translating in front of a V4 service. This package
drives the same client against a server that speaks V2 **natively**, on the reference implementation of
V2 for the JVM.

Two servers answering the same requests for different reasons is what separates "this is how V2 behaves"
from "this is what one adapter does". Several of the sharpest findings only exist as a comparison:

| Behaviour                                   | Olingo (native V2)                  | CAP + adapter                             |
| ------------------------------------------- | ----------------------------------- | ----------------------------------------- |
| `update` / `patch` response                 | 204, no body — as V2 prescribes     | 200 with the entity, which V2 cannot type |
| Writing a single property                   | persists the value                  | **204, and the value is destroyed**       |
| Round-tripping a `/Date(…)/ ` into a filter | 400 — not the V2 URI literal format | accepted                                  |
| `Edm.Int64` operation result                | `d.<OpName>` is the value           | wrapped again in `{ value, __metadata }`  |
| Entity type inheritance                     | rendered **and** partly served      | not expressible at all                    |
| Deep insert                                 | 501                                 | works along compositions                  |

Where they **agree**, the behaviour is V2's rather than one implementation's — which is what makes
`feature/DataTypes.test.ts` worth having twice. Two independent servers deliver `Edm.Byte` as a number
while odata2ts types it as a string; that settles where the bug is.

## Provisioning the server

`globalSetup` has the same two modes as the other server packages:

- **managed container** (default): pulls `ghcr.io/odata2ts/test-server-olingo-v2:latest`, waits for the
  service, maps a dynamic port and removes the container afterwards. Override the image with
  `OLINGO_SERVER_IMAGE`.
- **external server**: if `LIBRARY_BASE_URL` is set, that URL is used as-is:

  ```bash
  LIBRARY_BASE_URL=http://localhost:4004/odata/v2/library yarn int-test:olingo-v2
  ```

The server holds its data in memory and rebuilds it per process, so a restart is a full reset — there is
nothing to deploy or seed. Test files still share one instance, so `fileParallelism` is off and anything
written is put back.

## Generation

The client is generated offline from `resource/library-v2.xml`, a committed snapshot of the server's
actual `$metadata`. odata2ts is deliberately tested against what Olingo really emits — one entity set per
concrete media type, the full inheritance hierarchy, `ConcurrencyMode` as a facet — not against the
idealized reference model.

Generating from it exercises one thing no other package does: the model declares `Branch` in two
namespaces on purpose, and the generator renames the second to `Branch2` (odata2ts#222).

## Observed behaviour

Where the server does not support something, the test asserts the rejection rather than being dropped:

- **Entity type inheritance is rendered but not served.** Olingo puts the whole four-level hierarchy into
  `$metadata` and then cannot serialize a derived instance through a set typed on its base, so the server
  exposes one entity set per concrete type. `core/Inheritance.test.ts` covers the half that works — a
  `TradeJournal` arriving complete, four levels of inherited properties, correctly typed — and pins the
  edge: `Copy.Medium` resolves for a copy of a book and 404s for a copy of a DVD.
- **`Copies` is read-only for this client.** `ConcurrencyMode="Fixed"` makes the server demand `If-Match`,
  and odata2ts has no ETag handling in V2, so every write answers 428. (The server never compares the
  token either, but that is not observable from here.)
- **Deleting a property value answers 405.** Olingo's dispatcher has no route for `DELETE` on a property
  URL. Setting a value to null this way is a `MAY` in V1–V3.
- **A side-effecting operation answers 201, not 200** — even when it creates nothing.
- **No binary content API.** The server declares two media link entries and serves them from `/$value`;
  `@odata2ts/odata-service` has no V2 counterpart to `StreamServiceV4`, so `feature/Blobs.test.ts`
  asserts the gap from both sides with the only raw `fetch` calls in this package.
