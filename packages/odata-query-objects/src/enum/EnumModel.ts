export type NumericEnumLike = {
  [id: string]: unknown | string;
  [nu: number]: string;
};

export type NumericEnumMember<EnumType> = EnumType[keyof EnumType];

export type StringEnumLike = {
  [id: string]: unknown | string;
};

export type StringEnumMember<EnumType> = EnumType[keyof EnumType] | keyof EnumType;

/**
 * The members of a string enum as a plain list.
 *
 * This is what stands in for the enum object where there is none: with <code>enumType: "string-union"</code>
 * the generated type is a union of string literals, which exists only in the type system. The query objects
 * need something at runtime, so the generator emits the member list next to it.
 */
export type StringEnumMemberList = ReadonlyArray<string>;

/**
 * Either a real string enum or the member list standing in for one.
 */
export type StringEnumSource = StringEnumLike | StringEnumMemberList;

/**
 * The member type of either shape: the union of its entries for a member list, the usual name-or-value
 * union for an enum object.
 */
export type StringEnumSourceMember<Source> =
  Source extends ReadonlyArray<infer Member> ? Member : StringEnumMember<Source>;
