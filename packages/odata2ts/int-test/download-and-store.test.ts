import { downloadMetadata, storeMetadata } from "../src/download";

const SOURCE_URL = "https://services.odata.org/TripPinRESTierService";
const SOURCE1 = "./build/int-test/trippin-raw.xml";
const SOURCE2 = "./build/int-test/trippin.xml";
// const DUMMY_SOURCE = "./int-test/fixture/v4/dummy.xml";

describe("Download & Store Test", () => {
  test("Best Case", async () => {
    const result = await downloadMetadata(SOURCE_URL);

    expect(result).toBeDefined();

    const raw = await storeMetadata(SOURCE1, result, false);
    expect(raw).toBe(result);
  });

  test("Prettify Output", async () => {
    const result = await downloadMetadata(SOURCE_URL);

    expect(result).toBeDefined();

    const formatted = await storeMetadata(SOURCE2, result, true);
    // expect(#result.code).toBe(1);
  });
});
