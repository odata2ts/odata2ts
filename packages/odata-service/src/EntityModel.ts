export interface InlineUrlProp {
  isLiteral: boolean;
  value: string | number | boolean;
}

export type InlineUrlProps = { [prop: string]: InlineUrlProp };

export interface KeyProp {
  isLiteral: boolean;
  name: string;
  odataName: string;
}

export type KeySpec = Array<KeyProp>;

export type EntityIdentifier<Model, Id extends keyof Model> = string | number | boolean | { [Key in Id]: Model[Key] };
