import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { describe, expect, expectTypeOf, test } from "vitest";
import { BatchAddOptions, JsonBatchBuilder, MultipartBatchBuilder } from "../../src/batch/BatchBuilder";
import { ODataService } from "../../src/ODataService";
import { ODataServiceOptions } from "../../src/ODataServiceOptions";
import { BlobGetRequestCmd } from "../../src/request/BlobGetRequestCmd";
import { RequestCmd, RequestCmdOptions } from "../../src/request/RequestCmd";
import { PersonModelCollectionService } from "../fixture/v4/PersonModelService";
import { MockClient } from "../mock/MockClient";

const BASE = "http://example.com/odata";

/** A minimal concrete command with a fixed url and, where useful, a response converter. */
class TestCmd<F, D = undefined> extends RequestCmd<F, D, F> {
  private readonly __url: string;

  constructor(
    client: ODataHttpClient,
    method: ODataHttpMethods,
    url: string,
    data?: D,
    options?: RequestCmdOptions<F, D>,
  ) {
    super(client, method, data, options);
    this.__url = url;
  }

  public getUrl(): string {
    return this.__url;
  }
}

function makeService(options?: ODataServiceOptions & { odataVersion?: "2.0" }) {
  const client = new MockClient(false);
  const service = new ODataService(client, BASE, options);
  return { client, service };
}

type Person = { id: number; name: string };

