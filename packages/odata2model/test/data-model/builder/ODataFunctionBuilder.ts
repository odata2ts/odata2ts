import { ODataBaseTypeBuilder } from "./ODataBaseTypeBuilder";
import { Action } from "../../../src/odata/ODataEdmxModel";

export class ODataFunctionBuilder extends ODataBaseTypeBuilder {
  private functionType: Action;

  constructor(name: string, returnType?: string, isBound?: boolean) {
    super();
    this.functionType = {
      $: {
        Name: name,
      },
    };
    if (returnType) {
      this.functionType.ReturnType = [
        {
          $: {
            Type: returnType,
          },
        },
      ];
    }
    if (typeof isBound === "boolean") {
      this.functionType.$.IsBound = isBound ? "true" : "false";
    }
  }

  public getFunction() {
    return this.functionType;
  }

  public addParam(name: string, type: string, nullable?: boolean, maxLength?: number, precision?: number) {
    if (!this.functionType.Parameter) {
      this.functionType.Parameter = [];
    }

    const prop = this.createProperty(name, type, nullable, maxLength, precision);
    this.functionType.Parameter.push(prop);
    return this;
  }
}
