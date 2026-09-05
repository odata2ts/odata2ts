import type { QueryObjectModel } from "@odata2ts/odata-query-objects";

/** Whether a resource is a collection or a single entity / complex value. */
export type CacheKeyKind = "list" | "detail";

/** A factory for a fresh, unprefixed Q-object instance of one entity/complex type - the same shape a Q-object's own nav-property wrappers already use (`QModelBasePath`'s `qEntityFn`), reused here so a write's payload can be walked without any generated lookup table. */
export type QEntityFn = () => new (prefix?: string, separator?: string) => QueryObjectModel;

/**
 * Builds the addressed resource's own canonical id - entity-set name plus key predicate, e.g. `Copies(3)`.
 * The same encoding `ConcurrencyHandler`'s ETag keys already use, from a fresh `QId` instance parametrized
 * with the entity set's own name - never the route taken to reach it, which is exactly what makes it
 * comparable across routes at all.
 *
 * See `QId.buildCanonicalId` for the shapes `entity` may take: a bare value, an already key-only object, or
 * a full entity representation with unrelated fields alongside the key - the last is what a response row
 * (this resource's own, or one reached through `$expand`) actually is. `undefined` where the key cannot be
 * built from what was given - a required property missing from `entity`, most commonly.
 */
export type CanonicalIdFn = (entity: unknown) => string | undefined;

/**
 * What a generated service knows about the resource it addresses, in the form a cache key is built from.
 *
 * Threaded downwards through construction and never derived from a URL: the typed key value exists one call
 * frame up, and a built URL has rendered it beyond recovery. Nothing here is ever computed from `name` or
 * `path` - `name` for a `byId`-created service is the rendered key predicate, which must not appear in a key.
 */
export interface CacheKeyState {
  /** The route's own root name - an entity set's, a singleton's, or `"$operation"`. Never a type. */
  readonly name: string;
  /** Hops and kind markers accumulated so far. */
  readonly steps: ReadonlyArray<unknown>;
  /**
   * Where in {@link steps} the current resource's kind marker sits, so `byId` can flip it to
   * `"detail"` without having to guess. A root puts it at 0; a hierarchical hop appends `[name, kind]` and
   * so puts it at the last position. Guessing from the array's shape silently overwrote the hop's name and
   * collided two sibling navigations onto one key.
   */
  readonly kindIndex: number;
  /** Restrictions contributed by the resource itself: cast, singleton, operation. */
  readonly params?: Readonly<Record<string, unknown>>;
  /**
   * The entity set the addressed resource belongs to, by its own name - never a type. Feeds `invalidates`.
   * Absent for a resource with no entity set of its own: a contained entity, a complex value, a singleton
   * (which has no "list" form to invalidate), an operation with no declared result set.
   */
  readonly entitySetName?: string;
  /** See {@link CanonicalIdFn}. Present exactly where {@link entitySetName} is - a resource with no entity set of its own has no canonical id to build either. */
  readonly canonicalIdFn?: CanonicalIdFn;
  /** Key of every hop from the root down to the parent, params already dropped. Feeds `invalidates`. */
  readonly ancestors?: ReadonlyArray<ReadonlyArray<unknown>>;
  /**
   * The addressed resource's own key or id, exactly as given to `byId` - bare for a single primary key, an
   * object keyed by the model's own mapped property names otherwise. The same shape {@link CanonicalIdFn}
   * accepts, so a write's own canonical id can still be built even when its response carries no body to
   * read one from (a `DELETE`, or a `PATCH`/`PUT` answered with `204 No Content`).
   *
   * Not derivable from `steps`, which holds the key OData-name-keyed (the shape a hand-written `$filter`
   * would use) - a different convention than `QId.buildUrl` accepts an object in. Reset by a hop, since the
   * resource the route arrives at has no key until `byId` says so.
   */
  readonly key?: unknown;
  /**
   * A factory for the addressed resource's own Q-object, where it is an entity or complex type - absent for
   * `"$operation"`, the one root with no type behind it at all. The one piece of type information this state
   * still carries, deliberately never exposed in a cache key: it exists solely so a write's payload can be
   * walked for deep-inserted entities (`buildDeepEditHops`) without a generated, type-keyed lookup table.
   */
  readonly qEntityFn?: QEntityFn;
}

