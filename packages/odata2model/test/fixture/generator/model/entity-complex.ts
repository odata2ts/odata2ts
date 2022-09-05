export interface Book {
  id: boolean;
  method: PublishingMethod;
  altMethod: PublishingMethod | null;
  altMethods: Array<PublishingMethod>;
}

export type BookId = boolean | { id: boolean };

export interface EditableBook extends Pick<Book, "id"> {
  method: EditablePublishingMethod;
  altMethod?: EditablePublishingMethod | null;
  altMethods?: Array<EditablePublishingMethod>;
}

export interface PublishingMethod {
  name: boolean | null;
  city: City | null;
}

export interface EditablePublishingMethod extends Partial<Pick<PublishingMethod, "name">> {
  city?: EditableCity | null;
}

export interface City {
  choice: boolean;
  optChoice: boolean | null;
}

export interface EditableCity extends Pick<City, "choice">, Partial<Pick<City, "optChoice">> {}
