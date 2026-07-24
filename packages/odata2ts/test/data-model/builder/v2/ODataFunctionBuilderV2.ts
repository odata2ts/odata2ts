import { FunctionImport } from "../../../../src/data-model/edmx/ODataEdmxModelV3.js";
import { createProperty } from "../ODataBuilderHelper.js";

export class ODataFunctionBuilderV2 {
  private function: FunctionImport;

  constructor(name: string, returnType?: string, usePostMethod?: boolean) {
    this.function = {
      $: {
        Name: name,
      },
    };
    if (returnType) {
      this.function.ReturnType = [
        {
          $: {
            Type: returnType,
          },
        },
      ];
    }
    if (usePostMethod) {
      this.function.$["m:HttpMethod"] = "POST";
    }
  }

  public getFunction() {
    return this.function;
  }

  public addParam(name: string, type: string, nullable?: boolean, maxLength?: number, precision?: number) {
    if (!this.function.Parameter) {
      this.function.Parameter = [];
    }

    const prop = createProperty(name, type, nullable, maxLength, precision);
    this.function.Parameter.push(prop);
    return this;
  }
}
