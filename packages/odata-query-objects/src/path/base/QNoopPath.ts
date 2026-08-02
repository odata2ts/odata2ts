import { ValueConverter } from "@odata2ts/converter-api";
import { getIdentityConverter } from "../../IdentityConverter";
import { QPathModel } from "../QPathModel";

/**
 * Base for paths of types no filter or order operation applies to, currently `Edm.Binary`.
 *
 * It still carries a converter, even though it offers no operation that would use one: a property
 * service is generated for any primitive property, and that service converts values on its way in and
 * out. Without it, generating a client with `enablePrimitivePropertyServices` for a model containing an
 * `Edm.Binary` property produced code that did not compile.
 */
export abstract class QNoopPath implements QPathModel {
  public constructor(
    private path: string,
    public readonly converter: ValueConverter<any, any> = getIdentityConverter(),
  ) {
    if (!path || !path.trim()) {
      throw new Error("Path must be supplied!");
    }
  }

  public getPath(): string {
    return this.path;
  }
}
