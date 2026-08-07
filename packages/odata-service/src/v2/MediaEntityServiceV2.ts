import { QueryObjectModel } from "@odata2ts/odata-query-objects";
import { EntityTypeServiceV2 } from "./EntityTypeServiceV2";
import { StreamServiceV2 } from "./StreamServiceV2";

const VALUE_SEGMENT = "$value";

/**
 * Service for a media link entry (MLE), i.e. an entity type declared `m:HasStream="true"`: the entity
 * points at a media resource (MR) which holds its binary content.
 * Spec: {@link https://www.odata.org/documentation/odata-version-2-0/operations/} - 2.5 Creating Media Link Entries
 *
 * This is V2's answer to what V4 splits over two concepts: it has no `Edm.Stream`, so an entity carrying
 * binary content *is* the media link entry, and the content is reachable by appending `$value` to its URL.
 * Strictly speaking a client is supposed to take that URL from the entity's `__metadata.media_src` /
 * `edit_media`, which is only known after reading the entity; every implementation puts the MR at `$value`,
 * which is what makes the URL predictable enough to build without asking first.
 *
 * Everything an ordinary entity service does stays available - the media link entry still has regular
 * properties, which are read and written as JSON; only its content is separate. Its own response reshaping
 * (`AsV4`) is inherited from {@link EntityTypeServiceV2}; the binary content itself is untouched by any
 * response shaping, so {@link content} keeps using the very same {@link StreamServiceV2} regardless.
 */
export class MediaEntityServiceV2<
  T,
  EditableT,
  Q extends QueryObjectModel,
  AsV4 extends boolean = false,
> extends EntityTypeServiceV2<T, EditableT, Q, AsV4> {
  private _content?: StreamServiceV2;

  /**
   * The entity's content as its own service, bound to the `$value` URL.
   */
  public content(): StreamServiceV2 {
    if (!this._content) {
      const { client, path, options } = this.__base;
      this._content = new StreamServiceV2(client, path, VALUE_SEGMENT, options);
    }

    return this._content;
  }

  /**
   * Read the entity's binary content. Shortcut for `content().getBlob()`.
   */
  public getBlob() {
    return this.content().getBlob();
  }

  /**
   * Replace the entity's binary content. Shortcut for `content().updateBlob(...)`.
   *
   * @param data the binary content
   * @param mimeType overrides the blob's own type
   */
  public updateBlob(data: Blob, mimeType?: string) {
    return this.content().updateBlob(data, mimeType);
  }

  /**
   * Read the entity's binary content as a stream. Shortcut for `content().getStream()`.
   */
  public getStream() {
    return this.content().getStream();
  }

  /**
   * Replace the entity's binary content from a stream. Shortcut for `content().updateStream(...)`.
   *
   * @param data the binary content
   * @param mimeType the content's MIME type
   */
  public updateStream(data: ReadableStream, mimeType?: string) {
    return this.content().updateStream(data, mimeType);
  }

  /**
   * Delete the entity's binary content, leaving the entity itself in place. Shortcut for
   * `content().deleteBlob()`.
   *
   * V2 only specifies that deleting the media link entry deletes its media resource as well; emptying
   * the content on its own is left to the implementation. Both reference servers answer 204 and keep the
   * entity, but a server refusing this with 405 would be within the spec.
   */
  public deleteBlob() {
    return this.content().deleteBlob();
  }
}
