import { ExtractDataTypeFromV2ResponseStructure, MainResponseConverter } from "../response/MainResponseConverter";
import { QFunction } from "./QFunction";

/**
 * Base class for handling an V4 OData function.
 *
 * This includes handling of entity id paths (same format as V4 functions).
 */
export abstract class QFunctionV2<ParamModel, ResponseStructure> extends QFunction<ParamModel, ResponseStructure> {
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
