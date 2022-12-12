export enum CHOICE_MODEL {
  A = "A",
  B = "B",
}

export interface PARENT_MODEL {
  PARENT_ID: boolean;
}

export type PARENT_KEY = boolean | { PARENT_ID: boolean };

export interface EDIT_PARENT_MODEL extends Pick<PARENT_MODEL, "PARENT_ID"> {}

export interface BOOK_MODEL extends PARENT_MODEL {
  ID: boolean;
  MY_CHOICE: CHOICE_MODEL;
  ADDRESS: LOCATION_MODEL | null;
}

export type BOOK_KEY = { PARENT_ID: boolean; ID: boolean };

export interface EDIT_BOOK_MODEL extends Pick<BOOK_MODEL, "PARENT_ID" | "ID" | "MY_CHOICE"> {
  ADDRESS?: EDIT_LOCATION_MODEL | null;
}

export interface LOCATION_MODEL {
  TEST: boolean | null;
}

export interface EDIT_LOCATION_MODEL extends Partial<Pick<LOCATION_MODEL, "TEST">> {}
