import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataCollectionResponseFor, ODataModelPayloadFor, ODataVersionV4 } from "@odata2ts/odata-core";
import { CollectionQueryBuilderV4, ModelQueryBuilderV4 } from "@odata2ts/odata-query-builder";
import {
  CollectionResponseConverterV4,
  ModelResponseConverterV4,
  QId,
  QueryObjectModel,
} from "@odata2ts/odata-query-objects";
import { getBodyETagV4 } from "../ETagExtraction.js";
import { ODataServiceOptionsInternal } from "../ODataServiceOptions";
import { ConcurrencyOptions, UrlBuilderRequestCmdV4 } from "../request";
import { EntityModificationResponseV4 } from "./ResponseTypeChoicesV4";
import { ServiceStateHelperV4, SubtypeOptions } from "./ServiceStateHelperV4.js";

/**
 * Service for an entity set: it queries the collection and creates entities in it. Creation is the one
 * write that may supply properties which can never change afterwards, so this is the only entity service
 * still typed on `EditableT`. Everything that writes to an entity which already exists -
 * {@link EntityTypeServiceV4} and friends - takes the updatable model instead.
 */
export abstract class EntitySetServiceV4<
  T,
  EditableT,
  Q extends QueryObjectModel,
  EIdType,
  ES = unknown,
  V extends ODataVersionV4 = "4.0",
