import { HttpResponseModel } from "@odata2ts/http-client-api";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { PersonModelV2MediaService } from "../fixture/v2/PersonModelV2Service";
import { MockClient } from "../mock/MockClient";

describe("MediaEntityService V2 Test", () => {
  const odataClient = new MockClient(true);
  const BASE_URL = "path";
  const NAME = "EBooks(guid'1')";
  const ENTITY_PATH = `${BASE_URL}/${NAME}`;
  const CONTENT_PATH = `${ENTITY_PATH}/$value`;

  let service: PersonModelV2MediaService;

  beforeEach(() => {
    service = new PersonModelV2MediaService(odataClient, BASE_URL, NAME);
  });

  test("mediaEntity V2: the content lives at $value", () => {
    // What the entity advertises as `__metadata.media_src` - only that it can be built without asking
    expect(service.getPath()).toBe(ENTITY_PATH);
    expect(service.content().getPath()).toBe(CONTENT_PATH);
  });

  test("mediaEntity V2: read the content", async () => {
    const blob = new Blob(["epub"], { type: "application/epub+zip" });
    odataClient.setBlobResponse(blob);

    const response = await service.getBlob().execute();

    expect(odataClient.lastUrl).toBe(CONTENT_PATH);
    expect(odataClient.lastOperation).toBe("GET");
    expect(response.data).toBe(blob);
    expectTypeOf(response).toEqualTypeOf<HttpResponseModel<Blob | undefined>>();
  });

  test("mediaEntity V2: write the content", async () => {
    const blob = new Blob(["epub"], { type: "application/epub+zip" });

    await service.updateBlob(blob).execute();

    expect(odataClient.lastUrl).toBe(CONTENT_PATH);
    // PUT, not V2's MERGE-through-POST: that tunneling applies to entity updates, not to the raw content
    expect(odataClient.lastOperation).toBe("PUT");
    expect(odataClient.lastData).toBe(blob);
    expect(odataClient.lastMimeType).toBe("application/epub+zip");
  });

  test("mediaEntity V2: read the content as a stream", async () => {
    const stream = new Blob(["epub"]).stream();
    odataClient.setStreamResponse(stream);

    const response = await service.getStream().execute();

    expect(odataClient.lastUrl).toBe(CONTENT_PATH);
    expect(odataClient.lastOperation).toBe("GET");
    expect(response.data).toBe(stream);
    expectTypeOf(response).toEqualTypeOf<HttpResponseModel<ReadableStream | undefined>>();
  });

  test("mediaEntity V2: write the content from a stream", async () => {
    const stream = new Blob(["epub"]).stream();

    await service.updateStream(stream, "application/epub+zip").execute();

    expect(odataClient.lastUrl).toBe(CONTENT_PATH);
    expect(odataClient.lastOperation).toBe("PUT");
    expect(odataClient.lastData).toBe(stream);
    expect(odataClient.lastMimeType).toBe("application/epub+zip");
  });

  test("mediaEntity V2: delete the content", async () => {
    await service.deleteBlob().execute();

    expect(odataClient.lastUrl).toBe(CONTENT_PATH);
    expect(odataClient.lastOperation).toBe("DELETE");
  });

  test("mediaEntity V2: the entity itself is still addressed without $value", async () => {
    // The decisive one: a media link entry keeps ordinary properties, read and written as JSON. If the
    // content path leaked into the entity requests, every regular operation would address the bytes.
    await service.patch({ userName: "tester" }).execute();

    expect(odataClient.lastUrl).toBe(ENTITY_PATH);
    // V2 tunnels the partial update through POST
    expect(odataClient.lastOperation).toBe("POST");
    expect(odataClient.lastData).toStrictEqual({ UserName: "tester" });

    expect(service.query().getUrl()).toBe(ENTITY_PATH);
  });
});
