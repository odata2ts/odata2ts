export type EntityIdentifier<Model, Id extends keyof Model> = string | { [Key in Id]: Model[Key] };
