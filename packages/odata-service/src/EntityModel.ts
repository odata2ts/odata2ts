export interface InlineUrlProp {
  isLiteral: boolean;
  value: string | number;
}

export type InlineUrlProps = { [prop: string]: InlineUrlProp };

export type EntityIdentifier<Model, Id extends keyof Model> = string | { [Key in Id]: Model[Key] };
