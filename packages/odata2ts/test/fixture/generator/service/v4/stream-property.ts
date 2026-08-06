import type { ODataHttpClient } from "@odata2ts/http-client-api";
import type { ODataVersionV4 } from "@odata2ts/odata-core";
import {
  EntitySetServiceV4,
  EntityTypeServiceV4,
  ODataService,
  ODataServiceOptionsInternal,
  StreamServiceV4,
} from "@odata2ts/odata-service";
// @ts-ignore
import type { QAudiobook } from "./QTester.js";
// @ts-ignore
import { qAudiobook, QAudiobookId } from "./QTester.js";
// @ts-ignore
import type { Audiobook, AudiobookId, EditableAudiobook } from "./TesterModel.js";

export class TesterService extends ODataService {
  public audiobooks(): AudiobookCollectionService;
  public audiobooks(id: AudiobookId): AudiobookService;
  public audiobooks(id?: AudiobookId | undefined) {
    const fieldName = "Audiobooks";
    const { client, path, options, isUrlNotEncoded } = this.__base;
    return typeof id === "undefined" || id === null
      ? new AudiobookCollectionService(client, path, fieldName, options)
      : new AudiobookService(client, path, new QAudiobookId(fieldName).buildUrl(id, isUrlNotEncoded()), options);
  }
}

export class AudiobookService<V extends ODataVersionV4 = "4.0"> extends EntityTypeServiceV4<
  Audiobook,
  EditableAudiobook,
  QAudiobook,
  V
> {
  private _sample?: StreamServiceV4<V>;

  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qAudiobook, options);
  }

  public sample() {
    if (!this._sample) {
      const { client, path, options } = this.__base;
      this._sample = new StreamServiceV4(client, path, "Sample", options);
    }

    return this._sample;
  }
}

export class AudiobookCollectionService<V extends ODataVersionV4 = "4.0"> extends EntitySetServiceV4<
  Audiobook,
  EditableAudiobook,
  QAudiobook,
  AudiobookId,
  V
> {
  constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    super(client, basePath, name, qAudiobook, new QAudiobookId(name), options);
  }
}
