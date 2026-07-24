import { Operation } from "../../../../src/data-model/edmx/ODataEdmxModelV4.js";
import { createProperty } from "../ODataBuilderHelper.js";

export class ODataOperationBuilderV4 {
  private operation: Operation;

  constructor(name: string, returnType?: string, isBound?: boolean, isComposable?: boolean) {
    this.operation = {
      $: {
        Name: name,
      },
    };
    if (returnType) {
      this.operation.ReturnType = [
        {
          $: {
            Type: returnType,
          },
        },
      ];
    }
    if (typeof isBound === "boolean") {
      this.operation.$.IsBound = isBound ? "true" : "false";
    }
    if (typeof isComposable === "boolean") {
      this.operation.$.IsComposable = isComposable ? "true" : "false";
    }
  }

  public getOperation() {
    return this.operation;
  }

  public addParam(name: string, type: string, nullable?: boolean, maxLength?: number, precision?: number) {
    if (!this.operation.Parameter) {
      this.operation.Parameter = [];
    }

    const prop = createProperty(name, type, nullable, maxLength, precision);
    this.operation.Parameter.push(prop);
    return this;
  }
}
