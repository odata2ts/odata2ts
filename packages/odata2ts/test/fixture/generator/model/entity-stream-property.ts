export interface Audiobook {
  id: string;
  title: string;
}

export interface EditableAudiobook extends Pick<Audiobook, "title"> {}
