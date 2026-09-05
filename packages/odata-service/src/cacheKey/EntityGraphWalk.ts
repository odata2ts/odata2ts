import type { QEntityFn } from "./CacheKeyState";

/** The discriminators of a Q-object path wrapper that leads to another entity, as opposed to a complex value or a primitive property/collection - see `QEntityPath`/`QEntityCollectionPath`. */
const ENTITY_DISCRIMINATORS = new Set(["EntityType", "EntitySet"]);

interface EntityBinding {
  getEntitySetName(): string;
  buildCanonicalId(entity: unknown): string | undefined;
}

/** One entity-shaped value found while walking a data object alongside its Q-object. */
export interface EntityGraphVisit {
  /** The entity set this entity belongs to - absent for a contained one, which has none of its own. */
  entitySetName: string | undefined;
  /** This entity's own canonical id, from its own data - absent exactly where `entitySetName` is. */
  buildCanonicalId: ((entity: unknown) => string | undefined) | undefined;
  /** This entity's own data, as found in the payload/response - keyed by its Q-object's own declared field names. */
  data: Record<string, unknown>;
  /** A factory for this entity's own Q-object, for recursing further. */
  qEntityFn: QEntityFn;
}

/**
 * Walks a data object (a write payload or a converted read response) alongside a fresh, unprefixed Q-object
 * instance, visiting every entity-shaped nav property's own value(s) - the shared primitive both
 * `buildDeepEditHops` (a write's own deep-inserted entities) and the response-observed identity recorder
 * (every entity actually present in a read/write response) build on, rather than a generated,
 * type-keyed lookup table: a Q-object's own nav-property wrappers already carry everything needed - whether
 * they lead to another entity via their `discriminator`, the target entity set's own name and canonical-id
 * builder via `getBinding()` (absent exactly where the target is contained, which is also exactly where
 * neither exists), and the target's own Q-object factory via `getEntityFn()`, for recursing further.
 *
 * The data object is indexed by each property's own **declared field name** (the enumeration key), not
 * `getPath()`: a write's payload and a converted read response are both TS-facing, whose property names a
 * naming strategy may have mapped away from the OData wire name entirely - `getPath()` would look up the
 * wrong key wherever the two differ.
 *
 * `skipBindings`: a binding (`{"@id": key}`) links an *existing* entity rather than embedding one -
 * relevant only for a write payload (a response never takes this shape), so a response walk must not
 * filter it out - an entity could coincidentally carry an "@id" field of its own.
 */
export function walkEntityGraph(
  qEntityFn: QEntityFn | undefined,
  data: unknown,
  visit: (visit: EntityGraphVisit) => void,
  options: { skipBindings: boolean },
  seen: Set<unknown> = new Set(),
): void {
  if (!qEntityFn || !data || typeof data !== "object" || seen.has(data)) {
    return;
  }
  seen.add(data);

  const qEntity = new (qEntityFn())() as unknown as Record<string, unknown>;
  for (const key in qEntity) {
    const prop = qEntity[key] as
      { discriminator?: string; getEntityFn(): QEntityFn; getBinding?(): EntityBinding | undefined } | undefined;
    if (!prop || typeof prop.discriminator !== "string" || !ENTITY_DISCRIMINATORS.has(prop.discriminator)) {
      continue;
    }

    const value = (data as Record<string, unknown>)[key];
    if (value === undefined || value === null) {
      continue;
    }

    const binding = prop.getBinding?.();
    const nestedQEntityFn = prop.getEntityFn();
    const items = Array.isArray(value) ? value : [value];
    for (const item of items) {
      if (options.skipBindings && isBinding(item)) {
        continue;
      }
      if (item && typeof item === "object") {
        visit({
          entitySetName: binding?.getEntitySetName(),
          buildCanonicalId: binding && ((entity: unknown) => binding.buildCanonicalId(entity)),
          data: item as Record<string, unknown>,
          qEntityFn: nestedQEntityFn,
        });
      }
      walkEntityGraph(nestedQEntityFn, item, visit, options, seen);
    }
  }
}

/** `{"@id": key}` and nothing else - the editable model's shape for "link an existing entity". */
function isBinding(item: unknown): boolean {
  return typeof item === "object" && item !== null && Object.keys(item).length === 1 && "@id" in item;
}
