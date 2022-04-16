// @ts-nocheck
import { ODataClient } from "@odata2ts/odata-client-api";
import { EntityTypeService } from "@odata2ts/odata-service";
import { Reviewer } from "../TesterModel";
import { QReviewer, qReviewer } from "../QTester";

export class ReviewerService extends EntityTypeService<Reviewer, QReviewer> {
  constructor(client: ODataClient, path: string) {
    super(client, path, qReviewer);
  }
}
