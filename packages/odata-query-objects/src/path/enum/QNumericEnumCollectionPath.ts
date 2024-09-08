import { NumericEnumLike } from "../../enum/EnumModel";
import { QNumericEnumCollection } from "../../primitve-collection/PrimitveCollections";
import { QCollectionPath } from "../QCollectionPath";

export class QNumericEnumCollectionPath<EnumType extends NumericEnumLike> extends QCollectionPath<
  QNumericEnumCollection<EnumType>
> {
  public constructor(
    path: string,
    protected theEnum: EnumType,
  ) {
    // @ts-ignore
    super(path, () => {});
    if (!theEnum) {
      throw new Error("Enum must be supplied!");
    }
  }

  public getEntity(withPrefix: boolean = false): QNumericEnumCollection<EnumType> {
    return new QNumericEnumCollection<EnumType>(this.theEnum, withPrefix ? this.path : undefined);
  }
}
