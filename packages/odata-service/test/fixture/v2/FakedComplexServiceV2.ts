import { ODataHttpClient } from "@odata2ts/http-client-api";
import { ComplexTypeServiceV2, ODataServiceOptions } from "@odata2ts/odata-service";
import { EditablePersonModel, PersonModel } from "../PersonModel";
import { qPersonV2, QPersonV2 } from "./QPersonV2";

export class FakedComplexServiceV2<ClientType extends ODataHttpClient> extends ComplexTypeServiceV2<
  ClientType,
  PersonModel,
  EditablePersonModel,
  QPersonV2
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, qPersonV2, options);
  }
}
