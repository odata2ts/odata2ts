export interface GrandParent {
  id: boolean;
}

export type GrandParentId = boolean | { id: boolean };

export interface EditableGrandParent extends Partial<Pick<GrandParent, "id">> {}

export interface Parent extends GrandParent {
  parentalAdvice: boolean | null;
}

export interface EditableParent extends Partial<Pick<Parent, "id" | "parentalAdvice">> {}

export interface Child extends Parent {
  id2: boolean;
  ch1ld1shF4n: boolean | null;
}

export type ChildId = { id: boolean; id2: boolean };

export interface EditableChild extends Partial<Pick<Child, "id" | "parentalAdvice" | "id2" | "ch1ld1shF4n">> {}
