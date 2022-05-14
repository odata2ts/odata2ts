import { ODataClient, ODataResponse } from "@odata2ts/odata-client-api";
import { QueryObject } from "@odata2ts/odata-query-objects";
import { ODataUriBuilderV2 } from "@odata2ts/odata-uri-builder";

import { ODataCollectionResponseV2, ODataModelResponseV2 } from "./ResponseModelV2";
import { EntityTypeServiceV2 } from "./EntityTypeServiceV2";
import { ServiceBaseV2 } from "./ServiceBaseV2";
import { EntityKeySpec } from "../ServiceModel";
import { compileId } from "../helper/UrlHelper";

export abstract class EntitySetServiceV2<
  T,
  Q extends QueryObject,
  EIdType,
  ETS extends EntityTypeServiceV2<T, Q>
> extends ServiceBaseV2<T, Q> {
  /**
   * Overriding the constructor to support creation of EntityTypeService from within this service.
   * Also support key spec.
   *
   * @param client the odata client responsible for data requests
   * @param path the base URL path
   * @param qModel query object
   * @param entityTypeServiceConstructor the corresponding service for a single entity
   * @param keySpec the specification of the key (supports composite keys) of the given entity
   * @protected
   */
  protected constructor(
    client: ODataClient,
    path: string,
    qModel: Q,
    protected entityTypeServiceConstructor: new (client: ODataClient, path: string) => ETS,
    protected keySpec: Array<EntityKeySpec>
  ) {
    super(client, path, qModel);
  }

  /**
   * The key specification for the given entity type.
   * Supports composite keys.
   */
  public getKeySpec() {
    return this.keySpec;
  }

  /**
   * Create a new model.
   *
   * @param model
   * @return
   */
  public create: (model: T) => ODataResponse<ODataModelResponseV2<T>> = this.doPost;

  public get(id: EIdType) {
    const url = compileId(this.path, this.keySpec, id);
    return new this.entityTypeServiceConstructor(this.client, url);
  }

  public patch(id: EIdType, model: Partial<T>): ODataResponse<void> {
    return this.get(id).patch(model);
  }

  public delete(id: EIdType): ODataResponse<void> {
    return this.get(id).delete();
  }

  public query: (
    queryFn?: (builder: ODataUriBuilderV2<Q>, qObject: Q) => void
  ) => ODataResponse<ODataCollectionResponseV2<T>> = this.doQuery;
}
