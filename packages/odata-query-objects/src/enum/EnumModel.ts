export type NumericEnumLike = {
  [id: string]: unknown | string;
  [nu: number]: string;
};

export type NumericEnumMember<EnumType> = EnumType[keyof EnumType];

export type StringEnumLike = {
  [id: string]: unknown | string;
};

export type StringEnumMember<EnumType> = EnumType[keyof EnumType] | keyof EnumType;
