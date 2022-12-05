export enum CHOICE_MODEL {
  A = "A",
  B = "B",
}

export interface PARENT_MODEL {
  parentId: boolean;
}

export type PARENT_KEY = boolean | { parentId: boolean };

export interface EDIT_PARENT_MODEL extends Pick<PARENT_MODEL, "parentId"> {}

export interface BOOK_MODEL extends PARENT_MODEL {
  id: boolean;
  myChoice: CHOICE_MODEL;
  address: LOCATION_MODEL | null;
}

export type BOOK_KEY = { parentId: boolean; id: boolean };

export interface EDIT_BOOK_MODEL extends Pick<BOOK_MODEL, "parentId" | "id" | "myChoice"> {
  address?: EDIT_LOCATION_MODEL | null;
}

export interface LOCATION_MODEL {
  test: boolean | null;
}

export interface EDIT_LOCATION_MODEL extends Partial<Pick<LOCATION_MODEL, "test">> {}
