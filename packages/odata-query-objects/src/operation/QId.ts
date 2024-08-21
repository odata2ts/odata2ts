import { QParamModel } from "../param/QParamModel.js";
import { QFunction } from "./QFunction.js";

/**
 * Represents a function to produce the id path of an entity, e.g. MyEntity(number=123,name='Test').
 * There's no difference between V2 and V4 here.
 */
export abstract class QId<ParamModel> extends QFunction<ParamModel> {
  public constructor(name: string) {
    super(name, undefined, { v2Mode: false });
  }

  public abstract getParams(): Array<QParamModel<any, any>>;
}
