import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { BigNumber } from "bignumber.js";

import { BooksModel, EditableBooksModel } from "../src/admin/AdminModel";
import { adminService } from "./services";

describe("CAP V4 Integration Testing: CRUD capabilities", () => {
  const testService = adminService;

  test("get book zero", async () => {
    const bookZeroId = 201;

    const result = await testService.books(bookZeroId).query();
    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();

    const product: ODataModelResponseV4<BooksModel> = result.data;
    expect(product).toMatchObject({
      id: 201,
      title: "Wuthering Heights",
      descr:
        "Wuthering Heights, Emily Brontë's only novel, was published in 1847 under the pseudonym \"Ellis Bell\". It was written between October 1845 and June 1846. Wuthering Heights and Anne Brontë's Agnes Grey were accepted by publisher Thomas Newby before the success of their sister Charlotte's novel Jane Eyre. After Emily's death, Charlotte edited the manuscript of Wuthering Heights and arranged for the edited version to be published as a posthumous second edition in 1850.",
      authorId: 101,
      genreId: 11,
      stock: 12,
      price: new BigNumber("11.11"),
      currencyCode: "GBP",
      createdBy: "anonymous",
      modifiedBy: "anonymous",
    });
  });

  test("create and delete book", async () => {
    jest.setTimeout(15000);

    // given
    const bookSrv = testService.books();
    const id = 999;
    const book: EditableBooksModel = {
      // @ts-ignore
      id,
      title: "Test Title",
      descr: "Test Description",
      price: new BigNumber("12.88"),
      stock: 10,
    };

    try {
      await testService.books(id).delete();
    } catch (e) {}

    // when creating the book
    let result = await bookSrv.create(book);
    // then return object matches our book
    expect(result.status).toBe(201);
    expect(result.data).toMatchObject({
      id: 999,
      title: "Test Title",
      descr: "Test Description",
      price: new BigNumber("12.88"),
      stock: 10,
      createdBy: "alice",
      modifiedBy: "alice",
      "image@odata.mediaContentType": "image/png",
    });
    expect(result.headers?.location).toBeDefined();
    expect(result.headers?.location).toBe("Books(999)");
    expect(bookSrv.parseKey(result.headers!.location)).toBe(999);

    const location = bookSrv.parseKey(result.headers.location);

    expect(location).toBeDefined();
    expect(location).toBe(id);

    // when updating the description, we expect no error
    await testService.books(location).patch({ descr: "Updated Desc" });

    // when deleting this new book, we expect no error
    await new Promise((res) => setTimeout(res, 1000));
    await testService.books(id).delete();
  });

  test("patch book", async () => {
    const updated: Partial<EditableBooksModel> = {
      descr: "Updated Description",
      title: "new title!",
    };

    const srv = testService.books(271);
    const result = await srv.patch(updated);

    expect(result.status).toBe(200);
    expect(result.data).toMatchObject(updated);
    expect(result.data!.authorId).toBe(170);

    const queried = await srv.query();

    expect(result.data).toMatchObject(queried.data);
  });

  test("update book", async () => {
    const toUpdate: Partial<EditableBooksModel> = {
      descr: "Updated Description",
    };

    const srv = testService.books(252);
    const queried = await srv.query();
    const {
      "@odata.context": ctxt,
      //@ts-ignore
      "image@odata.mediaContentType": mct,
      id,
      createdAt,
      createdBy,
      modifiedAt,
      modifiedBy,
      ...passThrough
    } = queried.data;
    const updated = { ...passThrough, ...toUpdate };

    const result = await srv.update(updated);

    expect(result.status).toBe(200);
    expect(result.data).toMatchObject(updated);
    expect(result.data!.authorId).toBe(150);

    expect(result.data).toMatchObject(updated);
    expect(result.data!.modifiedAt! > modifiedAt!).toBeTruthy();
  });

  test("update book in detail", async () => {
    const toUpdate: EditableBooksModel = {
      title: "Test",
      stock: 666,
      authorId: null,
      genreId: undefined,
    };

    const srv = testService.books(251);

    const result = await srv.update(toUpdate);

    expect(result.status).toBe(200);
    expect(result.data).toMatchObject({
      ...toUpdate,
      createdBy: "anonymous", // not updatable
      id: 251,
      genreId: null, // null or not null, but never undefined
      modifiedBy: "alice", // changed automatically
    });
    // createdAt is still set
    expect(result.data!.createdAt!.length).toBe(24);
  });

  test("get primitive property", async () => {
    const response = await testService.books(271).price().getValue();

    expect(response.status).toBe(200);
    expect(response.data?.value).toBeInstanceOf(BigNumber);
    expect(response.data?.value).toStrictEqual(new BigNumber(150));
  });

  test("update primitive property", async () => {
    const response = await testService.books(271).price().updateValue(new BigNumber(999));

    expect(response.status).toBe(200);
    expect(response.data?.value).toBeInstanceOf(BigNumber);
    expect(response.data?.value).toStrictEqual(new BigNumber(999));
  });
});
