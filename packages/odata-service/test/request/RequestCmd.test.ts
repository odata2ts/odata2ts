import { ODataHttpMethods } from "@odata2ts/http-client-api";
import { describe, expect, test } from "vitest";
import { RequestCmd } from "../../src/request/RequestCmd";
import { MockClient, MockRequestConfig } from "../mock/MockClient";

class TestRequestCmd extends RequestCmd<void> {
  public getUrl(): string {
    return "test/ing";
  }
}

describe("RequestCmd tests", () => {
  // Note: RequestCmd.getInfoConverted() and the private convertResponse() each guard against a missing
  // converter chain (`if (!converter)`). Both requestConverter and responseConverter are private readonly
  // fields that the constructor always sets to a real RequestConverterChain/ResponseConverterChain instance,
  // so those guards are structurally unreachable through any legitimate construction path and are not tested here.

  test("constructor without options argument", () => {
    const client = new MockClient(false);
    const candidate = new TestRequestCmd(client, ODataHttpMethods.Get);

    expect(candidate.getInfo()).toMatchObject({
      method: ODataHttpMethods.Get,
      url: "test/ing",
      headers: undefined,
      data: undefined,
    });
    expect(candidate.getInfoConverted()).toStrictEqual(candidate.getInfo());
  });

  /**
   * The command is not generic over the HTTP client, so `execute` knows nothing about the config type of
   * the client it was handed. What every client understands - headers and URL params - is the default;
   * anything a specific client adds on top is opted into by naming its config type at the call site.
   *
   * These assertions are about typing, hence checked by `test-compile` rather than at runtime.
   */
  describe("request config typing", () => {
    test("no config at all", async () => {
      const client = new MockClient(false);
      await new TestRequestCmd(client, ODataHttpMethods.Get).execute();

      expect(client.lastRequestConfig).toBeUndefined();
    });

    test("the common config needs no type argument", async () => {
      const client = new MockClient(false);
      await new TestRequestCmd(client, ODataHttpMethods.Get).execute({
        headers: { add: "plus" },
        params: { $count: true },
      });

      expect(client.lastRequestConfig).toStrictEqual({ headers: { add: "plus" }, params: { $count: true } });
    });

    test("a client specific field requires its config type", async () => {
      const client = new MockClient(false);
      const candidate = new TestRequestCmd(client, ODataHttpMethods.Get);

      // @ts-expect-error: `test` belongs to MockRequestConfig, which the default does not cover
      await candidate.execute({ test: "ing" });

      await candidate.execute<MockRequestConfig>({ headers: { add: "plus" }, test: "ing" });

      expect(client.lastRequestConfig).toStrictEqual({ headers: { add: "plus" }, test: "ing" });
    });
  });
});
