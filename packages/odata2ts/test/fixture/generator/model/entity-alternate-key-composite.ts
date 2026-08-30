export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
}

export type BookId = string | { id: string } | string | { isbn: string } | { title: string; author: string };
