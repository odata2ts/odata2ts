import { describe, expect, test } from "vitest";
import { TRIPPIN } from "./TrippinTestConstants.js";

describe("Testing Request Body with V4 Sub-Versioning", () => {
  const ID = "williams";

  test("the type control info of a payload uses the prefixed form", async () => {
    const request = TRIPPIN.people(ID)
      .asEmployeeService()
      .patch({ cost: 5 }, { withTypeControlInfo: true })
      .getInfoConverted();

    expect(request.data).toStrictEqual({ Cost: 5, "@odata.type": "#Trippin.Employee" });
  });

  test("control info supplied by the user wins", async () => {
    const request = TRIPPIN.people(ID)
      .asEmployeeService()
      .patch({ cost: 5, "@odata.type": "#Trippin.Manager" }, { withTypeControlInfo: true })
      .getInfoConverted();

    expect(request.data).toStrictEqual({ Cost: 5, "@odata.type": "#Trippin.Manager" });
  });

  test("the spelling of the other version is rejected", () => {
    TRIPPIN.people(ID).asEmployeeService().patch({
      cost: 5,
      // @ts-expect-error: a client targeting 4.0 must not use the short form
      "@type": "#Trippin.Manager",
    });
  });
});
