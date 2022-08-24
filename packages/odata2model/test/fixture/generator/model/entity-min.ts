export interface Book {
  id: boolean;
}

export interface EditableBook extends Pick<Book, "id"> {}
