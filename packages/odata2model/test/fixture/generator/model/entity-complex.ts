export interface Book {
  id: boolean;
  method: PublishingMethod;
  altMethod: PublishingMethod | null;
  altMethods: Array<PublishingMethod>;
}

export interface PublishingMethod {
  name: boolean | null;
  city: City | null;
}

export interface City {
  choice: boolean;
  optChoice: boolean | null;
}
