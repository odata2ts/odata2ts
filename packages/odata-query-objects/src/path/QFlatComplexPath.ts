import { FLAT_SEPARATOR, flatLeafPaths, QueryObject } from "../QueryObject";
import { QModelBasePath } from "./QModelBasePath";

/**
 * A complex property of a service which does not know it as one: the service unfolded it into a property
 * per leaf, joined by an underscore, so what the models state as `address.city` travels and is queried as
 * `Address_City`. Generated in place of {@link QComplexPath} for the `unflattenComplexTypes`
 * option - see there for why a service would do that.
 *
 * Everything else follows from the separator: the query builder phrases `$select`, `$filter` and
 * `$orderby` from these paths, and {@link QueryObject} reads the same separator to take such a property
 * apart and put it back together when converting payloads.
 */
export class QFlatComplexPath<Q extends QueryObject> extends QModelBasePath<Q> {
  public readonly discriminator = "FlatComplexType";

  protected override readonly separator = FLAT_SEPARATOR;

  /**
   * The paths of every leaf this property is made of, which is what addressing it as a whole comes down to:
   * a service which knows no property of this name cannot select it either, so `$select=Address` has to be
   * stated as `$select=Address_Street,Address_City`.
   */
  public getLeafPaths(): Array<string> {
    return flatLeafPaths(this.getEntity(true));
  }
}
