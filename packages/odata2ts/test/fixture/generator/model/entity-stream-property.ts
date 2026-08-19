export interface Audiobook {
  id: string;
  title: string;
}

export interface EditableAudiobook extends Pick<Audiobook, "id" | "title"> {}

export interface UpdatableAudiobook extends Pick<Audiobook, "title">, Partial<Pick<Audiobook, "id">> {}
