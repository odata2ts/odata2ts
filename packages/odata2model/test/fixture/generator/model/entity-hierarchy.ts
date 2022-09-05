export interface GrandParent {
  id: boolean;
}

export type GrandParentId = boolean | { id: boolean };

export interface EditableGrandParent extends Pick<GrandParent, "id"> {}

export interface Parent extends GrandParent {
  parentalAdvice: boolean | null;
}

export type ParentId = boolean | { id: boolean };

export interface EditableParent extends Pick<Parent, "id">, Partial<Pick<Parent, "parentalAdvice">> {}

export interface Child extends Parent {
  Ch1ld1shF4n: boolean | null;
}

export type ChildId = boolean | { id: boolean };

export interface EditableChild extends Pick<Child, "id">, Partial<Pick<Child, "Ch1ld1shF4n" | "parentalAdvice">> {}
