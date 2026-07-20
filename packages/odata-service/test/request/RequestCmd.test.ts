import { ODataHttpMethods } from "@odata2ts/http-client-api";
import { describe, expect, test } from "vitest";
import { RequestCmd } from "../../src/request/RequestCmd";
import { MockClient } from "../mock/MockClient";

class TestRequestCmd extends RequestCmd<MockClient, void> {
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
});
