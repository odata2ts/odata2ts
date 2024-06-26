export interface Book {}

export interface EditableBook {}

export interface ExtendsFromEntity extends Book {
  id: boolean;
}

export type ExtendsFromEntityId = boolean | { id: boolean };

export interface EditableExtendsFromEntity {}

export interface Complex {}

export interface EditableComplex {}

export interface ExtendsFromComplex extends Complex {
  test: boolean | null;
}

export interface EditableExtendsFromComplex extends Partial<Pick<ExtendsFromComplex, "test">> {}
