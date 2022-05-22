export interface GrandParent {
  id: string;
}

export interface Parent extends GrandParent {
  parentalAdvice: boolean | null;
}

export interface Child extends Parent {
  Ch1ld1shF4n: boolean | null;
}
