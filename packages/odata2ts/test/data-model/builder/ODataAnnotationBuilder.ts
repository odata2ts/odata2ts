import { Annotation } from "../../../src/data-model/edmx/ODataEdmxModelBase.js";

/**
 * The OASIS vocabularies a test model may draw terms from, with the aliases which are conventional for
 * them. An alias is freely chosen per document though, which is the whole point of declaring it - see
 * `enableAnnotations` of the model builder.
 */
export const VOCABULARIES = {
  core: { alias: "Core", namespace: "Org.OData.Core.V1" },
  validation: { alias: "Validation", namespace: "Org.OData.Validation.V1" },
  capabilities: { alias: "Capabilities", namespace: "Org.OData.Capabilities.V1" },
} as const;

export interface AnnotationOptions {
  /**
   * The boolean value of a tag term. Leaving it out states the term without a value, which means `true`.
   */
  bool?: boolean;
  /**
   * The members of an enum value, given by their bare name (`Read`) - the vocabulary prefix is added.
   */
  enumMembers?: Array<string>;
  /**
   * Restricts the annotation to a context, which makes it none of the generator's business.
   */
  qualifier?: string;
  /**
   * States the value as a child element instead of an attribute. Both spellings occur in the wild -
   * Trippin states its permissions as `<EnumMember>` children - and mean exactly the same.
   */
  asChildElement?: boolean;
  /**
   * Writes the term with its full namespace instead of the alias, the way ASP.NET states it.
   */
  fullyQualified?: boolean;
  /**
   * The string value of the term.
   */
  string?: string;
}

/**
 * An annotation of one of the {@link VOCABULARIES}, in any of the spellings a service may use for it.
 */
export function annotation(
  vocabulary: keyof typeof VOCABULARIES,
  term: string,
  options: AnnotationOptions = {},
): Annotation {
  const { alias, namespace } = VOCABULARIES[vocabulary];
  const prefix = options.fullyQualified ? namespace : alias;

  const result: Annotation = { $: { Term: `${prefix}.${term}` } };
  if (options.qualifier) {
    result.$.Qualifier = options.qualifier;
  }

  if (typeof options.bool === "boolean") {
    const value = options.bool ? "true" : "false";
    if (options.asChildElement) {
      result.Bool = [value];
    } else {
      result.$.Bool = value;
    }
  }

  if (options.string !== undefined) {
    if (options.asChildElement) {
      result.String = [options.string];
    } else {
      result.$.String = options.string;
    }
  }

  if (options.enumMembers) {
    const value = options.enumMembers.map((member) => `${prefix}.${member}`).join(" ");
    if (options.asChildElement) {
      result.EnumMember = [value];
    } else {
      result.$.EnumMember = value;
    }
  }

  return result;
}

/**
 * An annotation of type `Collection(Edm.PropertyPath)`, e.g. `Core.OptimisticConcurrency`.
 *
 * An empty list yields an empty collection, which is what CAP emits and what the vocabulary documents as
 * "the service won't tell how it computes the ETag" - as valid a statement as one naming the properties.
 */
export function propertyPaths(
  vocabulary: keyof typeof VOCABULARIES,
  term: string,
  paths: Array<string>,
  options: Pick<AnnotationOptions, "fullyQualified" | "qualifier"> = {},
): Annotation {
  const result = annotation(vocabulary, term, options);
  result.Collection = [paths.length ? { PropertyPath: paths } : {}];
  return result;
}

/**
 * Shorthand for the vocabulary all currently evaluated terms come from.
 */
export function core(term: string, options?: AnnotationOptions): Annotation {
  return annotation("core", term, options);
}

/**
 * One entry of a `Validation.AllowedValues` collection: a value the property accepts, and the symbolic
 * name of that value where it has one. A record without a name is what a service states when it merely
 * restricts a value rather than enumerating it.
 */
export interface AllowedValue {
  value: number | string;
  name?: string;
}

/**
 * `Validation.AllowedValues` in the shape CAP emits it: a collection of records, each stating the value
 * as a property and its name as a nested `Core.SymbolicName`.
 */
export function allowedValues(values: Array<AllowedValue>, options: AnnotationOptions = {}): Annotation {
  const prefix = options.fullyQualified ? VOCABULARIES.validation.namespace : VOCABULARIES.validation.alias;

  return {
    ...annotation("validation", "AllowedValues", options),
    Collection: [
      {
        Record: values.map(({ value, name }) => ({
          $: { Type: `${prefix}.AllowedValue` },
          ...(name
            ? { Annotation: [core("SymbolicName", { fullyQualified: options.fullyQualified, string: name })] }
            : {}),
          PropertyValue: [
            {
              $: {
                Property: "Value",
                ...(typeof value === "number" ? { Int: String(value) } : { String: value }),
              },
            },
          ],
        })),
      },
    ],
  };
}

/**
 * `Core.Permissions`, whose value is a flags enum: several members may be granted at once.
 */
export function corePermissions(members: Array<string>, options?: AnnotationOptions): Annotation {
  return core("Permissions", { ...options, enumMembers: members.map((member) => `Permission/${member}`) });
}
