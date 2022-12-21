export function searchTerm(term: QSearchTerm | string | null | undefined): QSearchTerm {
  return term && term instanceof QSearchTerm ? term : new QSearchTerm(term);
}

export class QSearchTerm {
  private readonly term: string;

  constructor(term: string | null | undefined, handlePhrase: boolean = true) {
    const cleaned = term?.trim();
    if (!cleaned) {
      this.term = "";
    } else {
      this.term = handlePhrase && cleaned.indexOf(" ") > -1 ? `"${cleaned}"` : cleaned;
    }
  }

  public toString(): string {
    return this.term;
  }

  public not(): QSearchTerm {
    if (this.term?.trim()) {
      return new QSearchTerm(`NOT ${this.term}`, false);
    }
    return this;
  }

  public and(term: string | QSearchTerm): QSearchTerm {
    if (term?.toString()) {
      if (this.term) {
        return new QSearchTerm(`${this.term} AND ${searchTerm(term).toString()}`, false);
      } else {
        return searchTerm(term);
      }
    }
    return this;
  }

  public or(term: string | QSearchTerm): QSearchTerm {
    if (term?.toString()) {
      const st: QSearchTerm = typeof term === "string" ? searchTerm(term) : term;
      if (this.term) {
        return new QSearchTerm(`(${this.term} OR ${st.toString()})`, false);
      } else {
        return searchTerm(term);
      }
    }
    return this;
  }
}
