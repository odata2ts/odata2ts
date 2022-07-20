export interface Book {
  id: number;
  method: PublishingMethod;
  altMethods?: Array<PublishingMethod>;
}

export interface PublishingMethod {
  name?: boolean;
}
