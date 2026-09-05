import { QParamModel } from "../param/QParamModel";
import { SINGLE_VALUE_TYPES } from "./QFunction";
import { QFunctionV4 } from "./QFunctionV4";

/**
 * Represents a function to produce the id path of an entity, e.g. MyEntity(number=123,name='Test').
 * There's no difference between V2 and V4 here.
 *
 * {@link getParams} may return either a single, flat param set - the common case, one way to identify
 * the entity - or several: an entity which also declares one or more `Core.AlternateKeys` gets one
 * param set per alternate key, in addition to the primary one. {@link buildUrl}/{@link parseUrl}
 * (inherited from {@link QFunction}) already resolve which of several param sets applies, the same way
 * they do for overloaded function/action parameters.
 */
export abstract class QId<ParamModel> extends QFunctionV4<ParamModel, void> {
  public constructor(name: string) {
    super(name);
  }

  public abstract getParams(): Array<QParamModel<any, any>> | Array<Array<QParamModel<any, any>>>;

  /**
   * The primary key's param set, regardless of how many alternate keys this id also declares.
   *
   * Codegen guarantees the primary key's param set is always first - callers needing "the" identifying
   * set of params for this entity, rather than one it may alternatively be identified by, want this
   * over {@link getParams}.
   */
  public getPrimaryParams(): Array<QParamModel<any, any>> {
    return this.getParamSets()[0] ?? [];
  }

  /**
   * The param set of every alternate key this id also declares (`Core.AlternateKeys`), in the order
   * {@link buildUrl}/{@link parseUrl} try them in after the primary key - empty where there are none.
   */
  public getAlternateParams(): Array<Array<QParamModel<any, any>>> {
    return this.getParamSets().slice(1);
  }

  /**
   * The param set this id's value would resolve to in {@link buildUrl}/{@link parseUrl} - the same
   * matching, reused rather than duplicated, so a cache key is always built from the very param set the
   * URL was built from.
   */
  public getParamsFor(id: unknown): Array<QParamModel<any, any>> {
    // the same resolution buildUrl performs, so a cache key is built from the very param set the URL was
    if (SINGLE_VALUE_TYPES.includes(typeof id)) {
      const single = this.findSingleParam();
      return single ? [single] : [];
    }
    return this.findBestMatchingParamSet(Object.keys(id as object), true);
  }

  /**
   * This entity's own canonical id - entity-set name plus key predicate - always via the *primary* key,
   * regardless of which key shape `entity` was actually fetched or addressed by: two routes to the same
   * entity must produce the very same canonical id, or nothing that compares them by it would ever match.
   *
   * Accepts three shapes, so callers never have to know which one they hold:
   * - a bare value (`5`) - passed straight to {@link buildUrl}, the single-primary-key case
   * - an already key-only object, mapped-name keyed (`{id: 5}`, `{mediumId: 5, inventoryNumber: 7}`) - a
   *   single-property one still collapses to the bare form, so `{id: 5}` and `5` produce identical ids
   * - a full entity representation with unrelated fields alongside the key (`{id: 5, title: "...", ...}`)
   *   - only the primary key's own mapped-name fields are read out of it, everything else is ignored
   *
   * `undefined` where the primary key cannot be built at all: no primary key declared, or - the entity
   * case - one of its properties is missing from `entity`.
   */
  public buildCanonicalId(entity: unknown): string | undefined {
    if (entity === null || typeof entity !== "object") {
      return this.getPrimaryParams().length ? this.buildUrl(entity as ParamModel) : undefined;
    }

    const params = this.getPrimaryParams();
    const row = entity as Record<string, unknown>;
    if (!params.length || params.some((p) => row[p.getMappedName()] === undefined)) {
      return undefined;
    }

    const id =
      params.length === 1
        ? row[params[0].getMappedName()]
        : Object.fromEntries(params.map((p) => [p.getMappedName(), row[p.getMappedName()]]));
    return this.buildUrl(id as ParamModel);
  }
}
