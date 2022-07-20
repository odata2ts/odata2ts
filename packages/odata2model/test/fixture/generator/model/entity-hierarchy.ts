export interface GrandParent {
  id: number;
}

export interface Parent extends GrandParent {
  parentalAdvice?: boolean;
}

export interface Child extends Parent {
  Ch1ld1shF4n?: boolean;
}
