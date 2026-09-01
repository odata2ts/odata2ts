import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { ODataResponseModel, RequestInfo, StreamServiceV2 } from "../../src/";
import { MockClient } from "../mock/MockClient";

describe("StreamService V2 Test", () => {
  const odataClient = new MockClient(true);
  const BASE_URL = "path/EBooks(guid'1')";
  const NAME = "$value";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;
  const MIME_TYPE = "application/epub+zip";

  let service: StreamServiceV2;

  beforeEach(() => {
    service = new StreamServiceV2(odataClient, BASE_URL, NAME);
  });

  test("stream V2: base tests", () => {
    expect(service.getPath()).toBe(EXPECTED_PATH);
  });

  test("stream V2: get blob", async () => {
    const request = service.getBlob();
    const result = request.getInfo();

    expectTypeOf(result).toEqualTypeOf<RequestInfo>();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.data).toBeUndefined();
    expect(result.method).toBe("GET");
    // the JSON default headers must not be sent here: the response is binary. V2's are the ones which
    // would ask for `application/json`, which the media resource is not
    expect(result.headers).toBeUndefined();

    const blob = new Blob(["epub"], { type: MIME_TYPE });
    odataClient.setBlobResponse(blob);
    const response = await request.execute();

    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastOperation).toBe("GET");
    expect(response.data).toBe(blob);
    expectTypeOf(response).toEqualTypeOf<ODataResponseModel<Blob | undefined>>();
  });

  test("stream V2: an empty media resource answers 204, so no blob", async () => {
    // The entity exists, its content does not - a client deciding whether to upload depends on the
    // distinction, so `undefined` must survive instead of becoming an error.
    const response = await service.getBlob().execute();

    expect(response.data).toBeNull();
    expectTypeOf(response).toEqualTypeOf<ODataResponseModel<Blob | undefined>>();
  });

  test("stream V2: update blob", async () => {
    const blob = new Blob(["epub"], { type: MIME_TYPE });
    const request = service.updateBlob(blob);
    const result = request.getInfo();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.method).toBe("PUT");
    // the blob itself, not a serialized version of it
    expect(result.data).toBe(blob);

    await request.execute();

    expect(odataClient.lastOperation).toBe("PUT");
    expect(odataClient.lastData).toBe(blob);
    expect(odataClient.lastMimeType).toBe(MIME_TYPE);
    expectTypeOf(request.getInfo()).toEqualTypeOf<RequestInfo<Blob>>();
  });

  test("stream V2: the MIME type can be overridden", async () => {
    const blob = new Blob(["epub"], { type: MIME_TYPE });

    await service.updateBlob(blob, "application/x-custom").execute();

    expect(odataClient.lastMimeType).toBe("application/x-custom");
  });

  test("stream V2: a blob without a type falls back to octet-stream", async () => {
    await service.updateBlob(new Blob(["epub"])).execute();

    expect(odataClient.lastMimeType).toBe("application/octet-stream");
  });

  test("stream V2: get stream", async () => {
    const stream = new Blob(["epub"], { type: MIME_TYPE }).stream();
    odataClient.setStreamResponse(stream);

    const response = await service.getStream().execute();

    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastOperation).toBe("GET");
    // the stream itself, not a buffered copy of it
    expect(response.data).toBe(stream);
    expectTypeOf(response).toEqualTypeOf<ODataResponseModel<ReadableStream | undefined>>();
  });

  test("stream V2: update stream", async () => {
    const stream = new Blob(["epub"], { type: MIME_TYPE }).stream();
    const request = service.updateStream(stream, MIME_TYPE);
    const result = request.getInfo();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.method).toBe("PUT");
    expect(result.data).toBe(stream);

    await request.execute();

    expect(odataClient.lastOperation).toBe("PUT");
    expect(odataClient.lastData).toBe(stream);
    expect(odataClient.lastMimeType).toBe(MIME_TYPE);
    expectTypeOf(request.getInfo()).toEqualTypeOf<RequestInfo<ReadableStream>>();
  });

  test("stream V2: a stream without a MIME type falls back to octet-stream", async () => {
    // unlike a blob a stream carries no type of its own, so there is nothing else to fall back to
    await service.updateStream(new Blob(["epub"], { type: MIME_TYPE }).stream()).execute();

    expect(odataClient.lastMimeType).toBe("application/octet-stream");
  });

  test("stream V2: delete blob", async () => {
    const request = service.deleteBlob();
    const result = request.getInfo();

    expectTypeOf(result).toEqualTypeOf<RequestInfo>();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.data).toBeUndefined();
    expect(result.method).toBe("DELETE");

    expectTypeOf(await request.execute()).toEqualTypeOf<ODataResponseModel<undefined>>();
    expect(odataClient.lastOperation).toBe("DELETE");
  });
});
