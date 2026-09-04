# Remove the generated `NavHopsTable`

`NavHopsTable` (`NavHopsGenerator.ts`, emitted as `CacheKeyNavHops.ts` per package) existed to give
`$expand`/`deepEdit` cache-key encoding a target entity type's fully-qualified name for each hop, since the
Q-object passed into `expand()`/`expanding()` doesn't carry its own type's FQN. The [names-not-types
identity redesign](/docs/superpowers/specs/2026-09-04-cache-key-identity-redesign.md) drops type from cache
keys entirely, so that FQN — the one thing the table supplied that the Q-object itself doesn't already
expose via `.getPath()`/`.isCollectionType()` — is no longer needed by anything. We remove the table, its
generator, and `ProjectManager.createNavHopsFile` rather than keep emitting dead per-package output;
`getCacheKeyParams()`'s recursion switches from table lookup to reading the nested Q-object (via
`getEntity()`) directly.
