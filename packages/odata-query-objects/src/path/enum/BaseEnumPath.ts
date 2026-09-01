import {
  filterEquals,
  filterGreaterEquals,
  filterGreaterThan,
  filterInEmulated,
  filterIsNotNull,
  filterIsNull,
  filterLowerEquals,
  filterLowerThan,
  filterNotEquals,
  orderAscending,
  orderDescending,
} from "../base/BaseFunctions";
import { QPathModel } from "../QPathModel";

export abstract class BaseEnumPath<EnumMemberType> implements QPathModel {
  protected constructor(protected path: string) {
    if (!path || !path.trim()) {
      throw new Error("Path must be supplied!");
    }
  }

  protected abstract mapValue(value: EnumMemberType): string;

  /**
   * The OData-side value of the given enum member: the converting half of {@link mapValue}, without the
   * quoting or literal rendering on top. Always a string - an enum member is an identity, not a
   * quantity, so a numeric enum's symbolic name is represented the same way as a string enum's, keeping
   * the clause stable and JSON-serialisable across both.
   */
  protected abstract typedValue(value: EnumMemberType): string;

  /**
   * Returns the path of this property.
   */
  public getPath(): string {
    return this.path;
  }

  public ascending = orderAscending(this.path);
  public asc = this.ascending;

  public descending = orderDescending(this.path);
  public desc = this.descending;

  public isNull = filterIsNull(this.path);
  public isNotNull = filterIsNotNull(this.path);

  public equals = filterEquals<EnumMemberType>(this.path, this.mapValue.bind(this), this.typedValue.bind(this));
  public eq = this.equals;

  public notEquals = filterNotEquals<EnumMemberType>(this.path, this.mapValue.bind(this), this.typedValue.bind(this));
  public ne = this.notEquals;

  public lowerThan = filterLowerThan<EnumMemberType>(this.path, this.mapValue.bind(this), this.typedValue.bind(this));
  public lt = this.lowerThan;

  public lowerEquals = filterLowerEquals<EnumMemberType>(
    this.path,
    this.mapValue.bind(this),
    this.typedValue.bind(this),
  );
  public le = this.lowerEquals;

  public greaterThan = filterGreaterThan<EnumMemberType>(
    this.path,
    this.mapValue.bind(this),
    this.typedValue.bind(this),
  );
  public gt = this.greaterThan;

  public greaterEquals = filterGreaterEquals<EnumMemberType>(
    this.path,
    this.mapValue.bind(this),
    this.typedValue.bind(this),
  );
  public ge = this.greaterEquals;

  public in = filterInEmulated<EnumMemberType>(this.path, this.mapValue.bind(this));
}
