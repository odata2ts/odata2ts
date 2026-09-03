import { HttpResponseModel } from "@odata2ts/http-client-api";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { RequestInfo, StreamServiceV4 } from "../../src/";
import { MockClient } from "../mock/MockClient";

describe("StreamService V4 Test", () => {
  const odataClient = new MockClient(false);
  const BASE_URL = "path/Audiobooks('1')";
  const NAME = "Sample";
  const EXPECTED_PATH = `${BASE_URL}/${NAME}`;
  const MIME_TYPE = "audio/mpeg";

  let service: StreamServiceV4;

  beforeEach(() => {
    service = new StreamServiceV4(odataClient, BASE_URL, NAME);
  });

  test("stream V4: base tests", () => {
    expect(service.getPath()).toBe(EXPECTED_PATH);
  });

  test("stream V4: get blob", async () => {
    const request = service.getBlob();
    const result = request.getInfo();

    expectTypeOf(result).toEqualTypeOf<RequestInfo>();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.data).toBeUndefined();
    expect(result.method).toBe("GET");
    // the JSON default headers must not be sent here: the response is binary
    expect(result.headers).toBeUndefined();

    const blob = new Blob(["audio"], { type: MIME_TYPE });
    odataClient.setBlobResponse(blob);
    const response = await request.execute();

    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastOperation).toBe("GET");
    expect(response.data).toBe(blob);
    expectTypeOf(response).toEqualTypeOf<HttpResponseModel<Blob | undefined>>();
  });

  test("stream V4: an empty stream answers 204, so no blob", async () => {
    // The server distinguishes "exists, but no content yet" from "not found"; a client deciding whether
    // to upload depends on it, so `undefined` must survive instead of becoming an error.
    const response = await service.getBlob().execute();

    expect(response.data).toBeNull();
    expectTypeOf(response).toEqualTypeOf<HttpResponseModel<Blob | undefined>>();
  });

  test("stream V4: update blob", async () => {
    const blob = new Blob(["audio"], { type: MIME_TYPE });
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

  test("stream V4: the MIME type can be overridden", async () => {
    const blob = new Blob(["audio"], { type: MIME_TYPE });

    await service.updateBlob(blob, "application/x-custom").execute();

    expect(odataClient.lastMimeType).toBe("application/x-custom");
  });

  test("stream V4: a blob without a type falls back to octet-stream", async () => {
    await service.updateBlob(new Blob(["audio"])).execute();

    expect(odataClient.lastMimeType).toBe("application/octet-stream");
  });

  test("stream V4: get stream", async () => {
    const request = service.getStream();
    const result = request.getInfo();

    expectTypeOf(result).toEqualTypeOf<RequestInfo>();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.data).toBeUndefined();
    expect(result.method).toBe("GET");
    // as with a blob: the JSON default headers must not be sent here
    expect(result.headers).toBeUndefined();

    const stream = new Blob(["audio"], { type: MIME_TYPE }).stream();
    odataClient.setStreamResponse(stream);
    const response = await request.execute();

    expect(odataClient.lastUrl).toBe(EXPECTED_PATH);
    expect(odataClient.lastOperation).toBe("GET");
    // the stream itself, not a buffered copy of it
    expect(response.data).toBe(stream);
    expectTypeOf(response).toEqualTypeOf<HttpResponseModel<ReadableStream | undefined>>();
  });

  test("stream V4: update stream", async () => {
    const stream = new Blob(["audio"], { type: MIME_TYPE }).stream();
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

  test("stream V4: a stream without a MIME type falls back to octet-stream", async () => {
    // unlike a blob a stream carries no type of its own, so there is nothing else to fall back to
    await service.updateStream(new Blob(["audio"], { type: MIME_TYPE }).stream()).execute();

    expect(odataClient.lastMimeType).toBe("application/octet-stream");
  });

  test("stream V4: delete blob", async () => {
    const request = service.deleteBlob();
    const result = request.getInfo();

    expectTypeOf(result).toEqualTypeOf<RequestInfo>();

    expect(result.url).toBe(EXPECTED_PATH);
    expect(result.data).toBeUndefined();
    expect(result.method).toBe("DELETE");

    expectTypeOf(await request.execute()).toEqualTypeOf<HttpResponseModel<undefined>>();
    expect(odataClient.lastOperation).toBe("DELETE");
  });
});
