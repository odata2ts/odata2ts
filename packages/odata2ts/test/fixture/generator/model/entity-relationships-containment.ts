export interface Author {
  id: number;
  name: boolean | null;
}

export type AuthorId = number | { id: number };

export interface EditableAuthor extends Partial<Pick<Author, "id" | "name">> {}

export interface Chapter {
  id: number;
  title: string | null;
}

export type ChapterId = number | { id: number };

export interface EditableChapter extends Partial<Pick<Chapter, "id" | "title">> {}

export interface Book {
  id: number;
  author?: Author | null;
  chapters?: Array<Chapter>;
}

export type BookId = number | { id: number };

export interface EditableBook extends Partial<Pick<Book, "id">> {
  author?: EditableAuthor;
  chapters?: Array<EditableChapter>;
}
