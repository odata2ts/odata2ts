import { NumericEnumLike, StringEnumLike } from "../../enum/EnumModel";
import { QEnumCollection } from "../../primitve-collection/PrimitveCollections";
import { QCollectionPath } from "../QCollectionPath";

export class QEnumCollectionPath<EnumType extends StringEnumLike | NumericEnumLike> extends QCollectionPath<
  QEnumCollection<EnumType>
> {
  public constructor(
    path: string,
    protected theEnum: EnumType,
  ) {
    // @ts-ignore
    super(path, () => {});
    if (!theEnum) {
      throw new Error("QEnumCollectionPath: Enum must be supplied!");
    }
  }

  public getEntity(withPrefix: boolean = false): QEnumCollection<EnumType> {
    return new QEnumCollection<EnumType>(this.theEnum, withPrefix ? this.path : undefined);
  }
}
