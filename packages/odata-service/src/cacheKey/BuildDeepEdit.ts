import type { QEntityFn } from "./CacheKeyState";
import { walkEntityGraph } from "./EntityGraphWalk";

/**
 * The entity sets a write's own payload deep-inserts into, one entry per deep-inserted entity found - never
 * touching the write's own cache key, only ever feeding `invalidates` (see `buildInvalidates`'s reading of
 * `state.params.deepEdit`).
 *
 * A binding (`{"@id": key}` and nothing else) links an *existing* entity - nothing new is created, so there
 * is no new resource to name here; only an actual nested entity payload counts. See `walkEntityGraph` for
 * how the payload is walked and indexed.
 */
export function buildDeepEditHops(qEntityFn: QEntityFn | undefined, data: unknown): ReadonlyArray<string> | undefined {
  const entitySetNames: Array<string> = [];
  walkEntityGraph(
    qEntityFn,
    data,
    (visit) => {
      if (visit.entitySetName) {
        entitySetNames.push(visit.entitySetName);
      }
    },
    { skipBindings: true },
  );
  return entitySetNames.length ? entitySetNames : undefined;
}
