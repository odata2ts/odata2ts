import { ODataHttpClient } from "@odata2ts/http-client-api";
import { EntityTypeServiceV4 } from "@odata2ts/odata-service";

// @ts-ignore
import { QReviewer, qReviewer } from "../QTester";
// @ts-ignore
import { EditableReviewer, Reviewer } from "../TesterModel";

export class ReviewerService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  Reviewer,
  EditableReviewer,
  QReviewer
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qReviewer);
  }
}