describe("BatchBuilder via ODataService.batch()", () => {
  test("assigns wire ids in the order commands are added", async () => {
    const { client, service } = makeService();
    client.batchResponse = { responses: [], resolvedBy: "id" };

    await service
      .batch()
      .add(new TestCmd(client, ODataHttpMethods.Get, BASE + "/A"))
      .execute();

    expect(client.lastBatchBody?.requests.map((request) => request.id)).toEqual(["1"]);

    client.batchResponse = { responses: [], resolvedBy: "id" };
    await service
      .batch()
      .add(new TestCmd(client, ODataHttpMethods.Get, BASE + "/A"))
      .add(new TestCmd(client, ODataHttpMethods.Post, BASE + "/B"))
      .execute();

    expect(client.lastBatchBody?.requests.map((request) => request.id)).toEqual(["1", "2"]);
  });

  test("strips the service base path off every sub-request url, keeps the query", async () => {
    const { client, service } = makeService();
    client.batchResponse = { responses: [], resolvedBy: "id" };

    await service
      .batch()
      .add(new TestCmd(client, ODataHttpMethods.Get, BASE + "/People?$top=1&$filter=Active eq true"))
      .add(new TestCmd(client, ODataHttpMethods.Patch, BASE + "/People(1)", { name: "n" }))
      .execute();

    const { requests } = client.lastBatchBody!;
    expect(requests[0].url).toBe("People?$top=1&$filter=Active eq true");
    expect(requests[1].url).toBe("People(1)");
    expect(requests[0].method).toBe("get");
    expect(requests[1].method).toBe("patch");
    expect(requests[1].body).toStrictEqual({ name: "n" });
  });

  test("strips the base path off a byRef ($<id>) address, leaving the reference bare in the batch", () => {
    const { client } = makeService();
    const collection = new PersonModelCollectionService(client, BASE, "People");
    const builder = new MultipartBatchBuilder(client, BASE);

    builder.add(collection.byRef(1).query());

    const { requests } = builder.getRequestInfo();
    expect(requests[0].url).toBe("$1");
    expect(requests[0].method).toBe("get");
  });

  test("posts the batch to the service root's $batch endpoint", async () => {
    const { client, service } = makeService();
    client.batchResponse = { responses: [], resolvedBy: "id" };

    await service
      .batch()
      .add(new TestCmd(client, ODataHttpMethods.Get, BASE + "/A"))
      .execute();

    expect(client.lastBatchUrl).toBe(BASE + "/$batch");
  });

  test("frames commands in an atomicity group, and only those", async () => {
    const { client, service } = makeService();
    client.batchResponse = { responses: [], resolvedBy: "id" };
    const before = new TestCmd(client, ODataHttpMethods.Get, BASE + "/A");
    const first = new TestCmd(client, ODataHttpMethods.Get, BASE + "/B");
    const second = new TestCmd(client, ODataHttpMethods.Post, BASE + "/C", { name: "n" });
    const after = new TestCmd(client, ODataHttpMethods.Get, BASE + "/D");

    await service.batch().add(before).startGroup("g").add(first).add(second).endGroup().add(after).execute();

    const { requests } = client.lastBatchBody!;
    expect(requests[0].atomicityGroup).toBeUndefined();
    expect(requests[1].atomicityGroup).toBe("g");
    expect(requests[2].atomicityGroup).toBe("g");
    expect(requests[3].atomicityGroup).toBeUndefined();
  });

  test("the same command added twice yields two slots that each answer independently", async () => {
    const { client, service } = makeService();
    client.batchResponse = {
      responses: [
        { id: "1", status: 200, body: { id: 1 } },
        { id: "2", status: 200, body: { id: 2 } },
      ],
      resolvedBy: "id",
    };
    const cmd = new TestCmd<{ id: number }, { name: string }>(client, ODataHttpMethods.Post, BASE + "/People", {
      name: "n",
    });

    const [first, second] = await service.batch().add(cmd).add(cmd).execute();

    expect(first).toMatchObject({ status: 200, data: { id: 1 } });
    expect(second).toMatchObject({ status: 200, data: { id: 2 } });
    expect(client.lastBatchBody?.requests.map((request) => request.url)).toStrictEqual(["People", "People"]);
  });

  test("refuses a blob request, which cannot be carried by a batch", () => {
    const { client, service } = makeService();
    const cmd = new BlobGetRequestCmd(client, BASE + "/People(1)/$value");

    expect(() => service.batch().add(cmd)).toThrow(/blob or stream/);
  });

  test("throws where startGroup is called while a group is open, or endGroup with none open", () => {
    const { client, service } = makeService();
    const cmd = new TestCmd(client, ODataHttpMethods.Get, BASE + "/A");

    expect(() => service.batch().startGroup("g1").startGroup("g2")).toThrow(/already open/);
    expect(() => service.batch().endGroup()).toThrow(/no atomicity group open/);
    expect(() => service.batch().startGroup("g1").add(cmd).endGroup()).not.toThrow();
  });

  test("a V2 service's batch is always a multipart builder", async () => {
    const { client, service } = makeService({ odataVersion: "2.0" });
    client.batchResponse = { responses: [{ id: "1", status: 200, body: [] }], resolvedBy: "id" };

    const [slot] = await service
      .batch()
      .add(new TestCmd(client, ODataHttpMethods.Get, BASE + "/A"))
      .execute();

    expect(slot.status).toBe(200);
    expect(client.lastBatchOptions?.format).toBe("multipart");
  });

  test("throws rather than build a request where the feature is disabled", () => {
    const { service } = makeService({ batch: { disabled: true } });

    expect(() => service.batch()).toThrow(/disabled/);
  });

  test("the wire format is fixed by the builder: a multipart builder goes out as multipart", async () => {
    const { client } = makeService();
    client.batchResponse = { responses: [{ id: "1", status: 200, body: null }], resolvedBy: "id" };

    await new MultipartBatchBuilder(client, BASE).add(new TestCmd(client, ODataHttpMethods.Get, BASE + "/A")).execute();

    expect(client.lastBatchOptions?.format).toBe("multipart");
  });

  test("the wire format is fixed by the builder: a JSON builder goes out as json", async () => {
    const { client } = makeService();
    client.batchResponse = { responses: [{ id: "1", status: 200, body: null }], resolvedBy: "id" };

    await new JsonBatchBuilder(client, BASE)
      .add(new TestCmd(client, ODataHttpMethods.Get, BASE + "/A"))
      .execute({ continueOnError: true });

    expect(client.lastBatchOptions).toMatchObject({ format: "json", continueOnError: true });
  });

  describe("slot outcomes", () => {
    test("a 2xx sub-request is returned as-is, converted", async () => {
      const { client, service } = makeService();
      client.batchResponse = { responses: [{ id: "1", status: 200, body: [{ id: 1, name: "a" }] }], resolvedBy: "id" };

      const [slot] = await service
        .batch()
        .add(new TestCmd<Person[]>(client, ODataHttpMethods.Get, BASE + "/People"))
        .execute();

      expect(slot.status).toBe(200);
      expect(slot.data).toStrictEqual([{ id: 1, name: "a" }]);
    });

    test("a non-2xx sub-request is returned unconverted, with the error document as data", async () => {
      const { client, service } = makeService();
      const error = { error: { code: "X" } };
      client.batchResponse = { responses: [{ id: "1", status: 400, body: error }], resolvedBy: "id" };

      const [slot] = await service
        .batch()
        .add(new TestCmd<Person[]>(client, ODataHttpMethods.Get, BASE + "/People"))
        .execute();

      expect(slot.status).toBe(400);
      expect(slot.data).toStrictEqual(error);
    });

    test("a 424 is kept as a 424", async () => {
      const { client, service } = makeService();
      client.batchResponse = { responses: [{ id: "1", status: 424, body: undefined }], resolvedBy: "id" };

      const [slot] = await service
        .batch()
        .add(new TestCmd<Person[]>(client, ODataHttpMethods.Get, BASE + "/People"))
        .execute();

      expect(slot.status).toBe(424);
      expect(slot.data).toBeUndefined();
    });

    test("a 2xx slot whose atomicity group failed is reported as Rolled Back", async () => {
      const { client, service } = makeService();
      client.batchResponse = {
        responses: [
          { id: "1", status: 200, atomicityGroup: "g", body: { ok: true } },
          { id: "2", status: 400, atomicityGroup: "g", body: { error: "bad" } },
        ],
        resolvedBy: "id",
      };

      const [first, second] = await service
        .batch()
        .startGroup("g")
        .add(new TestCmd(client, ODataHttpMethods.Get, BASE + "/A"))
        .add(new TestCmd(client, ODataHttpMethods.Post, BASE + "/B", { name: "n" }))
        .endGroup()
        .execute();

      expect(first).toMatchObject({ status: 0, statusText: "Rolled Back", data: undefined });
      expect(second.status).toBe(400);
    });

    test("a slot with no answer at all is Never Ran", async () => {
      const { client, service } = makeService();
      client.batchResponse = { responses: [{ id: "1", status: 200, body: "done" }], resolvedBy: "id" };

      const [first, second] = await service
        .batch()
        .add(new TestCmd(client, ODataHttpMethods.Get, BASE + "/A"))
        .add(new TestCmd(client, ODataHttpMethods.Get, BASE + "/B"))
        .execute();

      expect(first.status).toBe(200);
      expect(second).toMatchObject({ status: 0, statusText: "Never Ran", data: undefined });
    });

    test("each slot is run through that command's own response converters", async () => {
      const { client, service } = makeService();
      const cmd = new TestCmd<Person[]>(client, ODataHttpMethods.Get, BASE + "/People").appendResponseConverter(
        (response) => ({
          ...response,
          data: response.data.map((person) => ({ ...person, name: person.name.toUpperCase() })),
        }),
      );
      client.batchResponse = { responses: [{ id: "1", status: 200, body: [{ id: 1, name: "a" }] }], resolvedBy: "id" };

      const [slot] = await service.batch().add(cmd).execute();

      expect(slot.data).toStrictEqual([{ id: 1, name: "A" }]);
    });
  });

  describe("dependsOn (JSON builder)", () => {
    test("resolves dependencies to the wire ids they name", () => {
      const { client } = makeService();
      const first = new TestCmd(client, ODataHttpMethods.Post, BASE + "/Members", { name: "n" });
      const second = new TestCmd(client, ODataHttpMethods.Get, BASE + "/Members(1)");

      const { requests } = new JsonBatchBuilder(client, BASE)
        .add(first)
        .add(second, { dependsOn: [1] })
        .getRequestInfo();

      expect(requests[1].dependsOn).toStrictEqual(["1"]);
    });

    test("allows depending on any request added before it", () => {
      const { client } = makeService();

      const { requests } = new JsonBatchBuilder(client, BASE)
        .add(new TestCmd(client, ODataHttpMethods.Get, BASE + "/A"))
        .add(new TestCmd(client, ODataHttpMethods.Get, BASE + "/B"))
        .add(new TestCmd(client, ODataHttpMethods.Get, BASE + "/C"), { dependsOn: [1, 2] })
        .getRequestInfo();

      expect(requests[2].dependsOn).toStrictEqual(["1", "2"]);
    });

    test("refuses a forward reference to a request not yet added", () => {
      const { client } = makeService();

      expect(() =>
        new JsonBatchBuilder(client, BASE)
          .add(new TestCmd(client, ODataHttpMethods.Get, BASE + "/A"))
          .add(new TestCmd(client, ODataHttpMethods.Get, BASE + "/B"), { dependsOn: [3] }),
      ).toThrow(/added before it/);
    });

    test("refuses a dependency on the request's own id", () => {
      const { client } = makeService();

      expect(() =>
        new JsonBatchBuilder(client, BASE)
          .add(new TestCmd(client, ODataHttpMethods.Get, BASE + "/A"))
          .add(new TestCmd(client, ODataHttpMethods.Get, BASE + "/B"), { dependsOn: [2] }),
      ).toThrow(/added before it/);
    });
  });

  describe("factory-form add", () => {
    test("passes the factory the wire id the command is about to receive", async () => {
      const { client, service } = makeService();
      client.batchResponse = { responses: [], resolvedBy: "id" };
      const seen: number[] = [];

      await service
        .batch()
        .add(new TestCmd(client, ODataHttpMethods.Get, BASE + "/A"))
        .add((selfRef) => {
          seen.push(selfRef);
          return new TestCmd(client, ODataHttpMethods.Get, BASE + "/B");
        })
        .execute();

      expect(seen).toEqual([2]);
    });

    test("lets the factory address the preceding request with selfRef - 1", () => {
      const { client } = makeService();
      const collection = new PersonModelCollectionService(client, BASE, "People");
      const builder = new MultipartBatchBuilder(client, BASE);

      builder.add(collection.query()).add((selfRef) => collection.byRef(selfRef - 1).query());

      const { requests } = builder.getRequestInfo();
      expect(requests[0].url).toBe("People");
      expect(requests[1].url).toBe("$1");
    });

    test("resolves a factory-form dependsOn callback against the command's own id", () => {
      const { client } = makeService();
      const collection = new PersonModelCollectionService(client, BASE, "People");
      const builder = new JsonBatchBuilder(client, BASE);

      builder
        .add(collection.query())
        .add((selfRef) => collection.byRef(selfRef - 1).query(), { dependsOn: (selfRef) => [selfRef - 1] });

      const { requests } = builder.getRequestInfo();
      expect(requests[1].dependsOn).toStrictEqual(["1"]);
    });
  });

  describe("typing", () => {
    test("the result tuple is element-for-element the commands' own response types", async () => {
      const { client, service } = makeService();
      client.batchResponse = { responses: [{ id: "1", status: 200, body: [] }], resolvedBy: "id" };

      const people = new TestCmd<Person[]>(client, ODataHttpMethods.Get, BASE + "/People");
      const created = new TestCmd<{ id: number }, { name: string }>(client, ODataHttpMethods.Post, BASE + "/People", {
        name: "n",
      });

      const [p, c] = await service.batch().add(people).add(created).execute();

      expectTypeOf(p.data).toEqualTypeOf<Person[] | undefined>();
      expectTypeOf(c.data).toEqualTypeOf<{ id: number } | undefined>();
    });

    test("the tuple's element types survive startGroup and endGroup", async () => {
      const { client, service } = makeService();
      client.batchResponse = {
        responses: [
          { id: "1", status: 200, body: [] },
          { id: "2", status: 201, body: { id: 1 } },
        ],
        resolvedBy: "id",
      };

      const people = new TestCmd<Person[]>(client, ODataHttpMethods.Get, BASE + "/People");
      const created = new TestCmd<{ id: number }, { name: string }>(client, ODataHttpMethods.Post, BASE + "/People", {
        name: "n",
      });

      const [g, c] = await service.batch().add(people).startGroup("g").add(created).endGroup().execute();

      expectTypeOf(g.data).toEqualTypeOf<Person[] | undefined>();
      expectTypeOf(c.data).toEqualTypeOf<{ id: number } | undefined>();
    });

    test("the builder type is the wire format: the default service is multipart, a JSON service is json", () => {
      const { client, service } = makeService();
      expectTypeOf(service.batch()).toEqualTypeOf<MultipartBatchBuilder<[]>>();

      const jsonService = new ODataService<"4.0", JsonBatchBuilder<[]>>(client, BASE);
      expectTypeOf(jsonService.batch()).toEqualTypeOf<JsonBatchBuilder<[]>>();
    });

    test("dependsOn is only in the type of the JSON builder's add", () => {
      const { client, service } = makeService();
      expectTypeOf(service.batch().add).parameter(1).toBeUndefined();

      const jsonService = new ODataService<"4.0", JsonBatchBuilder<[]>>(client, BASE);
      expectTypeOf(jsonService.batch().add).parameter(1).toEqualTypeOf<BatchAddOptions | undefined>();
    });
  });
});
