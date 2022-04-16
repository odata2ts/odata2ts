// @ts-nocheck
import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeService, EntitySetService, compileId } from "@odata2ts/odata-service";
import { Book } from "../TesterModel";
import { QBook, qBook } from "../QTester";
import { AuthorService, AuthorCollectionService } from "./AuthorService";

export class BookService extends EntityTypeService<Book, QBook> {
  private _author?: AuthorService;
  private _relatedAuthors?: AuthorCollectionService;

  constructor(client: ODataClient, path: string) {
    super(client, path, qBook);
  }

  public get author(): AuthorService {
    if (!this._author) {
      this._author = new AuthorService(this.client, this.path + "/author");
    }

    return this._author;
  }

  public get relatedAuthors(): AuthorCollectionService {
    if (!this._relatedAuthors) {
      this._relatedAuthors = new AuthorCollectionService(this.client, this.path + "/relatedAuthors");
    }

    return this._relatedAuthors;
  }
}

export class BookCollectionService extends EntitySetService<Book, QBook, string | { ID: string }> {
  private keySpec = [{ isLiteral: true, name: "id", odataName: "ID" }];

  constructor(client: ODataClient, path: string) {
    super(client, path, qBook);
  }

  public getKeySpec() {
    return this.keySpec;
  }

  public get(id: string | { ID: string }): BookService {
    const url = compileId(this.path, this.keySpec, id);
    return new BookService(this.client, url);
  }
}
