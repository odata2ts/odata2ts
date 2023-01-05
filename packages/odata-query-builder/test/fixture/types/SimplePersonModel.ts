export interface Person {
  age: number;
  name: string;
  deceased: boolean;
  createdAt: string;
  Address: Address;
  AltAdresses: Array<Address>;
}

export interface Address {
  street: string;
  responsible: Person;
}
