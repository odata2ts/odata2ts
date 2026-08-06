import { ODataVersionV4 } from "@odata2ts/odata-core";
import { QueryObjectModel } from "@odata2ts/odata-query-objects";
import { EntityTypeServiceV4 } from "./EntityTypeServiceV4";
import { SubtypeOptions } from "./ServiceStateHelperV4.js";
import { StreamServiceV4 } from "./StreamServiceV4";

const VALUE_SEGMENT = "$value";

/**
 * Service for a media entity, i.e. an entity type declared `HasStream="true"`: the entity's own
 * representation *is* binary content, addressed by appending `$value` to its URL.
 * Spec: {@link https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_ManagingMediaEntities}
 *
 * Everything an ordinary entity service does stays available - the media entity still has regular
 * properties, which are read and written as JSON; only its content is separate.
 */
export class MediaEntityServiceV4<
  T,
  EditableT,
  Q extends QueryObjectModel,
  V extends ODataVersionV4 = "4.0",
> extends EntityTypeServiceV4<T, EditableT, Q, V> {
  private _content?: StreamServiceV4<V>;

  /**
   * The entity's content as its own service, bound to the `$value` URL.
   *
   * On a subtype service the type cast segment is left out by default, mirroring the other operations:
   * `$value` addresses the entity itself, which its key already identifies. Servers reject the
   * combination - `…/Media(<id>)/Namespace.EBook/$value` answers 404 while `…/Media(<id>)/$value`
   * serves the content. Note the difference to a *stream property* declared on a derived type: that one
   * can only be reached *through* the cast, since it does not exist on the base type.
   *
   * @param subtypeOptions opt the cast path segment back in
   */
  public content(subtypeOptions?: SubtypeOptions): StreamServiceV4<V> {
    const { client, basePath, path, options } = this.__base;
    const { dontUseCastPathSegment } = this.__base.evaluateSubtypeOptions(subtypeOptions);
    const actualPath = dontUseCastPathSegment ? basePath : path;

    // only the default is worth caching; anything else is a one-off request shape
    if (subtypeOptions) {
      return new StreamServiceV4<V>(client, actualPath, VALUE_SEGMENT, options);
    }
    if (!this._content) {
      this._content = new StreamServiceV4<V>(client, actualPath, VALUE_SEGMENT, options);
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
   */
  public deleteBlob() {
    return this.content().deleteBlob();
  }
}
