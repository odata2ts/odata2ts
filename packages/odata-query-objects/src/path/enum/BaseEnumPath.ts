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
  public constructor(protected path: string) {
    if (!path || !path.trim()) {
      throw new Error("Path must be supplied!");
    }
  }

  protected abstract mapValue(value: EnumMemberType): string;

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

  public equals = filterEquals<EnumMemberType>(this.path, this.mapValue.bind(this));
  public eq = this.equals;

  public notEquals = filterNotEquals<EnumMemberType>(this.path, this.mapValue.bind(this));
  public ne = this.notEquals;

  public lowerThan = filterLowerThan<EnumMemberType>(this.path, this.mapValue.bind(this));
  public lt = this.lowerThan;

  public lowerEquals = filterLowerEquals<EnumMemberType>(this.path, this.mapValue.bind(this));
  public le = this.lowerEquals;

  public greaterThan = filterGreaterThan<EnumMemberType>(this.path, this.mapValue.bind(this));
  public gt = this.greaterThan;

  public greaterEquals = filterGreaterEquals<EnumMemberType>(this.path, this.mapValue.bind(this));
  public ge = this.greaterEquals;

  public in = filterInEmulated<EnumMemberType>(this.path, this.mapValue.bind(this));
}
