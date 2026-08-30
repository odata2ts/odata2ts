import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { ODataVersionV4 } from "@odata2ts/odata-core";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { Q_TEST_ENTITY } from "./QTester.js";
// @ts-ignore
import { q_TEST_ENTITY, Q_TEST_ENTITY_ID } from "./QTester.js";
// @ts-ignore
import type { EDITABLE_TEST_ENTITY, TEST_ENTITY, TEST_ENTITY_ID } from "./TesterModel.js";

export class tester extends ODataService {
  public NAVIGATE_TO_LIST(): TEST_ENTITY_COLLECTION_SRV;
  public NAVIGATE_TO_LIST(id: TEST_ENTITY_ID): TEST_ENTITY_SRV;
  public NAVIGATE_TO_LIST(id?: TEST_ENTITY_ID | undefined) {
    const fieldName = "list";
    const { client, path, options } = this.__base;
    const collection = new TEST_ENTITY_COLLECTION_SRV(client, path, fieldName, options);
    return typeof id === "undefined" || id === null ? collection : collection.byId(id);
  }
}

export class TEST_ENTITY_SRV<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<
  TEST_ENTITY,
  EDITABLE_TEST_ENTITY,
  Q_TEST_ENTITY,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, q_TEST_ENTITY, options);
  }
}

export class TEST_ENTITY_COLLECTION_SRV<V extends ODataVersionV4 = "4.0"> extends EntitySetServiceV4<
  TEST_ENTITY,
  EDITABLE_TEST_ENTITY,
  Q_TEST_ENTITY,
  TEST_ENTITY_ID,
  TEST_ENTITY_SRV<V>,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, q_TEST_ENTITY, new Q_TEST_ENTITY_ID(name), options);
  }

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptionsInternal<V> | undefined,
  ) {
    return new TEST_ENTITY_SRV<V>(client, path, name, options);
  }
}
