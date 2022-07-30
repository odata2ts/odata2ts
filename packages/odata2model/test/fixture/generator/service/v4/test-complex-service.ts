import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeServiceV4 } from "@odata2ts/odata-service";
// @ts-ignore
import { Reviewer, EditableReviewer } from "../TesterModel";
// @ts-ignore
import { QReviewer, qReviewer } from "../QTester";

export class ReviewerService extends EntityTypeServiceV4<Reviewer, EditableReviewer, QReviewer> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qReviewer);
  }
}
