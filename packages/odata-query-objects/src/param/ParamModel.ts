export interface ValueConverter<Type, ConvertedType> {
  convertFrom(value: Type): ConvertedType;
  convertTo(value: ConvertedType): Type;
}
