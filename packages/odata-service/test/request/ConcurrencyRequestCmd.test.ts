import { HttpResponseModel, ODataHttpMethods } from "@odata2ts/http-client-api";
import { beforeEach, describe, expect, test } from "vitest";
import { ODataConcurrencyError } from "../../src/ODataConcurrencyError";
import { ConcurrencyOptions, RequestCmd, RequestCmdOptions } from "../../src/request/RequestCmd";
import { MockClient } from "../mock/MockClient";

const KEY = "/svc/Copies(1)";

class TestRequestCmd extends RequestCmd<any, any> {
  public getUrl(): string {
    return KEY;
  }
}

/**
 * The `If-Match` header the command handed to the client, if any. Headers travel as the request's own,
 * not as part of the caller's request config.
 */
function ifMatchOf(client: MockClient): string | undefined {
  return client.additionalHeaders?.["If-Match"];
}

describe("RequestCmd: optimistic concurrency", () => {
  let client: MockClient;

  function cmd(method: ODataHttpMethods, concurrency?: ConcurrencyOptions, options: RequestCmdOptions<any, any> = {}) {
    return new TestRequestCmd(client, method, method === ODataHttpMethods.Get ? undefined : { name: "x" }, {
      ...options,
      concurrency,
    });
  }

  /** The options an entity service hands over: one resource, its ETag stated as V4 control information. */
  function controlled(controlledFlag = true): ConcurrencyOptions {
    return {
      key: KEY,
      controlled: controlledFlag,
      harvest: (data: any) => {
        const etag = data?.["@odata.etag"];
        return etag ? [[KEY, etag]] : [];
      },
    };
  }

  beforeEach(() => {
    client = new MockClient(false);
    client.responseStatus = 200;
    client.responseHeaders = {};
    client.requestCount = 0;
  });

  describe("sending If-Match", () => {
    test("a write to a controlled resource sends the stored ETag", async () => {
      client.concurrency.set(KEY, 'W/"1"');

      await cmd(ODataHttpMethods.Patch, controlled()).execute();

      expect(ifMatchOf(client)).toBe('W/"1"');
    });

    test("a write with nothing stored throws, and sends no request at all", async () => {
      await expect(cmd(ODataHttpMethods.Patch, controlled()).execute()).rejects.toThrow(ODataConcurrencyError);

      expect(client.requestCount).toBe(0);
    });

    test("the error names the resource", async () => {
      await expect(cmd(ODataHttpMethods.Delete, controlled()).execute()).rejects.toThrow(KEY);
    });

    test("blind writes turn an unknown ETag into a star", async () => {
      client.concurrency.blindWrites = true;

      await cmd(ODataHttpMethods.Patch, controlled()).execute();

      expect(ifMatchOf(client)).toBe("*");
      expect(client.requestCount).toBe(1);
    });

    test("a write to an uncontrolled resource sends no If-Match", async () => {
      client.concurrency.set(KEY, 'W/"1"');

      await cmd(ODataHttpMethods.Patch, controlled(false)).execute();

      expect(ifMatchOf(client)).toBeUndefined();
    });

    test("a command without concurrency options is untouched", async () => {
      client.concurrency.set(KEY, 'W/"1"');

      await cmd(ODataHttpMethods.Patch).execute();

      expect(ifMatchOf(client)).toBeUndefined();
      expect(client.requestCount).toBe(1);
    });

    test("a read never sends If-Match, controlled or not", async () => {
      client.concurrency.set(KEY, 'W/"1"');

      await cmd(ODataHttpMethods.Get, controlled()).execute();

      expect(ifMatchOf(client)).toBeUndefined();
    });

    test("a read on a controlled resource with nothing stored does not throw", async () => {
      await expect(cmd(ODataHttpMethods.Get, controlled()).execute()).resolves.toBeDefined();
    });

    test("the header joins the ones the command already carries", async () => {
      client.concurrency.set(KEY, 'W/"1"');

      await cmd(ODataHttpMethods.Patch, controlled(), { headers: { Accept: "application/json" } }).execute();

      expect(client.additionalHeaders).toStrictEqual({ Accept: "application/json", "If-Match": 'W/"1"' });
    });
  });

  describe("harvesting", () => {
    test("a read stores the ETag from the response header", async () => {
      client.responseHeaders = { etag: 'W/"5"' };

      await cmd(ODataHttpMethods.Get, controlled()).execute();

      expect(client.concurrency.store.get(KEY)).toBe('W/"5"');
    });

    test("a read stores what harvest finds in the body", async () => {
      client.setModelResponse({ name: "x", "@odata.etag": 'W/"5"' });

      await cmd(ODataHttpMethods.Get, controlled()).execute();

      expect(client.concurrency.store.get(KEY)).toBe('W/"5"');
    });

    test("harvest may yield several entries, as a collection read does", async () => {
      client.setModelResponse({ ignored: true });
      const perRow: ConcurrencyOptions = {
        key: "/svc/Copies",
        controlled: false,
        harvest: () => [
          ["/svc/Copies(1)", 'W/"1"'],
          ["/svc/Copies(2)", 'W/"2"'],
        ],
      };

      await cmd(ODataHttpMethods.Get, perRow).execute();

      expect(client.concurrency.store.get("/svc/Copies(1)")).toBe('W/"1"');
      expect(client.concurrency.store.get("/svc/Copies(2)")).toBe('W/"2"');
    });

    test("a response stating no ETag stores nothing", async () => {
      client.setModelResponse({ name: "x" });

      await cmd(ODataHttpMethods.Get, controlled()).execute();

      expect(client.concurrency.store.has(KEY)).toBe(false);
    });
  });

  describe("keeping the store in step after a write", () => {
    test("a 204 without an ETag header evicts the stale one", async () => {
      client.concurrency.set(KEY, 'W/"1"');
      client.responseStatus = 204;

      await cmd(ODataHttpMethods.Patch, controlled()).execute();

      expect(client.concurrency.store.has(KEY)).toBe(false);
    });

    test("a write handing back a new ETag stores it", async () => {
      client.concurrency.set(KEY, 'W/"1"');
      client.responseHeaders = { etag: 'W/"7"' };

      await cmd(ODataHttpMethods.Patch, controlled()).execute();

      expect(client.concurrency.store.get(KEY)).toBe('W/"7"');
    });

    test("a write answering with the entity stores the ETag from its body", async () => {
      client.concurrency.set(KEY, 'W/"1"');
      client.setModelResponse({ name: "x", "@odata.etag": 'W/"7"' });

      await cmd(ODataHttpMethods.Patch, controlled()).execute();

      expect(client.concurrency.store.get(KEY)).toBe('W/"7"');
    });

    test("a delete evicts even where the response carries an ETag", async () => {
      client.concurrency.set(KEY, 'W/"1"');
      client.responseHeaders = { etag: 'W/"7"' };

      await cmd(ODataHttpMethods.Delete, controlled()).execute();

      expect(client.concurrency.store.has(KEY)).toBe(false);
    });

    test("two writes without an intervening read: the second is refused", async () => {
      client.concurrency.set(KEY, 'W/"1"');
      client.responseStatus = 204;
      await cmd(ODataHttpMethods.Patch, controlled()).execute();

      await expect(cmd(ODataHttpMethods.Patch, controlled()).execute()).rejects.toThrow(ODataConcurrencyError);
    });

    test("an uncontrolled write still keeps the store honest", async () => {
      client.concurrency.set(KEY, 'W/"1"');
      client.responseStatus = 204;

      await cmd(ODataHttpMethods.Patch, controlled(false)).execute();

      expect(client.concurrency.store.has(KEY)).toBe(false);
    });
  });

  describe("a client without concurrency support", () => {
    /** An older or hand-written client satisfies the contract without the optional member. */
    function clientWithoutStore() {
      const bare = new MockClient(false);
      delete (bare as unknown as { concurrency?: unknown }).concurrency;
      return bare;
    }

    test("a controlled write is refused rather than sent unprotected", async () => {
      const bare = clientWithoutStore();
      client = bare;

      await expect(cmd(ODataHttpMethods.Patch, controlled()).execute()).rejects.toThrow(ODataConcurrencyError);
      expect(bare.requestCount).toBe(0);
    });

    test("an uncontrolled request goes through untouched", async () => {
      const bare = clientWithoutStore();
      client = bare;

      await expect(cmd(ODataHttpMethods.Patch, controlled(false)).execute()).resolves.toBeDefined();
    });
  });

  describe("harvest runs on the converted response", () => {
    test("the mapped property names are what harvest sees", async () => {
      // the response converter renames a property; harvest must run afterwards, since a collection
      // service builds its keys from the user-facing names its QId knows
      client.setModelResponse({ odataName: "x", "@odata.etag": 'W/"5"' });
      const converting: RequestCmdOptions<any, any> = {
        mainResponseConverter: {
          convert: (response: HttpResponseModel<any>) => {
            response.data = { mappedName: response.data.odataName, "@odata.etag": response.data["@odata.etag"] };
            return response;
          },
        } as any,
      };
      const seen: Array<any> = [];
      const spying: ConcurrencyOptions = {
        key: KEY,
        controlled: false,
        harvest: (data: any) => {
          seen.push(data);
          return [];
        },
      };

      await cmd(ODataHttpMethods.Get, spying, converting).execute();

      expect(seen).toHaveLength(1);
      expect(seen[0]).toHaveProperty("mappedName", "x");
    });
  });
});
