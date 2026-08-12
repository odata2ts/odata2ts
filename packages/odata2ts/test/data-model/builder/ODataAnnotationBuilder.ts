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
 * Shorthand for the vocabulary all currently evaluated terms come from.
 */
export function core(term: string, options?: AnnotationOptions): Annotation {
  return annotation("core", term, options);
}

/**
 * `Core.Permissions`, whose value is a flags enum: several members may be granted at once.
 */
export function corePermissions(members: Array<string>, options?: AnnotationOptions): Annotation {
  return core("Permissions", { ...options, enumMembers: members.map((member) => `Permission/${member}`) });
}
