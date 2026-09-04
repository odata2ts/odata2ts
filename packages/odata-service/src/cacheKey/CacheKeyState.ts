import type { NavHopsTable } from "@odata2ts/odata-query-builder";

/** Whether a resource is a collection or a single entity / complex value. */
export type CacheKeyKind = "list" | "detail";

/**
 * What a generated service knows about the resource it addresses, in the form a cache key is built from.
 *
 * Threaded downwards through construction and never derived from a URL: the FQ type of a hop, the typed
 * key value and the derived relation all exist one call frame up, and a built URL has rendered them beyond
 * recovery. Nothing here is ever computed from `name` or `path` - `name` for a `byId`-created service is
 * the rendered key predicate, which must not appear in a key.
 */
export interface CacheKeyState {
  /** FQ type name the key is rooted at, or `"$operation"`. */
  readonly typeName: string;
  /** Hops and kind markers accumulated so far. */
  readonly steps: ReadonlyArray<unknown>;
  /**
   * Where in {@link steps} the current resource's kind marker sits, so `byId` can flip it to
   * `"detail"` without having to guess. A root and a re-rooting put it at 0; a hierarchical hop appends
   * `[type, kind, name]` and so puts it two from the end. Guessing from the array's shape silently
   * overwrote the hop's name and collided two sibling navigations onto one key.
   */
  readonly kindIndex: number;
  /** Restrictions contributed by the resource itself: cast, singleton, operation, derived filter. */
  readonly params?: Readonly<Record<string, unknown>>;
  /** FQ type of the addressed resource, where it belongs to an entity set. Feeds `invalidates`. */
  readonly resourceType?: string;
  /** Key of every hop from the root down to the parent, params already dropped. Feeds `invalidates`. */
  readonly ancestors?: ReadonlyArray<ReadonlyArray<unknown>>;
  /**
   * The addressed resource's key as an OData-name → value map, where it is addressed by one.
   *
   * Not merely a convenience over `steps`: a derived relation asserts that *this* key property equals
   * *that* value, and `steps` holds the key as one opaque element. Reset by a hop, since the resource the
   * route arrives at has no key until `byId` says so.
   */
  readonly keyValues?: Readonly<Record<string, unknown>>;
  /**
   * Every navigation property of every type the generator knows, computed once at generation time. Always
   * present whenever a `CacheKeyState` exists at all - unlike `resourceType`/`ancestors`/`keyValues`, which
   * are legitimately absent in some real states, every state originates from `rootState(...)`, which always
   * sets this under the same `cacheKeys.mode !== "off"` gate that produces the table in the first place.
   */
  readonly navHops: NavHopsTable;
}

/**
 * What the generator emits for one traversal step.
 *
 * `typeName` is the property's declared type and is absent for a primitive property or a stream, which
 * keep their bare name - `Edm.String` in a key helps nobody. `entitySetType` is the type of the entity set
 * the resource belongs to, absent for a contained entity or a complex value, which have none.
 */
export interface HopDescriptor {
  readonly typeName?: string;
  readonly kind?: CacheKeyKind;
  readonly name: string;
  readonly entitySetType?: string;
  /**
   * Present only under `mode: "typeFlattening"`, and only where the relation is derivable: the hop then
   * re-roots the key at the target entity set's type instead of extending it.
   */
  readonly reRoot?: {
    readonly typeName: string;
    readonly filter?: Readonly<Record<string, unknown>>;
    readonly cast?: string;
  };
}

/** The root marker of an operation which returns no entities - `$` cannot occur in an OData identifier. */
export const OPERATION_ROOT = "$operation";

/** The state of an entity set, a singleton or an operation result - the start of a route. */
export function rootState(
  typeName: string,
  kind: CacheKeyKind,
  options?: { params?: Readonly<Record<string, unknown>>; entitySetType?: string; navHops?: NavHopsTable },
): CacheKeyState {
  return {
    typeName,
    steps: [kind],
    kindIndex: 0,
    navHops: options?.navHops ?? {},
    ...(options?.params ? { params: options.params } : {}),
    // an operation with no entity set behind it has no type to head with and no resource type either
    ...(typeName === OPERATION_ROOT ? {} : { resourceType: options?.entitySetType ?? typeName }),
  };
}

/**
 * Narrows the current resource to the entity the given key addresses.
 *
 * Rewrites the trailing kind marker rather than appending one, and pushes no ancestor: `byId` refines the
 * resource the route is at, it does not leave it. A derived filter from an earlier re-rooting is dropped -
 * the key supersedes it.
 */
