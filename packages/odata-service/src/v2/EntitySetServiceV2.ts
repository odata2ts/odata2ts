import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import {
  ODataCollectionResponseV2,
  ODataCollectionResponseV4,
  ODataEntityModelResponseV2,
  ODataModelResponseV4,
} from "@odata2ts/odata-core";
import { CollectionQueryBuilderV2, ModelQueryBuilderV2 } from "@odata2ts/odata-query-builder";
import {
  CollectionResponseConverterV2,
  EntityResponseConverterV2,
  QId,
  QueryObjectModel,
} from "@odata2ts/odata-query-objects";
import { buildDeepEditHops, CacheKeyState, withKey, withParams } from "../cacheKey/index.js";
import { getBodyETagV2, getBodyETagV4 } from "../ETagExtraction.js";
import { ODataServiceOptionsInternalV2 } from "../ODataServiceOptions";
import { ConcurrencyOptions, UrlBuilderRequestCmdV2 } from "../request";
import { ServiceStateHelperV2 } from "./ServiceStateHelperV2.js";

/**
 * Service for an entity set: it queries the collection and creates entities in it. Creation is the one
 * write that may supply properties which can never change afterwards, so this is the only entity service
 * still typed on `EditableT`. Everything that writes to an entity which already exists -
 * {@link EntityTypeServiceV2} and friends - takes the updatable model instead.
 */
export abstract class EntitySetServiceV2<
  T,
  EditableT,
  Q extends QueryObjectModel,
  EIdType,
  ES = unknown,
  AsV4 extends boolean = false,
