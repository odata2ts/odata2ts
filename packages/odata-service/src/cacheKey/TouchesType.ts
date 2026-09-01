/**
 * Whether the given cache key touches the given FQ type.
 *
 * A hierarchical key is rooted at the type of the entity set the route started at, so a prefix match on
 * the target's type cannot reach it - one array has one prefix. This is what makes such a key reachable by
 * type at all, and because every structured hop carries its FQN it is a plain scan needing nothing
 * generated alongside it.
 *
 * A property name cannot produce a false positive: an OData identifier cannot contain a dot, an FQN always
 * does. **A search term without a dot cannot be a type name.** Without this guard, a bare hop name like
 * `"Reservations"` would match the hop's own name in the key, even though it is not a type. The guard can
 * never change the answer for a real fully qualified name, since no FQN lacks a dot.
 * A bound operation's FQ name can match, which is a harmless imprecision - nothing asks about operation
 * names, and no type name can collide with one that is actually in a key.
 *
 * **Matching is exact; there is no inheritance.** A key carrying `Library.Catalog.Book` does not match
 * `Library.Catalog.Medium`. Making supertypes match would mean generating and shipping a type-hierarchy
 * table; an application that cares calls this once per subtype it knows.
 *
 * Library-neutral by design - it takes a key, not a cache-library query object:
 * `invalidateQueries({predicate: (q) => touchesType("…", q.queryKey)})`.
 */
export function touchesType(type: string, key: ReadonlyArray<unknown>): boolean {
  // Only type names (FQNs) contain dots; property names don't. A search term without a dot can't be a type.
  if (!type.includes(".")) {
    return false;
  }

  for (const element of key) {
    if (element === type) {
      return true;
    }
    if (typeof element === "object" && element !== null && !Array.isArray(element)) {
      if ((element as Record<string, unknown>).cast === type) {
        return true;
      }
    }
  }
  return false;
}
