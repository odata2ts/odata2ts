import { ODataModelResponseV4 } from "@odata2ts/odata-core";

import { BooksModel, EditableBooksModel } from "../src/admin/AdminModel";
import { adminService } from "./services";

describe("CAP V4 Integration Testing: CRUD capabilities", () => {
  const testService = adminService;

  test("get book zero", async () => {
    const BOOK_ZERO: Omit<BooksModel, "image" | "createdAt" | "modifiedAt"> = {
      id: 201,
      title: "Wuthering Heights",
      descr:
        "Wuthering Heights, Emily Brontë's only novel, was published in 1847 under the pseudonym \"Ellis Bell\". It was written between October 1845 and June 1846. Wuthering Heights and Anne Brontë's Agnes Grey were accepted by publisher Thomas Newby before the success of their sister Charlotte's novel Jane Eyre. After Emily's death, Charlotte edited the manuscript of Wuthering Heights and arranged for the edited version to be published as a posthumous second edition in 1850.",
      authorId: 101,
      genreId: 11,
      stock: 12,
      price: 11.11,
      currencyCode: "GBP",
      createdBy: "anonymous",
      modifiedBy: "anonymous",
    };

    const result = await testService.navToBooks().get(BOOK_ZERO.id).query();
    expect(result.status).toBe(200);
    expect(result.data).toBeDefined();

    const product: ODataModelResponseV4<BooksModel> = result.data;
    expect(product).toMatchObject(BOOK_ZERO);
  });

  test.skip("create and delete book", async () => {
    jest.setTimeout(15000);

    // given
    const bookSrv = testService.navToBooks();
    const book: EditableBooksModel = {
      // @ts-ignore
      id: 999,
      title: "Test Title",
      descr: "Test Description",
      price: 12.88,
      stock: 10,
    };

    // when creating the book
    let result = await bookSrv.create(book);
    // then return object matches our book
    expect(result.status).toBe(204);
    expect(result.data).toBe("");
    expect(result.headers?.location).toBeDefined();
    const id = bookSrv.parseKey(result.headers.location);

    expect(id).toBeDefined();
    expect(id).not.toBeNaN();

    // when updating the description, we expect no error
    await bookSrv.patch(id, { descr: "Updated Desc" });

    // when deleting this new book, we expect no error
    await new Promise((res) => setTimeout(res, 1000));
    await bookSrv.delete(id);
  });

  test("patch book", async () => {
    const updated: Partial<EditableBooksModel> = {
      descr: "Updated Description",
      title: "new title!",
    };

    const srv = testService.navToBooks().get(271);
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

    const srv = testService.navToBooks().get(252);
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

    const srv = testService.navToBooks().get(251);

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
});
