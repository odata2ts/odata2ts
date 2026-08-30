import { beforeEach, describe, expect, test } from "vitest";
import { DEFAULT_HEADERS, ODataConcurrencyError } from "../../src";
import { PersonModelCollectionService, PersonModelService } from "../fixture/v4/PersonModelService";
import { TestCollectionServiceWithAlternateKey } from "../fixture/v4/TypingModelService";
import { MockClient } from "../mock/MockClient";

const BASE_URL = "test";
const NAME = "test('tester')";
const ENTITY_PATH = `${BASE_URL}/${NAME}`;
const COLLECTION_NAME = "People";
const COLLECTION_PATH = `${BASE_URL}/${COLLECTION_NAME}`;

describe("Optimistic concurrency in the V4 services", () => {
  let client: MockClient;

  function entityService(concurrencyControlled: boolean) {
    return new PersonModelService(client, BASE_URL, NAME, { concurrencyControlled });
  }

  function collectionService(concurrencyControlled: boolean) {
    return new PersonModelCollectionService(client, BASE_URL, COLLECTION_NAME, { concurrencyControlled });
  }

  function ifMatch() {
    return client.additionalHeaders?.["If-Match"];
  }

  beforeEach(() => {
    client = new MockClient(false);
    client.responseStatus = 200;
    client.responseHeaders = {};
    client.requestCount = 0;
  });

  describe("the entity service", () => {
    test("patch sends the ETag read earlier", async () => {
      client.concurrency.set(ENTITY_PATH, 'W/"1"');

      await entityService(true).patch({ age: "45" }).execute();

      expect(ifMatch()).toBe('W/"1"');
    });

    test("patch without a prior read is refused before anything is sent", async () => {
      await expect(entityService(true).patch({ age: "45" }).execute()).rejects.toThrow(ODataConcurrencyError);

      expect(client.requestCount).toBe(0);
    });

    test("update behaves the same", async () => {
      client.concurrency.set(ENTITY_PATH, 'W/"1"');

      await entityService(true)
        .update({ userName: "tester", age: "45", favFeature: undefined!, features: [] })
        .execute();

      expect(ifMatch()).toBe('W/"1"');
    });

    test("delete sends it too, and now carries the default headers it never had", async () => {
      client.concurrency.set(ENTITY_PATH, 'W/"1"');

      const request = entityService(true).delete();
      expect(request.getInfo().headers).toStrictEqual(DEFAULT_HEADERS);

      await request.execute();
      expect(ifMatch()).toBe('W/"1"');
    });

    test("delete without a known ETag is refused", async () => {
      await expect(entityService(true).delete().execute()).rejects.toThrow(ODataConcurrencyError);

      expect(client.requestCount).toBe(0);
    });

    test("withETag writes without ever reading", async () => {
      await entityService(true).patch({ age: "45" }).withETag('W/"9"').execute();

      expect(ifMatch()).toBe('W/"9"');
    });

    test("ignoreETag writes past whatever is current", async () => {
      await entityService(true).patch({ age: "45" }).ignoreETag().execute();

      expect(ifMatch()).toBe("*");
    });

    test("a query stores the ETag from the response header", async () => {
      client.responseHeaders = { etag: 'W/"5"' };

      await entityService(true).query().execute();

      expect(client.concurrency.store.get(ENTITY_PATH)).toBe('W/"5"');
    });

    test("a query stores the ETag stated in the body", async () => {
      client.setModelResponse({ UserName: "tester", "@odata.etag": 'W/"5"' });

      await entityService(true).query().execute();

      expect(client.concurrency.store.get(ENTITY_PATH)).toBe('W/"5"');
    });

    test("the 4.01 short form is read as well", async () => {
      client.setModelResponse({ UserName: "tester", "@etag": 'W/"5"' });

      await entityService(true).query().execute();

      expect(client.concurrency.store.get(ENTITY_PATH)).toBe('W/"5"');
    });

    test("an uncontrolled service sends no If-Match, whatever it knows", async () => {
      client.concurrency.set(ENTITY_PATH, 'W/"1"');

      await entityService(false).patch({ age: "45" }).execute();

      expect(ifMatch()).toBeUndefined();
    });

    test("read, write, then write again: the second write is refused", async () => {
      client.responseHeaders = { etag: 'W/"1"' };
      await entityService(true).query().execute();

      client.responseHeaders = {};
      client.responseStatus = 204;
      await entityService(true).patch({ age: "45" }).execute();

      await expect(entityService(true).patch({ age: "46" }).execute()).rejects.toThrow(ODataConcurrencyError);
    });
  });

  describe("the collection service", () => {
    test("a collection read stores one ETag per row, under each entity's own URL", async () => {
      client.setCollectionResponse([
        { UserName: "russell", "@odata.etag": 'W/"1"' },
        { UserName: "vincent", "@odata.etag": 'W/"2"' },
      ]);

      await collectionService(true).query().execute();

      expect(client.concurrency.store.get(`${COLLECTION_PATH}('russell')`)).toBe('W/"1"');
      expect(client.concurrency.store.get(`${COLLECTION_PATH}('vincent')`)).toBe('W/"2"');
    });

    test("the key it builds is the one the entity service writes to", async () => {
      // this is the whole point of the harvest: list, then edit one row without reading it again
      client.setCollectionResponse([{ UserName: "russell", "@odata.etag": 'W/"1"' }]);
      await collectionService(true).query().execute();

      const entity = new PersonModelService(client, BASE_URL, "People('russell')", { concurrencyControlled: true });
      await entity.patch({ age: "45" }).execute();

      expect(ifMatch()).toBe('W/"1"');
    });

    test("a row without an ETag contributes nothing", async () => {
      client.setCollectionResponse([{ UserName: "russell" }]);

      await collectionService(true).query().execute();

      expect(client.concurrency.store.size).toBe(0);
    });

    test("a row missing its key contributes nothing", async () => {
      client.setCollectionResponse([{ "@odata.etag": 'W/"1"' }]);

      await collectionService(true).query().execute();

      expect(client.concurrency.store.size).toBe(0);
    });

    test("create needs no ETag - the entity does not exist yet", async () => {
      const created = collectionService(true).create({
        userName: "russell",
        age: "45",
        favFeature: undefined!,
        features: [],
      });

      await expect(created.execute()).resolves.toBeDefined();
      expect(ifMatch()).toBeUndefined();
    });

    test("create stores the ETag of what it created", async () => {
      client.setModelResponse({ UserName: "russell", "@odata.etag": 'W/"1"' });

      await collectionService(true)
        .create({ userName: "russell", age: "45", favFeature: undefined!, features: [] })
        .execute();

      expect(client.concurrency.store.get(`${COLLECTION_PATH}('russell')`)).toBe('W/"1"');
    });

    test("a row is keyed by the primary key alone, even where the entity also declares an alternate one", async () => {
      // before entityKeyOf was fixed to always use the primary param set, this threw instead of storing
      // anything: it read the 2D params array as if it were flat
      client.setCollectionResponse([{ ID: 7, NAME: "russell", "@odata.etag": 'W/"1"' }]);

      const withAlternateKey = new TestCollectionServiceWithAlternateKey(client, BASE_URL, "Tests", {
        concurrencyControlled: true,
      });
      await withAlternateKey.query().execute();

      expect(client.concurrency.store.get(`${BASE_URL}/Tests(7)`)).toBe('W/"1"');
    });
  });
});
