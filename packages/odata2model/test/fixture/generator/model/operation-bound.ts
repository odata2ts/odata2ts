export interface Book {
  id: boolean;
}

export type BookId = boolean | { id: boolean };

export interface EditableBook extends Pick<Book, "id"> {}

export interface MinOperationParams {
  test: string;
  optTest?: string | null;
}
