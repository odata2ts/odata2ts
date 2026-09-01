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
}
