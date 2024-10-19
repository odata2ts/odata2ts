import type { ODataHttpClient } from "@odata2ts/http-client-api";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { Q_TEST_ENTITY } from "./QTester";
// @ts-ignore
import { q_TEST_ENTITY, Q_TEST_ENTITY_ID } from "./QTester";
// @ts-ignore
import type { EDITABLE_TEST_ENTITY, TEST_ENTITY, TEST_ENTITY_ID } from "./TesterModel";

export class tester<in out ClientType extends ODataHttpClient> extends ODataService<ClientType> {
  public NAVIGATE_TO_LIST(): TEST_ENTITY_COLLECTION_SRV<ClientType>;
  public NAVIGATE_TO_LIST(id: TEST_ENTITY_ID): TEST_ENTITY_SRV<ClientType>;
  public NAVIGATE_TO_LIST(id?: TEST_ENTITY_ID | undefined) {
    const fieldName = "list";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new TEST_ENTITY_COLLECTION_SRV(client, path, fieldName, options)
      : new TEST_ENTITY_SRV(client, path, new Q_TEST_ENTITY_ID(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }
}

export class TEST_ENTITY_SRV<in out ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  TEST_ENTITY,
  EDITABLE_TEST_ENTITY,
  Q_TEST_ENTITY
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, q_TEST_ENTITY, options);
  }
}

export class TEST_ENTITY_COLLECTION_SRV<in out ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  TEST_ENTITY,
  EDITABLE_TEST_ENTITY,
  Q_TEST_ENTITY,
  TEST_ENTITY_ID
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, q_TEST_ENTITY, new Q_TEST_ENTITY_ID(name), options);
  }
}