> {
  protected readonly __base: ServiceStateHelperV2<Q, AsV4>;
  protected readonly __idFunction: QId<EIdType>;

  protected constructor(
    client: ODataHttpClient,
    basePath: string,
    name: string,
    qModel: Q,
    idFunction: QId<EIdType>,
    options?: ODataServiceOptionsInternalV2<AsV4>,
    cacheKeyState?: CacheKeyState,
  ) {
    this.__base = new ServiceStateHelperV2(client, basePath, name, qModel, options, cacheKeyState);
    this.__idFunction = idFunction;
  }

  public getPath() {
    return this.__base.path;
  }

  public getCacheKeyState() {
    return this.__base.cacheKeyState;
  }

  /**
   * Build the entity-type service for a specific entity of this set - the concrete class differs per
   * generated entity type, so each generated collection service supplies its own construction here.
   */
  protected abstract createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptionsInternalV2<AsV4> | undefined,
    cacheKeyState?: CacheKeyState,
  ): ES;

  /**
   * The entity-type service addressed by the given id.
   */
  public byId(id: EIdType): ES {
    // basePath, not path: __idFunction already builds the key predicate under this set's own name -
    // path would double that segment
    const { client, basePath, options, isUrlNotEncoded, cacheKeyState } = this.__base;
    return this.createEntityService(
      client,
      basePath,
      this.__idFunction.buildUrl(id, isUrlNotEncoded()),
      options,
      cacheKeyState && withKey(cacheKeyState, this.cacheKeyOf(id), id),
    );
  }

  /**
   * The key of the addressed entity as a cache key carries it - see {@link EntitySetServiceV4.cacheKeyOf},
   * whose reasoning applies unchanged here.
   */
  private cacheKeyOf(id: EIdType): unknown {
    const params = this.__idFunction.getParamsFor(id);
    const primary = this.__idFunction.getPrimaryParams();
    const isPrimarySingle = params.length === 1 && primary.length === 1 && primary[0].getName() === params[0].getName();

    const values = Object.fromEntries(
      params.map((param) => [param.getName(), param.convertTo((id as any)?.[param.getMappedName()] ?? id)]),
    );
    return isPrimarySingle ? Object.values(values)[0] : values;
  }

  /**
   * The key specification for the given entity type.
   * Supports composite keys.
   */
  public getKeySpec() {
    return this.__idFunction.getPrimaryParams();
  }

  /**
   * Create an OData path for an entity with a given id.
   * Might be useful for routing.
   *
   * @example createKey(1234) => myEntity(1234)
   * @example createKey({id: 1234, name: "Test"}) => myEntity(id=1234,name='Test')
   * @param id either a primitive value (single key entities only) or an object
   * @param notEncoded if set to {@code true}, special chars are not escaped
   */
  public createKey(id: EIdType, notEncoded?: boolean): string {
    const url = this.__idFunction.buildUrl(id, notEncoded ?? this.__base.isUrlNotEncoded());
    return url.startsWith("/") ? url.substring(1) : url;
  }

  /**
   * Parse an OData path representing the id of an entity.
   * Might be useful for routing in combination with createKey.
   *
   * @example parseKey("myEntity(1234)") => 1234
   * @example parseKey("myEntity(id=1234,name='Test')") => { id: 1234, name: "Test" }
   * @param keyPath e.g. myEntity(id=1234,name='Test')
   * @param notDecoded if set to {@code true}, encoded special chars are not decoded
   */
  public parseKey(keyPath: string, notDecoded?: boolean): EIdType {
    return this.__idFunction.parseUrl(keyPath, notDecoded ?? this.__base.isUrlNotEncoded());
  }

  /**
   * Create a new model.
   * Spec: {@link https://www.odata.org/documentation/odata-version-2-0/operations/} - 2.4 Creating new Entries
   *
   * The service should respond with 201 (Created) and the newly created model.
   *
   * @param model the entity to create
   * @param queryFn additional query after the entity has been created, only $select and $expand apply here
   * @return
   */
  /**
   * The URL of one entity of this set - the very string the entity service of that entity builds for
   * itself, which is what lets a collection read fill the store for entities nobody read singly.
   */
  private entityKeyOf(entry: any): string | undefined {
    const params = this.__idFunction.getPrimaryParams();
    if (!params.length || params.some((p) => entry?.[p.getMappedName()] === undefined)) {
      return undefined;
    }
    // a single key travels as the bare value, which is what yields the short form the entity service uses
    const id =
      params.length === 1
        ? entry[params[0].getMappedName()]
        : Object.fromEntries(params.map((p) => [p.getMappedName(), entry[p.getMappedName()]]));
    return `${this.__base.basePath}/${this.__idFunction.buildUrl(id as EIdType, this.__base.isUrlNotEncoded())}`;
  }

  /**
   * The concurrency options of a command over this collection.
   *
   * A raw V2 collection arrives as `{ d: { results: [...] } }` and states each ETag in `__metadata`; one
   * reshaped as V4 has had the envelope removed and the control information rewritten, so the reader is
   * chosen here rather than by a helper trying every spelling.
   */
  protected getCollectionConcurrencyOptions(): ConcurrencyOptions {
    const asV4 = this.__base.isAsV4();
    return {
      key: this.__base.path,
      controlled: this.__base.isConcurrencyControlled(),
      harvest: (data: any) => {
        const payload = asV4 ? data : data?.d;
        const rows: Array<any> = Array.isArray(payload?.value)
          ? payload.value
          : Array.isArray(payload?.results)
            ? payload.results
            : payload
              ? [payload]
              : [];
        return rows
          .map((entry) => [this.entityKeyOf(entry), asV4 ? getBodyETagV4(entry) : getBodyETagV2(entry)])
          .filter((pair): pair is [string, string] => !!pair[0] && !!pair[1]);
      },
    };
  }

  public create(model: EditableT, queryFn?: (builder: ModelQueryBuilderV2<Q>, qObject: Q) => void) {
    const { client, qModel, getDefaultHeaders, createModelQueryBuilder, cacheKeyState } = this.__base;
    const builder = createModelQueryBuilder(queryFn);

    const deepEditHops = cacheKeyState && buildDeepEditHops(cacheKeyState.qEntityFn, model);
    const stateForRequest =
      deepEditHops && cacheKeyState ? withParams(cacheKeyState, { deepEdit: deepEditHops }) : cacheKeyState;

    return new UrlBuilderRequestCmdV2<
      AsV4 extends true ? ODataModelResponseV4<T> : ODataEntityModelResponseV2<T>,
      Q,
      ModelQueryBuilderV2<Q>,
      EditableT
    >(client, ODataHttpMethods.Post, builder, qModel, model, {
      headers: getDefaultHeaders(),
      mainRequestConverter: qModel,
      mainResponseConverter: new EntityResponseConverterV2<T, AsV4>(qModel, this.__base.isAsV4()),
      cacheKeyState: stateForRequest,
    });
  }

  /**
   * Query the entity set.
   *
   * @param queryFn provide the query logic with the help of the builder and the query-object
   */
  public query<ReturnType extends Partial<T> = T>(
    queryFn?: (builder: CollectionQueryBuilderV2<Q>, qObject: Q) => void,
  ) {
    const { client, qModel, getDefaultHeaders, createQueryBuilder, cacheKeyState } = this.__base;
    const builder = createQueryBuilder(queryFn);

    return new UrlBuilderRequestCmdV2<
      AsV4 extends true ? ODataCollectionResponseV4<ReturnType> : ODataCollectionResponseV2<ReturnType>,
      Q
    >(client, ODataHttpMethods.Get, builder, qModel, undefined, {
      concurrency: this.getCollectionConcurrencyOptions(),
      headers: getDefaultHeaders(),
      mainResponseConverter: new CollectionResponseConverterV2<ReturnType, AsV4>(qModel, this.__base.isAsV4()),
      cacheKeyState,
      queryParams: builder.getCacheKeyParams(),
    });
  }
}
