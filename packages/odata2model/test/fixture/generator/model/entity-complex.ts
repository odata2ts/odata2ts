export interface Book {
  id: string;
  method: PublishingMethod;
  altMethods?: Array<PublishingMethod>;
}

export interface PublishingMethod {
  name?: boolean;
}