export function withKey(
  state: CacheKeyState,
  key: unknown,
  keyValues: Readonly<Record<string, unknown>>,
): CacheKeyState {
  const steps = [...state.steps];
  steps[state.kindIndex] = "detail";
  steps.push(key);

  const params = state.params && omit(state.params, "filter");

  return {
    ...state,
    steps,
    keyValues,
    ...(params && Object.keys(params).length ? { params } : { params: undefined }),
  };
}

/** Adds a restriction the resource itself carries - a cast, a singleton marker, an operation. */
export function withParams(state: CacheKeyState, params: Readonly<Record<string, unknown>>): CacheKeyState {
  return { ...state, params: { ...state.params, ...params } };
}

/**
 * Follows one traversal step.
 *
 * The route leaves the current resource here, so its key - params dropped - is pushed onto `ancestors`.
 * Under `typeFlattening` a derivable, non-contained navigation re-roots instead of appending, which resets
 * type, steps and params but deliberately keeps `ancestors`: that is what lets a re-rooted key still name
 * the medium a copy was reached through.
 */
export function hopState(state: CacheKeyState, hop: HopDescriptor): CacheKeyState {
  const ancestors = [...(state.ancestors ?? []), [state.typeName, ...state.steps]];

  if (hop.reRoot) {
    const params = {
      ...(hop.reRoot.filter ? { filter: hop.reRoot.filter } : {}),
      ...(hop.reRoot.cast ? { cast: hop.reRoot.cast } : {}),
    };
    return {
      typeName: hop.reRoot.typeName,
      steps: [hop.kind ?? "list"],
      kindIndex: 0,
      navHops: state.navHops,
      ...(Object.keys(params).length ? { params } : {}),
      ancestors,
      ...(hop.entitySetType ? { resourceType: hop.entitySetType } : {}),
    };
  }

  const steps = hop.typeName
    ? [...state.steps, hop.typeName, hop.kind ?? "detail", hop.name]
    : [...state.steps, hop.name];

  // a structured hop becomes a resource with its own kind marker, two from the end; a primitive hop
  // (bare name, e.g. a stream or a property) appends only a name and stays on its parent's resource
  const kindIndex = hop.typeName ? steps.length - 2 : state.kindIndex;

  return {
    typeName: state.typeName,
    steps,
    kindIndex,
    navHops: state.navHops,
    ancestors,
    ...(hop.entitySetType ? { resourceType: hop.entitySetType } : {}),
  };
}

/**
 * Re-roots at a target entity whose key is fully known - the grade-A to-one case
 * (`/Copies(MediumId=5,InventoryNumber=7)/Medium`).
 *
 * Distinct from a `reRoot` hop, which lands on a filtered collection: here the constraint names every key
 * property of the target, so the result is a true canonical entity key and converges with a direct
 * `/Media(5)`. Like every re-rooting it keeps `ancestors` and pushes the resource it leaves onto them.
 *
 * `keyValues` is the target's key by its own OData property names, already OData-side.
 */
export function reRootToEntity(
  state: CacheKeyState,
  targetType: string,
  keyValues: Readonly<Record<string, unknown>>,
): CacheKeyState {
  const names = Object.keys(keyValues);
  const key = names.length === 1 ? keyValues[names[0]] : keyValues;

  return {
    typeName: targetType,
    steps: ["detail", key],
    kindIndex: 0,
    navHops: state.navHops,
    keyValues,
    resourceType: targetType,
    ancestors: [...(state.ancestors ?? []), [state.typeName, ...state.steps]],
  };
}

/**
 * The addressed resource's own declared FQ type - what to look up in `navHops`. Neither `typeName` (stays
 * the route's root through a hierarchical hop) nor `resourceType` (absent for a contained entity) reliably
 * names it in every case; the one place it always lives is the most recent structured hop's own type
 * element in `steps`, found via `kindIndex - 1` - or `typeName` itself at the root or after a re-root,
 * where `kindIndex` is 0. A subtype cast wins over either, since it narrows what is actually addressed.
 */
export function ownFqNameOf(state: CacheKeyState): string {
  if (typeof state.params?.cast === "string") {
    return state.params.cast;
  }
  return state.kindIndex > 0 ? (state.steps[state.kindIndex - 1] as string) : state.typeName;
}

function omit(source: Readonly<Record<string, unknown>>, key: string): Record<string, unknown> {
  const { [key]: _dropped, ...rest } = source;
  return rest;
}
