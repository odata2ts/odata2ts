export interface Book {
  id: string;
  isbn: string;
}

export type BookId = string | { id: string } | string | { isbn: string };