> {
  protected readonly __base: ServiceStateHelperV4<Q, V>;
  protected readonly __idFunction: QId<EIdType>;

  /**
   * Overriding the constructor to support creation of EntityTypeService from within this service.
   * Also support key spec.
   *
   * @param client the odata client responsible for data requests
   * @param basePath the base URL path
   * @param name name of the service
   * @param qModel query object
   * @param idFunction the id function
   * @param options
   * @protected
   */
  protected constructor(
    client: ODataHttpClient,
    basePath: string,
    name: string,
    qModel: Q,
    idFunction: QId<EIdType>,
    options?: ODataServiceOptionsInternal<V>,
  ) {
    this.__base = new ServiceStateHelperV4(client, basePath, name, qModel, options);
    this.__idFunction = idFunction;
  }

  public getPath() {
    return this.__base.path;
  }

  /**
   * Build the entity-type service for a specific entity of this set - the concrete class differs per
   * generated entity type (e.g. `MediumService` vs. `PrintMediumService`), so each generated collection
   * service supplies its own construction here.
   */
  protected abstract createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptionsInternal<V> | undefined,
  ): ES;

  /**
   * The entity-type service addressed by the given id - primary or, where declared, an alternate key.
   *
   * Works the same after a subtype cast (e.g. {@link asPrintMediumCollectionService}-style getters):
   * the cast segment is already part of this service's path, so the id only ever needs to add the key
   * predicate - which is what makes addressing by a subtype's own alternate key possible at all, since
   * the entity set's own id type never carries a subtype's alternate key.
   */
  public byId(id: EIdType): ES {
    // basePath, not path: __idFunction already builds the key predicate under this set's own name (or,
    // after a subtype cast, the cast segment's name) - path would double that segment
    const { client, basePath, options, isUrlNotEncoded } = this.__base;
    return this.createEntityService(client, basePath, this.__idFunction.buildUrl(id, isUrlNotEncoded()), options);
  }

  /**
   * The key specification for the given entity type, i.e. the primary key.
   * Supports composite keys.
   */
  public getKeySpec() {
    return this.__idFunction.getPrimaryParams();
  }

  /**
   * The key specification of every alternate key declared for this entity type
   * (`Core.AlternateKeys`) - empty where none are declared. One entry per alternate key, in the same
   * order {@link createKey}/{@link parseKey} try them in after the primary key.
   */
  public getAlternateKeySpecs() {
    return this.__idFunction.getAlternateParams();
  }

  /**
   * Create an OData path for an entity with a given id.
   * Might be useful for routing.
   *
   * @example `createKey("1234")` => `"myEntity('1234')"`
   * @example `createKey({number: 1234, name: "Test"})` => `"myEntity(number=1234,name='Test')"`
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
   * @example `parseKey("myEntity(1234)")` => `"1234"`
   * @example `parseKey("myEntity(id=1234,name='Test')")` => `{ id: 1234, name: "Test" }`
   * @param keyPath e.g. myEntity(id=1234,name='Test')
   * @param notDecoded if set to {@code true}, encoded special chars are not decoded
   */
  public parseKey(keyPath: string, notDecoded?: boolean): EIdType {
    return this.__idFunction.parseUrl(keyPath, notDecoded ?? this.__base.isUrlNotEncoded());
  }

  /**
   * The URL of one entity of this set - the very string the entity service of that entity builds for
   * itself, which is what lets a collection read fill the store for entities nobody has read singly.
   *
   * Built from the mapped, user-facing property names, so it only works on a converted response.
   */
  private entityKeyOf(entry: any): string | undefined {
    // always the primary key: the entity's real identity for cache purposes, regardless of which key
    // shape it was originally fetched by
    const params = this.__idFunction.getPrimaryParams();
    if (!params.length || params.some((p) => entry?.[p.getMappedName()] === undefined)) {
      return undefined;
    }
    // a single key travels as the bare value, which is what yields the short form `People('russell')`;
    // handing over an object would build `People(UserName='russell')` instead - a valid URL, and not the
    // one the entity service addressing that entity uses, so the two would never meet in the store
    const id =
      params.length === 1
        ? entry[params[0].getMappedName()]
        : Object.fromEntries(params.map((p) => [p.getMappedName(), entry[p.getMappedName()]]));
    return `${this.__base.basePath}/${this.__idFunction.buildUrl(id as EIdType, this.__base.isUrlNotEncoded())}`;
  }

  /**
   * The concurrency options of a command over this collection: every row states its own ETag, and each is
   * stored under the URL of the entity it describes - which is what makes "read the list, then patch one
   * row" work without reading that row again.
   *
   * A single object is handled too, since a create answers with the entity it made.
   */
  protected getCollectionConcurrencyOptions(): ConcurrencyOptions {
    return {
      key: this.__base.path,
      controlled: this.__base.isConcurrencyControlled(),
      harvest: (data: any) => {
        const rows: Array<any> = Array.isArray(data?.value) ? data.value : data ? [data] : [];
        return rows
          .map((entry) => [this.entityKeyOf(entry), getBodyETagV4(entry)])
          .filter((pair): pair is [string, string] => !!pair[0] && !!pair[1]);
      },
    };
  }

  /**
   * Create a new model.
   * Spec: {@link https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_CreateanEntity}).
   *
   * The response of this operation is status 201 with the proper and complete model including the usually required id.
   * With a header field of "Prefer" and value "return=minimal" the OData server should respond with
   * status 204 and comes with no response data at all.
   * Both implementations have to supply the URL to the resource in the header field "Location", so you can always
   * extract the ID as part of this URL (the appropriate QId object can help parsing here).
   *
   * If you know in which way your server responds, you can easily supply this information via a boolean switch
   * to get the correct typing. `true` (default) means that the complete entity is returned, while `false` determines
   * that no data is returned, e.g. `create<false>(...)`.
   *
   * @param model
   * @param createOptions
   * @param queryFn
   * @return command object for request execution
   */
  public create<Response extends boolean = true>(
    model: ODataModelPayloadFor<V, EditableT>,
    createOptions?: SubtypeOptions,
    queryFn?: (builder: ModelQueryBuilderV4<Q>, qObject: Q) => void,
  ) {
    const { client, basePath, path, getDefaultHeaders, getVersionHeaders, qModel, createModelQueryBuilder } =
      this.__base;
    const { dontUseCastPathSegment, useTypeCi } = this.__base.evaluateSubtypeOptions(createOptions);

    // add control info automatically, if required
    const data = useTypeCi ? this.__base.addTypeControlInfo(model) : model;
    const actualPath = dontUseCastPathSegment ? basePath : path;

    return new UrlBuilderRequestCmdV4<
      EntityModificationResponseV4<Response, T, V>,
      Q,
      ModelQueryBuilderV4<Q>,
      ODataModelPayloadFor<V, EditableT>
    >(client, ODataHttpMethods.Post, createModelQueryBuilder(queryFn, actualPath), qModel, data, {
      headers: { ...getDefaultHeaders(), ...getVersionHeaders() },
      mainRequestConverter: qModel,
      mainResponseConverter: new ModelResponseConverterV4(qModel),
      // an entity that does not exist yet cannot require its own ETag, so a create is never gated - it
      // only harvests, storing the ETag of what it just made
      concurrency: { ...this.getCollectionConcurrencyOptions(), controlled: false },
    });
  }

  /**
   * Query the entity set.
   * Spec: {@link https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_QueryingCollections}
   *
   * @param queryFn provide the query logic with the help of the builder and the query-object
   */
  public query<ReturnType extends Partial<T> = T>(
    queryFn?: (builder: CollectionQueryBuilderV4<Q>, qObject: Q) => void,
  ) {
    const { client, qModel, createQueryBuilder, getDefaultHeaders } = this.__base;

    return new UrlBuilderRequestCmdV4<ODataCollectionResponseFor<V, ReturnType>, Q>(
      client,
      ODataHttpMethods.Get,
      createQueryBuilder(queryFn),
      qModel,
      undefined,
      {
        headers: getDefaultHeaders(),
        mainResponseConverter: new CollectionResponseConverterV4(qModel),
        concurrency: this.getCollectionConcurrencyOptions(),
      },
    );
  }
}