/**
 * What the generator emits for one traversal step.
 *
 * `kind`'s presence is what distinguishes a structured hop (an entity, complex value, or bound operation
 * result - something with its own kind and kind-index) from a primitive one (a bare property or stream,
 * which stays on its parent's resource and keeps its parent's kind index).
 */
export interface HopDescriptor {
  readonly name: string;
  readonly kind?: CacheKeyKind;
  /**
   * The entity set the hop's target belongs to, by its own name - absent for a contained entity or a
   * complex value, which have none.
   */
  readonly entitySetName?: string;
  /** See {@link CacheKeyState.canonicalIdFn}. Present exactly where {@link entitySetName} is. */
  readonly canonicalIdFn?: CanonicalIdFn;
  /** See {@link CacheKeyState.qEntityFn}. Absent where the hop's target has none of its own to offer (e.g. a primitive or stream property). */
  readonly qEntityFn?: QEntityFn;
}

/** The root marker of an operation which returns no entities - `$` cannot occur in an OData identifier. */
export const OPERATION_ROOT = "$operation";

/** The state of an entity set or a singleton - the start of a route. An operation with no declared result set is built as a plain object literal instead, see `ServiceGenerator.emitUnboundOperationRootExpr`. */
export function rootState(
  name: string,
  kind: CacheKeyKind,
  options?: {
    params?: Readonly<Record<string, unknown>>;
    entitySetName?: string;
    canonicalIdFn?: CanonicalIdFn;
    qEntityFn?: QEntityFn;
  },
): CacheKeyState {
  return {
    name,
    steps: [kind],
    kindIndex: 0,
    ...(options?.params ? { params: options.params } : {}),
    ...(options?.entitySetName ? { entitySetName: options.entitySetName } : {}),
    ...(options?.canonicalIdFn ? { canonicalIdFn: options.canonicalIdFn } : {}),
    ...(options?.qEntityFn ? { qEntityFn: options.qEntityFn } : {}),
  };
}

/**
 * Narrows the current resource to the entity the given key addresses.
 *
 * Rewrites the trailing kind marker rather than appending one, and pushes no ancestor: `byId` refines the
 * resource the route is at, it does not leave it.
 */
export function withKey(state: CacheKeyState, stepKey: unknown, id: unknown): CacheKeyState {
  const steps = [...state.steps];
  steps[state.kindIndex] = "detail";
  steps.push(stepKey);

  return { ...state, steps, key: id };
}

/** Adds a restriction the resource itself carries - a cast, a singleton marker, an operation. */
export function withParams(state: CacheKeyState, params: Readonly<Record<string, unknown>>): CacheKeyState {
  return { ...state, params: { ...state.params, ...params } };
}

/**
 * Follows one traversal step.
 *
 * The route leaves the current resource here, so its key - params dropped - is pushed onto `ancestors`. The
 * hop's own name and kind are appended to `steps` (a primitive hop's bare name only, staying on its
 * parent's resource); the route's root `name` never changes, since a `cacheKey` is always the literal route
 * taken, never re-rooted.
 */
export function hopState(state: CacheKeyState, hop: HopDescriptor): CacheKeyState {
  const ancestors = [...(state.ancestors ?? []), [state.name, ...state.steps]];
  const steps = hop.kind ? [...state.steps, hop.name, hop.kind] : [...state.steps, hop.name];
  const kindIndex = hop.kind ? steps.length - 1 : state.kindIndex;

  return {
    name: state.name,
    steps,
    kindIndex,
    ancestors,
    ...(hop.entitySetName ? { entitySetName: hop.entitySetName } : {}),
    ...(hop.canonicalIdFn ? { canonicalIdFn: hop.canonicalIdFn } : {}),
    ...((hop.qEntityFn ?? state.qEntityFn) ? { qEntityFn: hop.qEntityFn ?? state.qEntityFn } : {}),
  };
}
