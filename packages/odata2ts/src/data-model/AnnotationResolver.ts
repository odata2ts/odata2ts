import { withNamespace } from "./DataModel.js";
import { Annotatable, Annotation, ComplexType, EntityType, Reference, Schema } from "./edmx/ODataEdmxModelBase.js";

/**
 * A navigation property, of either version: the base EDMX types don't know the element - V4 declares it
 * on the entity type, V3 on the schema - but both spellings carry a name and may be annotated.
 */
interface NavigationPropertyLike extends Annotatable {
  $: { Name: string };
}

interface WithNavigationProps {
  NavigationProperty?: Array<NavigationPropertyLike>;
}

/**
 * Brings the annotations of a document into one shape before anything is digested: every term name fully
 * qualified, and every externally stated annotation moved to the element it targets.
 *
 * Rewriting the EDMX rather than building an index next to it is what keeps the feature contained. Only
 * this class needs to know that an annotation may be stated in two places and that a term may be written
 * with a freely chosen alias; from here on everything downstream reads `element.Annotation` and compares
 * fully qualified names. It also means the {@link ComplexTypeUnflattener}, which runs afterwards and moves
 * property objects around, carries the annotations along without knowing about them.
 */
export class AnnotationResolver {
  /**
   * Alias to namespace, as declared by `edmx:Reference/edmx:Include`. Aliases are freely chosen per
   * document: the same term reads `Core.Computed` in CAP's metadata and `Org.OData.Core.V1.Computed` in
   * ASP.NET's, which doesn't declare a reference at all.
   */
  private readonly vocabularyAliases = new Map<string, string>();

  /**
   * Every entity and complex type by its fully qualified name, under the namespace of its schema as well
   * as under its alias - an annotation may address it either way.
   */
  private readonly targets = new Map<string, EntityType | ComplexType>();

  constructor(
    private readonly schemas: Array<Schema<EntityType, ComplexType>>,
    references: Array<Reference> | undefined,
  ) {
    for (const reference of references ?? []) {
      for (const include of reference["edmx:Include"] ?? []) {
        if (include.$.Alias) {
          this.vocabularyAliases.set(include.$.Alias, include.$.Namespace);
        }
      }
    }

    for (const schema of schemas) {
      const { Namespace: ns, Alias: alias } = schema.$;
      for (const model of [...(schema.EntityType ?? []), ...(schema.ComplexType ?? [])]) {
        this.targets.set(withNamespace(ns, model.$.Name), model);
        if (alias) {
          this.targets.set(withNamespace(alias, model.$.Name), model);
        }
      }
    }
  }

  /**
   * Normalizes the annotations of all schemas in place.
   */
  public resolve(): void {
    for (const schema of this.schemas) {
      for (const model of [...(schema.EntityType ?? []), ...(schema.ComplexType ?? [])]) {
        this.qualifyTerms(model);
        for (const prop of [...(model.Property ?? []), ...((model as WithNavigationProps).NavigationProperty ?? [])]) {
          this.qualifyTerms(prop);
        }
      }
      this.qualifyTerms(schema);
    }

    for (const schema of this.schemas) {
      for (const annotations of schema.Annotations ?? []) {
        // a qualifier restricts an annotation to a context which only the application knows, so the whole
        // block is none of our business - same rule as for the single annotation below
        if (annotations.$.Qualifier) {
          continue;
        }
        const target = this.findTarget(annotations.$.Target);
        if (target) {
          this.attach(target, this.qualify(annotations.Annotation));
        }
      }
      schema.Annotations = undefined;
    }
  }

  /**
   * Rewrites the term names of an element to their fully qualified form and drops the qualified
   * annotations along the way.
   */
  private qualifyTerms(element: Annotatable): void {
    if (element.Annotation) {
      element.Annotation = this.qualify(element.Annotation);
    }
  }

  private qualify(annotations: Array<Annotation> | undefined): Array<Annotation> {
    return (annotations ?? [])
      .filter((annotation) => !annotation.$.Qualifier)
      .map((annotation) => {
        const result: Annotation = {
          ...annotation,
          $: { ...annotation.$, Term: this.qualifyName(annotation.$.Term) },
        };
        // an enum value names its members just as freely as the term names its vocabulary
        if (result.$.EnumMember) {
          result.$.EnumMember = this.qualifyMembers(result.$.EnumMember);
        }
        if (result.EnumMember) {
          result.EnumMember = result.EnumMember.map((members) => this.qualifyMembers(members));
        }
        // a record is annotatable in turn, and the aliases of those terms are the same aliases:
        // `Validation.AllowedValue` states the name of the value it allows as a nested `Core.SymbolicName`
        if (result.Collection) {
          result.Collection = result.Collection.map((collection) => ({
            ...collection,
            Record: collection.Record?.map((record) => ({
              ...record,
              $: record.$?.Type ? { ...record.$, Type: this.qualifyName(record.$.Type) } : record.$,
              Annotation: record.Annotation ? this.qualify(record.Annotation) : undefined,
            })),
          }));
        }
        return result;
      });
  }

  /**
   * The members of an enum value. It may name several of them at once, separated by whitespace, since an
   * enum type may be a set of flags.
   */
  private qualifyMembers(members: string): string {
    return members
      .trim()
      .split(/\s+/)
      .map((member) => this.qualifyName(member))
      .join(" ");
  }

  /**
   * Expands a declared alias prefix to its namespace. A name which carries no known alias is left alone:
   * it is either fully qualified already or draws from a vocabulary the document never included, in which
   * case it simply never matches a term we look for.
   */
  public qualifyName(name: string): string {
    const separator = name.indexOf(".");
    if (separator < 0) {
      return name;
    }
    const namespace = this.vocabularyAliases.get(name.substring(0, separator));
    return namespace ? namespace + name.substring(separator) : name;
  }

  /**
   * Resolves an annotation target path to the element it addresses. Only the paths we can act on are
   * resolved - a type and a property of a type; anything addressing the entity container, a term or a
   * deeper path yields nothing and is therefore left alone.
   */
  private findTarget(target: string): Annotatable | undefined {
    const [typeName, ...path] = target.split("/");
    const model = this.targets.get(typeName);
    if (!model) {
      return undefined;
    }
    if (!path.length) {
      return model;
    }
    if (path.length > 1) {
      return undefined;
    }

    const [propName] = path;
    return (
      model.Property?.find((p) => p.$.Name === propName) ??
      (model as WithNavigationProps).NavigationProperty?.find((p) => p.$.Name === propName)
    );
  }

  /**
   * Adds externally stated annotations to their target. Stating the same term in both places is invalid
   * to begin with, so which one wins is a matter of taste: the external form does, being the more
   * specific statement about a model someone else may have authored.
   */
  private attach(target: Annotatable, annotations: Array<Annotation>): void {
    if (!annotations.length) {
      return;
    }
    const externalTerms = new Set(annotations.map((a) => a.$.Term));
    target.Annotation = [...(target.Annotation ?? []).filter((a) => !externalTerms.has(a.$.Term)), ...annotations];
  }
}
