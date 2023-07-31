import { BigNumber } from "bignumber.js";

import { BooksModel } from "../src/catalog/CatalogModel";
import { catalogService } from "./services";

describe("CAP V4 Integration Testing: Operation Capabilities", () => {
  const testService = catalogService;

  const BOOK_ZERO: Omit<BooksModel, "author" | "image" | "createdAt" | "modifiedAt"> = {
    id: 201,
    title: "Wuthering Heights",
    descr:
      "Wuthering Heights, Emily Brontë's only novel, was published in 1847 under the pseudonym \"Ellis Bell\". It was written between October 1845 and June 1846. Wuthering Heights and Anne Brontë's Agnes Grey were accepted by publisher Thomas Newby before the success of their sister Charlotte's novel Jane Eyre. After Emily's death, Charlotte edited the manuscript of Wuthering Heights and arranged for the edited version to be published as a posthumous second edition in 1850.",
    genreId: 11,
    stock: 12,
    price: new BigNumber("11.11"),
    currencyCode: "GBP",
  };

  test("string returning function with param", async () => {
    const result = await testService.hello({ to: "Horst" });

    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data.value).toBe("Hello Horst");
  });

  test("string collection returning function", async () => {
    const result = await testService.helloI18n();

    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data.value).toStrictEqual(["Hello", "Hallo", "Holla", "Olé olé!"]);
  });

  test("entity type returning function", async () => {
    const result = await testService.getBestBook();

    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data).toMatchObject(BOOK_ZERO);
  });

  test("entity collection returning function", async () => {
    const result = await testService.getBestBooks();

    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();
    expect(result.data.value.length).toBe(5);
    expect(result.data.value[0]).toMatchObject(BOOK_ZERO);
  });
});
