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
  AltAddresses: Array<Address>;
  Feature: Features;
  LikedFeatures: Array<Features>;
  bestFriend: Person;
  friends: Array<Person>;
}

export interface Address {
  street: string;
  responsible: Person;
}
