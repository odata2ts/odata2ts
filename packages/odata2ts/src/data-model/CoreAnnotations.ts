import { ManagedState } from "../OptionModel.js";
import { Annotation } from "./edmx/ODataEdmxModelBase.js";

const CORE = "Org.OData.Core.V1";

const COMPUTED = `${CORE}.Computed`;
const COMPUTED_DEFAULT_VALUE = `${CORE}.ComputedDefaultValue`;
const IMMUTABLE = `${CORE}.Immutable`;
const PERMISSIONS = `${CORE}.Permissions`;

const PERMISSION_READ = `${CORE}.Permission/Read`;
const PERMISSION_WRITE = `${CORE}.Permission/Write`;

/**
 * The ways of stating a constant value, as an attribute and as a child element respectively. Everything
 * else an annotation may hold - `Path`, `If`, `Apply`, `Record`, ... - is a dynamic expression which only
 * resolves per instance or per request, so there is nothing to read at generation time.
 */
const CONSTANT_ATTRIBUTES = new Set(["Term", "Qualifier", "Bool", "String", "EnumMember"]);
const CONSTANT_ELEMENTS = new Set(["$", "Bool", "String", "EnumMember"]);

function isConstant(annotation: Annotation): boolean {
  return (
    Object.keys(annotation).every((element) => CONSTANT_ELEMENTS.has(element)) &&
    Object.keys(annotation.$).every((attribute) => CONSTANT_ATTRIBUTES.has(attribute))
  );
}

/**
 * The value of a constant annotation, be it stated as an attribute or as a child element.
 */
function getConstantValue(annotation: Annotation, name: "Bool" | "String" | "EnumMember"): string | undefined {
  return annotation.$[name] ?? annotation[name]?.[0]?.trim();
}

/**
 * Whether a tag term is set. A tag holds a boolean, and stating the term without a value means `true`.
 */
function isTagSet(annotations: Array<Annotation>, term: string): boolean {
  const annotation = annotations.find((a) => a.$.Term === term);
  return !!annotation && getConstantValue(annotation, "Bool") !== "false";
}

/**
 * The permissions granted to the client, as fully qualified enum member names. `Core.Permissions` is a
 * flags enum, so the value may name several of them, separated by whitespace.
 */
function getPermissions(annotations: Array<Annotation>): Array<string> | undefined {
  const annotation = annotations.find((a) => a.$.Term === PERMISSIONS);
  const value = annotation && getConstantValue(annotation, "EnumMember");
  return value?.split(/\s+/).filter((member) => !!member);
}

/**
 * How the service says a property is managed, or nothing where it says nothing about it.
 *
 * Terms are evaluated in the order of how much they take away from the client, because a property may
 * well carry more than one of them and the generated model can only reflect a single state.
 *
 * Note that the term names are expected to be fully qualified, which the {@link AnnotationResolver} has
 * taken care of before any of this is read.
 */
export function getManagedState(allAnnotations: Array<Annotation> | undefined): ManagedState | undefined {
  const annotations = allAnnotations?.filter(isConstant);
  if (!annotations?.length) {
    return undefined;
  }

  const permissions = getPermissions(annotations);
  const mayRead = !permissions || permissions.includes(PERMISSION_READ);
  const mayWrite = !permissions || permissions.includes(PERMISSION_WRITE);

  if (isTagSet(annotations, COMPUTED) || !mayWrite) {
    return ManagedState.readOnly;
  }
  if (!mayRead) {
    return ManagedState.writeOnly;
  }
  if (isTagSet(annotations, IMMUTABLE)) {
    return ManagedState.createOnly;
  }
  if (isTagSet(annotations, COMPUTED_DEFAULT_VALUE)) {
    return ManagedState.optionalWithDefault;
  }

  return undefined;
}
