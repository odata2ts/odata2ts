import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataValueResponseV2 } from "@odata2ts/odata-core";
import { afterAll, describe, expect, expectTypeOf, test } from "vitest";
import { expectODataError } from "../expectODataError.js";
import { BASE_URL, BOOK_DER_PROZESS, LIBRARY } from "../LibraryTestConstants.js";

/**
 * Services for individual properties - the `enablePrimitivePropertyServices` feature.
 *
 * The headline is the comparison. Against the CAP V2 adapter these same calls are **destructive**: a
 * `PUT` on a property URL answers 204 and leaves the property `null`, whatever the payload said (see
 * int-test/cap/test/v2/feature/PropertyServices.test.ts). Here they do what they say. Same client, same
 * requests, opposite outcome - which is exactly why both servers are worth having.
 */
describe("Olingo Library: property services", () => {
  const book = () => LIBRARY.Books(BOOK_DER_PROZESS);

  // the seed data is the contract other files assert against, so anything written here is put back
  afterAll(async () => {
    await book().Language().updateValue("de").execute();
  });

  test("the property name is appended to the entity URL", () => {
    expect(book().Title().getPath()).toBe(`${BASE_URL}/Books(guid'${BOOK_DER_PROZESS}')/Title`);
  });

  test("read a single value", async () => {
    const result = await book().Title().getValue().execute();

    expect(result.status).toBe(200);
    // V2 keys the value by the property name inside `d`, where V4 uses a fixed `value` field
    expect(result.data.d.Title).toBe("Der Prozess");

    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataValueResponseV2<string>>>();
  });

  test("read an inherited property", async () => {
    // `ISBN` is declared on PrintMedium, two levels up - the property service exists for it all the same
    const result = await book().ISBN().getValue().execute();

    expect(result.status).toBe(200);
    expect(result.data.d.ISBN).toBe("9783150094440");
  });

  test("updating a single value actually updates it", async () => {
    const updated = await book().Language().updateValue("en").execute();
    expect(updated.status).toBe(204);
    expectTypeOf(updated).toEqualTypeOf<HttpResponseModel<undefined>>();

    // the value that was sent is the value that is there - and the entity agrees
    expect((await book().Language().getValue().execute()).data.d.Language).toBe("en");
    expect((await book().query().execute()).data.d.Language).toBe("en");
  });

  test("deleting a value is not supported", async () => {
    // Olingo's request dispatcher has no route for DELETE on a property URL. Setting a value to null via
    // `DELETE` is a `MAY` in V1-V3, so refusing it is conforming - but the status is 405, not 501.
    await expectODataError(book().Language().deleteValue().execute(), {
      status: 405,
      message: /does not allow the HTTP method/,
    });
  });

  test("the raw value is served without the envelope", async () => {
    // `/$value` is a resource path rather than a client feature, so this goes out raw
    const response = await fetch(`${book().Title().getPath()}/$value`);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Der Prozess");
  });
});
