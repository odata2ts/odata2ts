export interface Category {
  id: boolean;
  version: number | null;
}

export type CategoryId = { id: boolean; version: number | null };

export interface EditableCategory extends Pick<Category, "id">, Partial<Pick<Category, "version">> {}

export interface Book {
  id: boolean;
  address: LOCATION | null;
}

export type BookId = boolean | { id: boolean };

export interface EditableBook {
  address?: EditableLOCATION | null;
}

export interface LOCATION {
  TEST: boolean | null;
}

export interface EditableLOCATION extends Partial<Pick<LOCATION, "TEST">> {}
