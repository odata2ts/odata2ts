import { ParamValueModel } from "@odata2ts/converter-api";
import { QueryObject } from "../QueryObject";
import { FlexibleConversionModel, QParamModel } from "./QParamModel";

export class QComplexParam<Type, Q extends QueryObject> implements QParamModel<any, Type> {
  constructor(
    protected name: string,
    protected qObject: Q,
    protected mappedName?: string,
  ) {
    if (!name?.trim()) {
      throw new Error("QComplexParam: Name is required!");
    }
    if (!qObject) {
      throw new Error("QComplexParam: QueryObject is required!");
    }
  }

  public getName() {
    return this.name;
  }

  public getMappedName() {
    return this.mappedName ?? this.getName();
  }

  public convertFrom(value: FlexibleConversionModel<any>): FlexibleConversionModel<Type> {
    const result = this.qObject.convertFromOData(value);
    return Array.isArray(result) ? (result as Array<ParamValueModel<Type>>) : (result as ParamValueModel<Type>);
  }

  public convertTo(value: FlexibleConversionModel<Type>): FlexibleConversionModel<any> {
    return this.qObject.convertToOData(value);
  }

  public formatUrlValue(value: ParamValueModel<Type> | Array<ParamValueModel<Type>>): string | undefined {
    const result = Array.isArray(value) ? this.convertTo(value) : this.convertTo(value);
    return JSON.stringify(result);
  }

  public parseUrlValue(value: string | undefined): ParamValueModel<Type> | Array<ParamValueModel<Type>> {
    return this.convertFrom(value ? JSON.parse(value) : value);
  }
}
