export interface Book {
  id: string;
  method: PublishingMethod;
  altMethod: PublishingMethod | null;
  altMethods: Array<PublishingMethod>;
}

export interface PublishingMethod {
  name: boolean | null;
}
