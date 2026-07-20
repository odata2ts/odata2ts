import { beforeEach, describe, expect, test } from "vitest";
import { UrlGetRequestCmd } from "../../src";
import { MockClient } from "../mock/MockClient";

describe("UrlRequestCmd tests", () => {
  const DEFAULT_URL = "test/ing?x=y&zz=top";
  const DEFAULT_HEADERS = { "Content-Type": "application/json" };
  const CLIENT = new MockClient(false);

  let candidate: UrlGetRequestCmd<MockClient, string>;

  beforeEach(() => {
    candidate = new UrlGetRequestCmd(CLIENT, DEFAULT_URL, { headers: DEFAULT_HEADERS });
  });

  test("base info", () => {
    const expected = {
      method: "GET",
      url: DEFAULT_URL,
      headers: DEFAULT_HEADERS,
      data: undefined,
    };

    expect(candidate.getInfo()).toMatchObject(expected);
    expect(candidate.getInfoConverted()).toMatchObject(expected);
  });

  test("as POST request", () => {
    expect(candidate.asPostRequest().getInfoConverted()).toMatchObject({
      method: "POST",
      url: "test/ing/$query",
      headers: { "Content-Type": "text/plain" },
      data: "x=y&zz=top",
    });
  });

  test("as POST request: no-op when url has no query params", () => {
    const noQueryCandidate = new UrlGetRequestCmd(CLIENT, "test/ing");

    expect(noQueryCandidate.asPostRequest().getInfo()).toMatchObject({
      method: "GET",
      url: "test/ing",
    });
  });
});
