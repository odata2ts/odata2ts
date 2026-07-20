import { HttpResponseModel } from "@odata2ts/http-client-api";
import { describe, expect, test } from "vitest";
import { MainResponseConverter } from "../../src/response/MainResponseConverter";

class TestResponseConverter extends MainResponseConverter<any, any> {
  public convert(response: HttpResponseModel<any>): HttpResponseModel<any> {
    return response;
  }

  public exposeApplyConverter(value: any) {
    return this.applyConverter(value);
  }
}

describe("MainResponseConverter tests", () => {
  test("applyConverter: falls back to the raw value when the converter has neither convertFromOData nor convertFrom", () => {
    const candidate = new TestResponseConverter({} as any);

    expect(candidate.exposeApplyConverter("raw value")).toBe("raw value");
  });
});
