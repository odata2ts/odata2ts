import type { ODataCollectionResponseV4, ODataModelResponseV4, ODataValueResponseV4 } from "@odata2ts/odata-core";
import {
  CollectionResponseConverterV4,
  ModelResponseConverterV4,
  QAction,
  QStringPath,
  QueryObject,
} from "@odata2ts/odata-query-objects";
// @ts-ignore
import type { Person } from "./TesterModel.js";

export class QPerson extends QueryObject {
  public readonly id = new QStringPath(this.withPrefix("id"));
}

export const qPerson = new QPerson();

export class QAPrimitive extends QAction<undefined, ODataValueResponseV4<boolean>> {
  private readonly params: [] = [];

  constructor() {
    super("APrimitive");
  }

  getParams() {
    return this.params;
  }
}

export class QAPrimitiveCollection extends QAction<undefined, ODataCollectionResponseV4<boolean>> {
  private readonly params: [] = [];

  constructor() {
    super("APrimitiveCollection");
  }

  getParams() {
    return this.params;
  }
}

export class QAModel extends QAction<undefined, ODataModelResponseV4<Person>> {
  private readonly params: [] = [];

  constructor() {
    super("AModel", new ModelResponseConverterV4(new QPerson()));
  }

  getParams() {
    return this.params;
  }
}

export class QAModelCollection extends QAction<undefined, ODataCollectionResponseV4<Person>> {
  private readonly params: [] = [];

  constructor() {
    super("AModelCollection", new CollectionResponseConverterV4(new QPerson()));
  }

  getParams() {
    return this.params;
  }
}
