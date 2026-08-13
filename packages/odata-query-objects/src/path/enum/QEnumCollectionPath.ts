import { ValueConverter } from "@odata2ts/converter-api";
import { NumericEnumLike, StringEnumSource, StringEnumSourceMember } from "../../enum/EnumModel";
import { QEnumCollection } from "../../primitve-collection/PrimitveCollections";
import { QCollectionPath } from "../QCollectionPath";

export class QEnumCollectionPath<
  EnumType extends StringEnumSource | NumericEnumLike,
  WireType = string,
> extends QCollectionPath<QEnumCollection<EnumType, WireType>> {
  public constructor(
    path: string,
    protected theEnum: EnumType,
    protected converter?: ValueConverter<WireType, StringEnumSourceMember<EnumType>>,
  ) {
    // @ts-ignore
    super(path, () => {});
    if (!theEnum) {
      throw new Error("QEnumCollectionPath: Enum or member list must be supplied!");
    }
  }

  public getEntity(withPrefix: boolean = false): QEnumCollection<EnumType, WireType> {
    return new QEnumCollection<EnumType, WireType>(this.theEnum, withPrefix ? this.path : undefined, this.converter);
  }
}
