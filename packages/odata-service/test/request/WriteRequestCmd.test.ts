import { ODataHttpMethods } from "@odata2ts/http-client-api";
import { QueryObject } from "@odata2ts/odata-query-objects";
import { beforeEach, describe, expect, test } from "vitest";
import { ConcurrencyOptions } from "../../src/request/RequestCmd";
import { UrlBuilderWriteRequestCmdV2 } from "../../src/request/UrlBuilderWriteRequestCmdV2";
import { UrlBuilderWriteRequestCmdV4 } from "../../src/request/UrlBuilderWriteRequestCmdV4";
import { UrlWriteRequestCmd } from "../../src/request/UrlWriteRequestCmd";
import { MockClient } from "../mock/MockClient";

const KEY = "/svc/Copies(1)";

class TestQObject extends QueryObject {}

function ifMatchOf(client: MockClient): string | undefined {
  return client.additionalHeaders?.["If-Match"];
}

function controlled(controlledFlag = true): ConcurrencyOptions {
  return { key: KEY, controlled: controlledFlag };
}

/**
 * A minimal stand-in for a query builder: the write commands only ever `build()` it and `clone()` it.
 */
function mockBuilder(url: string): any {
  return { build: () => url, clone: () => mockBuilder(url) };
}

describe("Write request commands", () => {
  let client: MockClient;

  beforeEach(() => {
    client = new MockClient(false);
    client.requestCount = 0;
  });

  /**
   * The three classes differ only in what they extend and how they clone; the two controls behave
   * identically on all of them, which is what this table proves.
   */
  const variants = [
    {
      name: "UrlWriteRequestCmd",
      create: (concurrency?: ConcurrencyOptions) =>
        new UrlWriteRequestCmd<any, any>(client, ODataHttpMethods.Patch, KEY, { name: "x" }, { concurrency }),
      clone: (cmd: any) => cmd.withUrl("/svc/Copies(2)"),
      cloneType: UrlWriteRequestCmd,
    },
    {
      name: "UrlBuilderWriteRequestCmdV4",
      create: (concurrency?: ConcurrencyOptions) =>
        new UrlBuilderWriteRequestCmdV4<any, any, any, any>(
          client,
          ODataHttpMethods.Patch,
          mockBuilder(KEY),
          new TestQObject(),
          { name: "x" },
          { concurrency },
        ),
      clone: (cmd: any) => cmd.addToQuery((builder: any) => builder),
      cloneType: UrlBuilderWriteRequestCmdV4,
    },
    {
      name: "UrlBuilderWriteRequestCmdV2",
      create: (concurrency?: ConcurrencyOptions) =>
        new UrlBuilderWriteRequestCmdV2<any, any, any, any>(
          client,
          ODataHttpMethods.Patch,
          mockBuilder(KEY),
          new TestQObject(),
          { name: "x" },
          { concurrency },
        ),
      clone: (cmd: any) => cmd.addToQuery((builder: any) => builder),
      cloneType: UrlBuilderWriteRequestCmdV2,
    },
  ];

  variants.forEach(({ name, create, clone, cloneType }) => {
    describe(name, () => {
      test("withETag sends exactly the value it was given", async () => {
        await create(controlled()).withETag('W/"5"').execute();

        expect(ifMatchOf(client)).toBe('W/"5"');
      });

      test("withETag needs no store at all", async () => {
        // nothing was ever read; the application states the ETag from its own state
        expect(client.concurrency.store.size).toBe(0);

        await create(controlled()).withETag('W/"5"').execute();

        expect(ifMatchOf(client)).toBe('W/"5"');
        expect(client.requestCount).toBe(1);
      });

      test("ignoreETag sends a star", async () => {
        await create(controlled()).ignoreETag().execute();

        expect(ifMatchOf(client)).toBe("*");
      });

      test("withETag wins over what the store holds", async () => {
        client.concurrency.set(KEY, 'W/"1"');

        await create(controlled()).withETag('W/"9"').execute();

        expect(ifMatchOf(client)).toBe('W/"9"');
      });

      test("a stated ETag travels even where the resource is not controlled", async () => {
        // the metadata says nothing is required here, but the caller decided otherwise
        await create(controlled(false)).withETag('W/"5"').execute();

        expect(ifMatchOf(client)).toBe('W/"5"');
      });

      test("both controls are chainable and the last one wins", async () => {
        await create(controlled()).withETag('W/"5"').ignoreETag().execute();

        expect(ifMatchOf(client)).toBe("*");
      });

      test("cloning yields a write command, not its read-only base", () => {
        const cloned = clone(create(controlled()));

        expect(cloned).toBeInstanceOf(cloneType);
      });

      test("cloning carries the stated ETag along", async () => {
        const original = create(controlled()).withETag('W/"5"');

        await clone(original).execute();

        expect(ifMatchOf(client)).toBe('W/"5"');
      });

      test("cloning carries an ignore along", async () => {
        const original = create(controlled()).ignoreETag();

        await clone(original).execute();

        expect(ifMatchOf(client)).toBe("*");
      });

      test("without either control the store still decides", async () => {
        client.concurrency.set(KEY, 'W/"1"');

        await create(controlled()).execute();

        expect(ifMatchOf(client)).toBe('W/"1"');
      });
    });
  });
});
