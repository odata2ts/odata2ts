export enum Features {
  Feature1,
  Feature2 = 5,
  Feature3,
}

export interface Person {
  age: number;
  name: string;
  deceased: boolean;
  createdAt: string;
  Address: Address;
  AltAdresses: Array<Address>;
  Feature: Features;
  LikedFeatures: Array<Features>;
}

export interface Address {
  street: string;
  responsible: Person;
}
