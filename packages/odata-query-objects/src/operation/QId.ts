import { QParamModel } from "../param/QParamModel";
import { QFunctionV4 } from "./QFunctionV4";

/**
 * Represents a function to produce the id path of an entity, e.g. MyEntity(number=123,name='Test').
 * There's no difference between V2 and V4 here.
 */
export abstract class QId<ParamModel> extends QFunctionV4<ParamModel, void> {
  public constructor(name: string) {
    super(name);
  }

  public abstract getParams(): Array<QParamModel<any, any>>;
}
