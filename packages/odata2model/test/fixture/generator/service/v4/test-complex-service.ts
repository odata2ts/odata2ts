import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeServiceV4 } from "@odata2ts/odata-service";
// @ts-ignore
import { Reviewer } from "../TesterModel";
// @ts-ignore
import { QReviewer, qReviewer } from "../QTester";

export class ReviewerService extends EntityTypeServiceV4<Reviewer, QReviewer> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qReviewer);
  }
}
