import { QFlatComplexPath, QNumberPath, QStringPath, QueryObject } from "../../src";

/**
 * The CAP case: `Member.Address` is a structured element which the service unfolded into `Address_Street`
 * and `Address_City`, so no complex property of that name exists on the wire. `Home` adds the nesting on
 * top of it, which CAP flattens just as recursively (`Home_Address_Street`).
 */
export interface PostalAddress {
  street: string | null;
  city: string | null;
}

export interface Residence {
  label: string | null;
  address: PostalAddress;
}

export interface Member {
  id: number;
  name: string;
  address: PostalAddress;
  home: Residence;
}

export class QPostalAddress extends QueryObject<PostalAddress> {
  public readonly street = new QStringPath(this.withPrefix("Street"));
  public readonly city = new QStringPath(this.withPrefix("City"));
}

export class QResidence extends QueryObject<Residence> {
  public readonly label = new QStringPath(this.withPrefix("Label"));
  public readonly address = new QFlatComplexPath(this.withPrefix("Address"), () => QPostalAddress);
}

export class QMember extends QueryObject<Member> {
  public readonly id = new QNumberPath(this.withPrefix("Id"));
  public readonly name = new QStringPath(this.withPrefix("Name"));
  public readonly address = new QFlatComplexPath(this.withPrefix("Address"), () => QPostalAddress);
  public readonly home = new QFlatComplexPath(this.withPrefix("Home"), () => QResidence);
}

export const qMember = new QMember();
