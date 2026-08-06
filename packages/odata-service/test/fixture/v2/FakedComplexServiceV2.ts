import { ODataHttpClient } from "@odata2ts/http-client-api";
import { ComplexTypeServiceV2, ODataServiceOptions } from "../../../src";
import { EditablePersonModel, PersonModel } from "../PersonModel";
import { qPersonV2, QPersonV2 } from "./QPersonV2";

export class FakedComplexServiceV2 extends ComplexTypeServiceV2<PersonModel, EditablePersonModel, QPersonV2> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qPersonV2, options);
  }
}
