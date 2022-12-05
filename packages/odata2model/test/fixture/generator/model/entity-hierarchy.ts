export interface GrandParent {
  id: boolean;
}

export type GrandParentId = boolean | { id: boolean };

export interface EditableGrandParent extends Pick<GrandParent, "id"> {}

export interface Parent extends GrandParent {
  parentalAdvice: boolean | null;
}

export interface EditableParent extends Pick<Parent, "id">, Partial<Pick<Parent, "parentalAdvice">> {}

export interface Child extends Parent {
  id2: boolean;
  ch1ld1shF4n: boolean | null;
}

export type ChildId = { id: boolean; id2: boolean };

export interface EditableChild
  extends Pick<Child, "id" | "id2">,
    Partial<Pick<Child, "parentalAdvice" | "ch1ld1shF4n">> {}
