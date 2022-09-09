import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeServiceV2 } from "@odata2ts/odata-service";

// @ts-ignore
import { QReviewer, qReviewer } from "../QTester";
// @ts-ignore
import { EditableReviewer, Reviewer } from "../TesterModel";

export class ReviewerService<ClientType extends ODataClient> extends EntityTypeServiceV2<
  ClientType,
  Reviewer,
  EditableReviewer,
  QReviewer
> {
  constructor(client: ClientType, basePath: string, name: string) {
    super(client, basePath, name, qReviewer);
  }
}
