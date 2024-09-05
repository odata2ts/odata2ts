import { NumericEnumLike, StringEnumLike } from "../../enum/EnumModel";
import { QEnumCollection, QNumericEnumCollection } from "../../primitve-collection/PrimitveCollections";
import { QCollectionPath } from "../QCollectionPath";

type CalculatedCollection<EnumType> = EnumType extends StringEnumLike
  ? QEnumCollection<EnumType>
  : EnumType extends NumericEnumLike
    ? QNumericEnumCollection<EnumType>
    : never;

export class QEnumCollectionPath<EnumType extends StringEnumLike | NumericEnumLike> extends QCollectionPath<
  CalculatedCollection<EnumType>
> {
  public constructor(
    path: string,
    protected theEnum: EnumType,
    protected qEnumFn: () => new (theEnum: EnumType, prefix?: string) => CalculatedCollection<EnumType>,
  ) {
    // @ts-ignore: not the correct function
    super(path, () => {});
  }

  public getEntity(withPrefix: boolean = false): CalculatedCollection<EnumType> {
    return new (this.qEnumFn())(this.theEnum, withPrefix ? this.path : undefined);
  }
}
