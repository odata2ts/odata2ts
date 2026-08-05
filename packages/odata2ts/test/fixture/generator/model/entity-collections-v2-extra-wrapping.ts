export interface Book {
  id: number;
  keywords: Array<string>;
  previousAddresses: Array<Address>;
}

export interface EditableBook extends Partial<Pick<Book, "keywords">> {
  previousAddresses?: Array<EditableAddress>;
}

export interface Address {
  street: string | null;
}

export interface EditableAddress extends Partial<Pick<Address, "street">> {}
