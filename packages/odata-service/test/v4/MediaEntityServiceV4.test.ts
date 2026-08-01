import { HttpResponseModel } from "@odata2ts/http-client-api";
import { beforeEach, describe, expect, expectTypeOf, test } from "vitest";
import { MediaEntityServiceV4 } from "../../src/";
import { EditablePersonModel, PersonModel } from "../fixture/PersonModel";
import { QPersonV4 } from "../fixture/v4/QPersonV4";
import { MockClient } from "../mock/MockClient";

describe("MediaEntityService V4 Test", () => {
  const odataClient = new MockClient(false);
  const BASE_URL = "path";
  const NAME = "EBooks('1')";
  const ENTITY_PATH = `${BASE_URL}/${NAME}`;
  const CONTENT_PATH = `${ENTITY_PATH}/$value`;

  let service: MediaEntityServiceV4<MockClient, PersonModel, EditablePersonModel, QPersonV4>;

  beforeEach(() => {
    service = new MediaEntityServiceV4<MockClient, PersonModel, EditablePersonModel, QPersonV4>(
      odataClient,
      BASE_URL,
      NAME,
      new QPersonV4(),
    );
  });

  test("mediaEntity V4: the content lives at $value", () => {
    expect(service.getPath()).toBe(ENTITY_PATH);
    expect(service.content().getPath()).toBe(CONTENT_PATH);
  });

  test("mediaEntity V4: read the content", async () => {
    const blob = new Blob(["epub"], { type: "application/epub+zip" });
    odataClient.setBlobResponse(blob);

    const response = await service.getBlob().execute();

    expect(odataClient.lastUrl).toBe(CONTENT_PATH);
    expect(odataClient.lastOperation).toBe("GET");
    expect(response.data).toBe(blob);
    expectTypeOf(response).toEqualTypeOf<HttpResponseModel<Blob | undefined>>();
  });

  test("mediaEntity V4: write the content", async () => {
    const blob = new Blob(["epub"], { type: "application/epub+zip" });

    await service.updateBlob(blob).execute();

    expect(odataClient.lastUrl).toBe(CONTENT_PATH);
    expect(odataClient.lastOperation).toBe("PUT");
    expect(odataClient.lastData).toBe(blob);
    expect(odataClient.lastMimeType).toBe("application/epub+zip");
  });

  test("mediaEntity V4: delete the content", async () => {
    await service.deleteBlob().execute();

    expect(odataClient.lastUrl).toBe(CONTENT_PATH);
    expect(odataClient.lastOperation).toBe("DELETE");
  });

  test("mediaEntity V4: a subtype service drops the type cast segment", async () => {
    // `$value` addresses the entity, which its key already identifies - servers answer 404 for the
    // combination. A stream *property* declared on the derived type is the opposite case: it exists only
    // behind the cast, which is why the generated property getter keeps the segment.
    const subtypeService = new MediaEntityServiceV4<MockClient, PersonModel, EditablePersonModel, QPersonV4>(
      odataClient,
      ENTITY_PATH,
      "Library.Catalog.EBook",
      new QPersonV4(),
      { subtype: true },
    );

    expect(subtypeService.content().getPath()).toBe(CONTENT_PATH);
    // ... unless it is explicitly asked for
    expect(subtypeService.content({ withCastPathSegment: true }).getPath()).toBe(
      `${ENTITY_PATH}/Library.Catalog.EBook/$value`,
    );
  });

  test("mediaEntity V4: the entity itself is still addressed without $value", async () => {
    // The decisive one: a media entity keeps ordinary properties, read and written as JSON. If the
    // content path leaked into the entity requests, every regular operation would address the bytes.
    await service.patch({ userName: "tester" }).execute();

    expect(odataClient.lastUrl).toBe(ENTITY_PATH);
    expect(odataClient.lastOperation).toBe("PATCH");
    expect(odataClient.lastData).toStrictEqual({ UserName: "tester" });

    expect(service.query().getUrl()).toBe(ENTITY_PATH);
  });
});
