import { ExtractDataTypeFromV2ResponseStructure, MainResponseConverter } from "../response/MainResponseConverter";
import { QFunction } from "./QFunction";

/**
 * Base class for handling an V4 OData function.
 *
 * This includes handling of entity id paths (same format as V4 functions).
 */
/*
 * `ResponseStructure` defaults to `undefined` because a V2 function import may return nothing at all -
 * V2 has no separate notion of an action, so a void operation is a `FunctionImport` with
 * `m:HttpMethod="POST"`. The generator then emits `QFunctionV2<Params>` with no second argument.
 */
export abstract class QFunctionV2<ParamModel, ResponseStructure = undefined> extends QFunction<
  ParamModel,
  ResponseStructure
> {
  public constructor(
    name: string,
    protected responseConverter?: MainResponseConverter<
      ResponseStructure,
      ExtractDataTypeFromV2ResponseStructure<ResponseStructure>
    >,
  ) {
    super(name);
  }

  public isV2(): boolean {
    return true;
  }

  public getResponseConverter() {
    return this.responseConverter;
  }
}
