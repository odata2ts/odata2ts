import { QGuidPath, QStringPath, QueryObject } from "@odata2ts/odata-query-objects";

export class QAudiobook extends QueryObject {
  public readonly id = new QGuidPath(this.withPrefix("id"));
  public readonly title = new QStringPath(this.withPrefix("title"));
}

export const qAudiobook = new QAudiobook();
