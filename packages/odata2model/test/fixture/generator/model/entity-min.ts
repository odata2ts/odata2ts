export interface Book {
  id: number;
}

export interface EditableBook extends Pick<Book, "id"> {}
