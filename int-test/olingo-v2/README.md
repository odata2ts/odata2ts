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

- **managed container** (default): pulls the exact version of `ghcr.io/odata2ts/test-server-olingo-v2`
  pinned in `server-image.json`, waits for the service, maps a dynamic port and removes the container
  afterwards. The server repo dispatches each release here, which opens a PR raising that pin; the
  version moves only with a green integration-test run behind it. Override the image with
  `OLINGO_SERVER_IMAGE`.
- **external server**: if `LIBRARY_BASE_URL` is set, that URL is used as-is:

  ```bash
  LIBRARY_BASE_URL=http://localhost:4004/odata/v2/library yarn int-test:olingo-v2
  ```

The server holds its data in memory and rebuilds it per process, so a restart is a full reset — there is
nothing to deploy or seed. Test files still share one instance, so `fileParallelism` is off and anything
written is put back.

## Three generated clients

The package generates the model **three times** from the same snapshot:

| Service            | Output                            | Purpose                                             |
| ------------------ | --------------------------------- | --------------------------------------------------- |
| `library`          | `src-generated/library`           | no converters - pins what the server actually sends |
| `libraryConverted` | `src-generated/library-converted` | Luxon, BigNumber, bigint, and `converter-v2-to-v4`  |
| `libraryRenamed`   | `src-generated/library-renamed`   | `allowRenaming` - the V2 half of the name mapping   |

V2 is where converters earn their keep: the format hands over every timestamp as `/Date(<ticks>)/` and
every numeric type that does not fit a JS number as a string, so the raw model types all of those as
`string`. Both halves are worth pinning, and neither is meaningful alone - `feature/DataTypes.test.ts`
covers the wire format, `feature/Converters.test.ts` covers what the converters make of it.

This is the first place converters meet a **running** V2 server at all; `examples/main` covers the
converted V2 model only against a mock client.

`libraryRenamed` is the V2 half of what `int-test/asp-net` does for V4. Renaming is not version-neutral:
the mapping between the TypeScript name and the OData one has to survive whatever the client builds, and V2
builds several of those things differently - a key predicate carries a type prefix (`Books(guid'...')`),
`$expand` cannot nest query options, a binding goes through `__metadata.uri`, and the payload arrives
wrapped in `d`. A mapping proven over V4 says nothing about any of that. `feature/Renaming.test.ts` writes
through the renamed client and reads back through the raw one, which is what shows a value landed under its
OData name rather than under the TypeScript one.

Two names need help there, the same two as in the V4 metadata since it is the same model: `Location_` (a
shelf mark) and `Location` (the branch an item sits in) both become `location` under camelCase, so
`propertiesByName` maps the former to `shelfLocation`; and `Branch` exists in two namespaces, so
`byTypeAndName` gives the one in `PublisherRegistry` the name `PublisherBranch`.

`enumType` has no counterpart on this side: OData V2 has no enum types at all, and what the V4 model
declares as the `Amenities` enum is a plain `Edm.Int32` in this metadata. The axis is V4-only, not merely
untested here.

All three clients are generated with `v2ResponseResultsWrapping` and `v2PayloadResultsWrapping` on, because
that is what this server does: an expanded collection valued navigation property arrives as
`{"Copies": {"results": [...]}}`, the V2 serialisation of a feed. The client hands that structure through untouched, so the options are what
makes the generated types describe the actual traffic — `feature/ResultsWrapping.test.ts` pins both ends.
The payload side stays a separate option because no response can settle it: Olingo accepts a deep insert
wrapped **and** unwrapped, while CAP's V2 adapter answers the wrapped payload with 400 "Value must be an
array" although it wraps its own responses (odata2ts#237, `int-test/cap/test/v2/feature/ResultsWrapping.test.ts`). With both options off
the generated types would simply be wrong here, which is why there is no variant for that state — the
model-only flavour of it lives in the compile gate, `int-test/config-variants`.

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
- **A binary error response carries no message.** The client reads the response of a binary request as a
  blob, error responses included, so the XML error body this server sends back for a `$value` on an
  unknown entity is never looked into: the status is right, the message is the client's fallback.
  Pinned in `feature/Blobs.test.ts`.
- **A query option on a modification request is out of scope for V2.** System query options are defined
  for retrieval only, so there is no `$select` on a `PUT` for a service to honour. This server routes on
  the shape of the URI and answers 405; that is a conforming reaction to a request the protocol does not
  describe. The client lets it be expressed because the command type is shared with the read path.
- **Expanding a complex property is refused.** odata2ts widened `expand()` to accept complex properties
  for V2, because V2 does not inline them the way V4 does - but this server takes navigation properties
  only, and inlines its complex values anyway. `feature/ComplexTypes.test.ts` pins both rejections next
  to the deep select through a _navigation_ property, which does work.
- **Filtering on a converted date works**, and did not before: V2's `Edm.DateTime` literal is
  timezone-less while a converter hands back a full ISO string, so `QDateTimeV2Path` now normalises to
  UTC and drops the designator. A strict V2 server rejects the ISO form outright.

## Bugs this package found

Four, all fixed in the same branch, none of which any existing suite could have caught:

- `PrimitiveTypeServiceV2` destructured its converter (`{ convertFrom, convertTo }`), which strips `this`
  - so any converter implemented as a class threw, and `ChainedConverter` is exactly that, produced as
    soon as two converters are configured. `PrimitiveTypeServiceV4` never had the bug.
- `QueryObjectGenerator` emitted a converter-mapped operation return type without importing it, so a
  service with both converters and a `Edm.Decimal`-returning operation generated a q-object file that
  did not compile.
- `QDateTimeV2Path` and `QDateTimeV2Param` wrapped a converted value into `datetime'...'` verbatim, so a
  converted date produced `datetime'...T00:00:00.000Z'` - a literal V2 does not define, since
  `Edm.DateTime` carries no timezone. Filtering on a date was therefore impossible with converters on.
- The server's own `MostReadMedium` unboxed a nullable score and answered 500 once a client had created
  an entity without it (fixed in test-server-olingo-v2).
