import type { QEntityFn } from "./CacheKeyState";

/** The discriminators of a Q-object path wrapper that leads to another entity, as opposed to a complex value or a primitive property/collection - see `QEntityPath`/`QEntityCollectionPath`. */
const ENTITY_DISCRIMINATORS = new Set(["EntityType", "EntitySet"]);

/**
 * The entity sets a write's own payload deep-inserts into, one entry per deep-inserted entity found - never
 * touching the write's own cache key, only ever feeding `invalidates` (see `buildInvalidates`'s reading of
 * `state.params.deepEdit`).
 *
 * Walks the payload and a fresh, unprefixed Q-object instance in parallel, rather than a generated
 * type-keyed table: a Q-object's own nav-property wrappers already carry everything needed - whether they
 * lead to another entity via their `discriminator`, and the target entity set's own name via
 * `getBinding()?.getEntitySetName()` - absent exactly where the target is contained, which is also exactly
 * where nothing should be registered. The payload itself is indexed by the property's own **declared field
 * name** (the enumeration key), not `getPath()`: a write's payload is always the TS-facing editable model,
 * whose property names a naming strategy may have mapped away from the OData wire name entirely - `getPath()`
 * would look up the wrong key wherever the two differ.
 *
 * A binding (`{"@id": key}` and nothing else) links an *existing* entity - nothing new is created, so there
 * is no new resource to name here; only an actual nested entity payload counts. Recurses into whatever a
 * deep insert itself deep-inserts, via each nav property's own `getEntityFn()`, the same way at every depth.
 */
export function buildDeepEditHops(qEntityFn: QEntityFn | undefined, data: unknown): ReadonlyArray<string> | undefined {
  const entitySetNames: Array<string> = [];
  walk(qEntityFn, data, entitySetNames, new Set());
  return entitySetNames.length ? entitySetNames : undefined;
}

function walk(qEntityFn: QEntityFn | undefined, data: unknown, out: Array<string>, seen: Set<unknown>): void {
  if (!qEntityFn || !data || typeof data !== "object" || seen.has(data)) {
    return;
  }
  seen.add(data);

  const qEntity = new (qEntityFn())() as unknown as Record<string, unknown>;
  for (const key in qEntity) {
    const prop = qEntity[key] as
      | { discriminator?: string; getEntityFn(): QEntityFn; getBinding?(): { getEntitySetName(): string } | undefined }
      | undefined;
    if (!prop || typeof prop.discriminator !== "string" || !ENTITY_DISCRIMINATORS.has(prop.discriminator)) {
      continue;
    }

    const value = (data as Record<string, unknown>)[key];
    if (value === undefined || value === null) {
      continue;
    }

    const entitySetName = prop.getBinding?.()?.getEntitySetName();
    const nestedQEntityFn = prop.getEntityFn();
    const items = Array.isArray(value) ? value : [value];
    for (const item of items) {
      if (isBinding(item)) {
        continue;
      }
      if (entitySetName) {
        out.push(entitySetName);
      }
      walk(nestedQEntityFn, item, out, seen);
    }
  }
}

/** `{"@id": key}` and nothing else - the editable model's shape for "link an existing entity". */
function isBinding(item: unknown): boolean {
  return typeof item === "object" && item !== null && Object.keys(item).length === 1 && "@id" in item;
}
