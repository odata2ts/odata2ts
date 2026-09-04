# odata2ts (generator + runtime)

Generates a typed TypeScript client from an OData v4 (and v2) service's metadata (CSDL). This context
covers the cache-key/invalidation feature: giving generated `RequestCmd`s a stable, collision-free identity
so a consuming cache library (e.g. TanStack Query) can be told what to invalidate after a write.

## Language

**Resource**:
The thing an OData URL addresses, per spec — identified by a chain of container- or property-scoped
_names_ terminated by a key, never by type. Two different resources (e.g. two entity sets) can share a
type; sharing a type does not make them the same resource.
_Avoid_: using "type" as a stand-in for resource identity — this was the bug the identity redesign fixes.

**Entity set**:
The named, top-level collection a non-contained entity actually lives in (e.g. `Authors`, `Editors`) — the
anchor for a resource's canonical identity. Distinct from the entity's _type_, which only describes its
shape and may be shared across multiple entity sets.
_Avoid_: conflating with "entity type" — see [[Resource]].

**Canonical URL**:
The one spec-defined address for a resource: entity-set name + key predicate for a non-contained entity
(no cast segment, ever — OData v4.01 Part 2 §4.3.1), or the parent's canonical URL + containment nav
property's own name + [key] for a contained one (§4.3.2). Always name-anchored, never type-anchored.

**Cache key**:
The value `RequestCmd.cacheKey` produces for a read: a flat, ordered tuple identifying the exact route
taken to reach a response, used as a cache library's query key. Distinct from a resource's canonical
identity — a cache key describes _how the client got there_ (route), not necessarily the resource's one
true address.
_Avoid_: "identity" alone — ambiguous between cache key (route-shaped) and canonical id (resource-shaped).

**Root / hop**:
The first element of a cache key (root) and each subsequent chained segment (hop), reached via navigation
or containment. As of the identity redesign, root and hop share one uniform local shape: `(name, kind,
key?)` — `name` is the entity set's own name at the root, or the navigation/containment property's own
OData name at a hop.

**Kind marker**:
The `"list"` / `"detail"` tag carried at the root and every hop. Not part of identity — a deliberate,
TanStack-Query-community-style granularity control (`todoKeys.lists()` vs `todoKeys.detail(id)`), kept even
though the identity redesign removed type from the key.

**`invalidates`**:
The array `RequestCmd` produces for a _write_, listing cache keys (or `touchesResource`-style patterns) that
became stale as a result of that write.

**`touchesResource`**:
A pattern-matching helper: does a given cache key fall under a given (partial) key prefix/pattern? Used to
express "invalidate every list under this resource" without enumerating every concrete key.

**Canonical id**:
A runtime-only string identifying one specific resource observed in an actual server response — the join
key `ResourceIdentityHandler` uses to relate cache keys (route-shaped) that happen to point at the same
resource (identity-shaped). Serialized identically to `ConcurrencyHandler`'s existing ETag key: the
resource's own canonical-URL segment, `entitySetName + QFunction.buildUrl(key)` (e.g. `Copies(3)`,
`Copies(Id=1,Category='books')`) — deliberately the same encoding already proven for ETags, not a new
format.

**Seeding**:
Pre-populating a cache (or, here, `ResourceIdentityHandler`'s route↔canonical-resource map) with a value it
has not itself fetched or observed — TkDodo's term (cited by the official TanStack Query docs' "Seeding the
Query Cache"), the same source as [[Kind marker]]'s list/detail convention.
_Avoid_: "cold start" — implies a temporary state that warms up with ordinary usage. The real shape is
structural, not temporal: a route pair that's never read together in the same client instance stays
unmapped indefinitely, however long the app runs, unless it's seeded.

`ResourceIdentityHandler` supports **hydration-style** seeding only: `dehydrate()`/`hydrate()` bulk-transfer
the exact `(canonicalId, hierarchicalKey)` pairs `record()`/`resolve()` already traffic in — e.g. across an
SSR→client boundary, or persisted across sessions — no new data shape, mirroring TanStack's own
`dehydrate`/`hydrate`. It deliberately does _not_ support **static** seeding (populating a mapping before
_any_ read has ever happened, anywhere): a canonical id needs a real key value, and reaching a resource's
_other_ routes without ever having observed them needs the referential-constraint reasoning
[[Convergence]] deliberately dropped — reintroducing it here would just be that mechanism through a side
door.

**`ResourceIdentityHandler`**:
A runtime store (client-held, like `ConcurrencyHandler`) recording which cache keys were observed to resolve
to which canonical id — one entry per entity actually present in a response, at every level (the directly
addressed resource and every `$expand`'d entity, however deep), not just the top. Recording is gated by a
**static, generator/Q-object-forwarded** signal (each hop's own entity-set name, present only for
non-contained navigation — `@odata.context` was tried and rejected, see [[Convergence]]), never by response
inspection. Lets a write on one route invalidate a cache key reached via a _different_ route to the same
resource — replacing the old generation-time "type flattening" / re-rooting prediction with a
runtime-observed mapping.

**Convergence**:
The general problem this whole feature keeps returning to: two different routes (a navigated hop vs a
direct query) reaching the same resource should produce cache keys (or at least an invalidation path) that
recognize each other. Previously attempted at generation time via `ReferentialConstraint`/`Partner` grading
(removed); now attempted at runtime via [[ResourceIdentityHandler]]. `@odata.context`/`@odata.id` were also
tried and rejected as the runtime signal (unreliable across servers, and `@odata.context` can't reach
`$expand`'d entities at all) in favor of a static entity-set-name signal the generator/Q-objects forward
directly.
