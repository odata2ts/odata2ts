export interface Book {
  id: string;
}

export interface EditableBook extends Pick<Book, "id"> {}
