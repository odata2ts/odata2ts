import { QAction } from "../../../src";

export const EMPTY_ACTION_NAME = "EMPTY_ACTion";

export class QEmptyAction extends QAction {
  constructor() {
    super(EMPTY_ACTION_NAME);
  }

  public getParams() {
    return undefined;
  }
}
