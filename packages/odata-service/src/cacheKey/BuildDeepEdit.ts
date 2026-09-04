import type { HopTriple, NavHopsTable } from "@odata2ts/odata-query-builder";

/**
 * The nested entities a write's own payload deep-inserts, as hops - never touching the write's own
 * cache key, only ever feeding `invalidates` (see `buildInvalidates`'s reading of `state.params.deepEdit`).
 *
 * A binding (`{"@id": key}` and nothing else) links an *existing* entity - nothing new is created, so
 * there is no new resource to name here; only an actual nested entity payload counts. Recurses into
 * whatever a deep insert itself deep-inserts, using the same flat table for every depth - a deep-inserted
 * `Loan`'s own nested `Copy` is found via `navHops["…Loan"]`, not a separate lookup mechanism.
 */
export function buildDeepEditHops(
  navHops: NavHopsTable,
  rootFqName: string,
  data: unknown,
): ReadonlyArray<HopTriple> | undefined {
  const hops: Array<HopTriple> = [];
  walk(navHops, rootFqName, data, hops, new Set());
  return hops.length ? hops : undefined;
}

function walk(navHops: NavHopsTable, fqName: string, data: unknown, out: Array<HopTriple>, seen: Set<unknown>): void {
  if (!data || typeof data !== "object" || seen.has(data)) {
    return;
  }
  seen.add(data);

  const ownHops = navHops[fqName];
  if (!ownHops) {
    return;
  }

  for (const [propName, hop] of Object.entries(ownHops)) {
    const value = (data as Record<string, unknown>)[propName];
    if (value === undefined || value === null) {
      continue;
    }
    const items = Array.isArray(value) ? value : [value];
    for (const item of items) {
      if (isBinding(item)) {
        continue;
      }
      out.push(hop);
      walk(navHops, hop[0], item, out, seen);
    }
  }
}

/** `{"@id": key}` and nothing else - the editable model's shape for "link an existing entity". */
function isBinding(item: unknown): boolean {
  return typeof item === "object" && item !== null && Object.keys(item).length === 1 && "@id" in item;
}
