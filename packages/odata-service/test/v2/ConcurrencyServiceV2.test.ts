import { ODataHttpClient } from "@odata2ts/http-client-api";
import { beforeEach, describe, expect, test } from "vitest";
import {
  EntitySetServiceV2,
  EntityTypeServiceV2,
  ODataConcurrencyError,
  ODataServiceOptionsInternalV2,
} from "../../src";
import { EditablePersonModel, PersonId, PersonModel } from "../fixture/PersonModel";
import { QPersonIdFunction } from "../fixture/QPerson";
import { PersonModelV2CollectionService, PersonModelV2Service } from "../fixture/v2/PersonModelV2Service";
import { QPersonV2, qPersonV2 } from "../fixture/v2/QPersonV2";
import { MockClient } from "../mock/MockClient";

/**
 * The shared fixtures are fixed to `AsV4 = false`; a service reshaping its responses as V4 is a different
 * type, so these two exist to cover that half.
 */
class PersonServiceAsV4 extends EntityTypeServiceV2<PersonModel, EditablePersonModel, QPersonV2, true> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternalV2<true>) {
    super(client, basePath, name, qPersonV2, options);
  }
}

class PersonCollectionAsV4 extends EntitySetServiceV2<
  PersonModel,
  EditablePersonModel,
  QPersonV2,
  PersonId,
  PersonServiceAsV4,
  true
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternalV2<true>) {
    super(client, basePath, name, qPersonV2, new QPersonIdFunction(name), options);
  }

  protected createEntityService(
    client: ODataHttpClient,
    path: string,
    name: string,
    options: ODataServiceOptionsInternalV2<true> | undefined,
  ) {
    return new PersonServiceAsV4(client, path, name, options);
  }
}

const BASE_URL = "test";
const NAME = "test('tester')";
const ENTITY_PATH = `${BASE_URL}/${NAME}`;
const COLLECTION_NAME = "People";
const COLLECTION_PATH = `${BASE_URL}/${COLLECTION_NAME}`;

describe("Optimistic concurrency in the V2 services", () => {
  let client: MockClient;

  function entityService(concurrencyControlled: boolean) {
    return new PersonModelV2Service(client, BASE_URL, NAME, { concurrencyControlled });
  }

  function collectionService(concurrencyControlled: boolean) {
    return new PersonModelV2CollectionService(client, BASE_URL, COLLECTION_NAME, { concurrencyControlled });
  }

  function ifMatch() {
    return client.additionalHeaders?.["If-Match"];
  }

  beforeEach(() => {
    client = new MockClient(true);
    client.responseStatus = 200;
    client.responseHeaders = {};
    client.requestCount = 0;
  });

  describe("the entity service", () => {
    test("patch travels as MERGE and carries If-Match alongside it", async () => {
      client.concurrency.set(ENTITY_PATH, 'W/"1"');

      await entityService(true).patch({ age: "45" }).execute();

      expect(ifMatch()).toBe('W/"1"');
      expect(client.additionalHeaders?.["X-Http-Method"]).toBe("MERGE");
    });

    test("patch without a prior read is refused before anything is sent", async () => {
      await expect(entityService(true).patch({ age: "45" }).execute()).rejects.toThrow(ODataConcurrencyError);

      expect(client.requestCount).toBe(0);
    });

    test("update sends it too", async () => {
      client.concurrency.set(ENTITY_PATH, 'W/"1"');

      await entityService(true)
        .update({ userName: "tester", age: "45" } as any)
        .execute();

      expect(ifMatch()).toBe('W/"1"');
    });

    test("delete sends it too", async () => {
      client.concurrency.set(ENTITY_PATH, 'W/"1"');

      await entityService(true).delete().execute();

      expect(ifMatch()).toBe('W/"1"');
    });

    test("withETag writes without ever reading", async () => {
      await entityService(true).patch({ age: "45" }).withETag('W/"9"').execute();

      expect(ifMatch()).toBe('W/"9"');
    });

    test("ignoreETag writes past whatever is current", async () => {
      await entityService(true).patch({ age: "45" }).ignoreETag().execute();

      expect(ifMatch()).toBe("*");
    });

    test("a raw V2 read stores the ETag from __metadata", async () => {
      client.setModelResponse({ UserName: "tester", __metadata: { etag: 'W/"5"' } });

      await entityService(true).query().execute();

      expect(client.concurrency.store.get(ENTITY_PATH)).toBe('W/"5"');
    });

    test("a read reshaped as V4 states it as control information instead", async () => {
      // the service is fed the same V2 payload; its converter removes the envelope and rewrites
      // __metadata as control information before the harvest ever sees it
      client.setModelResponse({ UserName: "tester", __metadata: { etag: 'W/"5"' } });

      await new PersonServiceAsV4(client, BASE_URL, NAME, {
        concurrencyControlled: true,
        v2ResponseAsV4: true,
      })
        .query()
        .execute();

      expect(client.concurrency.store.get(ENTITY_PATH)).toBe('W/"5"');
    });

    test("the ETag response header is read whatever the payload shape", async () => {
      client.responseHeaders = { etag: 'W/"5"' };

      await entityService(true).query().execute();

      expect(client.concurrency.store.get(ENTITY_PATH)).toBe('W/"5"');
    });

    test("an uncontrolled service sends no If-Match, whatever it knows", async () => {
      client.concurrency.set(ENTITY_PATH, 'W/"1"');

      await entityService(false).patch({ age: "45" }).execute();

      expect(ifMatch()).toBeUndefined();
    });
  });

  describe("the collection service", () => {
    test("a raw V2 collection read stores one ETag per row", async () => {
      client.setCollectionResponse([
        { UserName: "russell", __metadata: { etag: 'W/"1"' } },
        { UserName: "vincent", __metadata: { etag: 'W/"2"' } },
      ]);

      await collectionService(true).query().execute();

      expect(client.concurrency.store.get(`${COLLECTION_PATH}('russell')`)).toBe('W/"1"');
      expect(client.concurrency.store.get(`${COLLECTION_PATH}('vincent')`)).toBe('W/"2"');
    });

    test("the key it builds is the one the entity service writes to", async () => {
      client.setCollectionResponse([{ UserName: "russell", __metadata: { etag: 'W/"1"' } }]);
      await collectionService(true).query().execute();

      const entity = new PersonModelV2Service(client, BASE_URL, "People('russell')", {
        concurrencyControlled: true,
      });
      await entity.patch({ age: "45" }).execute();

      expect(ifMatch()).toBe('W/"1"');
    });

    test("a collection reshaped as V4 is harvested from its value array", async () => {
      client.setCollectionResponse([{ UserName: "russell", __metadata: { etag: 'W/"1"' } }]);

      await new PersonCollectionAsV4(client, BASE_URL, COLLECTION_NAME, {
        concurrencyControlled: true,
        v2ResponseAsV4: true,
      })
        .query()
        .execute();

      expect(client.concurrency.store.get(`${COLLECTION_PATH}('russell')`)).toBe('W/"1"');
    });

    test("a row without an ETag contributes nothing", async () => {
      client.setCollectionResponse([{ UserName: "russell" }]);

      await collectionService(true).query().execute();

      expect(client.concurrency.store.size).toBe(0);
    });

    test("create needs no ETag", async () => {
      const created = collectionService(true).create({ userName: "russell", age: "45" } as any);

      await expect(created.execute()).resolves.toBeDefined();
      expect(ifMatch()).toBeUndefined();
    });
  });
});
