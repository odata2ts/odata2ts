import { ManagedState } from "../OptionModel.js";
import { Annotation } from "./edmx/ODataEdmxModelBase.js";

const CORE = "Org.OData.Core.V1";

const COMPUTED = `${CORE}.Computed`;
const COMPUTED_DEFAULT_VALUE = `${CORE}.ComputedDefaultValue`;
const IMMUTABLE = `${CORE}.Immutable`;
const PERMISSIONS = `${CORE}.Permissions`;

const OPTIMISTIC_CONCURRENCY = `${CORE}.OptimisticConcurrency`;
const OPTIONAL_PARAMETER = `${CORE}.OptionalParameter`;
const ALTERNATE_KEYS = `${CORE}.AlternateKeys`;

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

/**
 * Whether the service states that modifying this resource requires an ETag.
 *
 * Presence of the term is the whole statement. It is declared as `Collection(Edm.PropertyPath)` naming
 * the properties the ETag is computed from, but a client never needs them: the value always arrives in
 * the response. An empty collection is therefore just as good, and a legitimate form - the vocabulary
 * documents it as "the service won't tell how it computes the ETag", and CAP emits exactly that.
 *
 * Unlike {@link getManagedState} this does not filter for constant annotations: a collection of property
 * paths is none of the constant forms that check recognises.
 */
export function isOptimisticConcurrency(annotations: Array<Annotation> | undefined): boolean {
  return !!annotations?.some((a) => a.$.Term === OPTIMISTIC_CONCURRENCY);
}

/**
 * Whether the service states that this operation parameter may be omitted from the call, regardless of
 * what `Nullable` says: the two facets answer different questions - whether the parameter accepts
 * `null` when supplied, and whether it may be left out at all. `Core.OptionalParameter` carries a
 * `DefaultValue` in principle, but that is server-side substitution semantics with nothing for a client
 * to mirror, so presence of the term is the whole statement, like {@link isOptimisticConcurrency}.
 */
export function isOptionalParameter(annotations: Array<Annotation> | undefined): boolean {
  return !!annotations?.some((a) => a.$.Term === OPTIONAL_PARAMETER);
}

/**
 * One property of one alternate key, as `Core.PropertyRef` states it: the entity's own property name
 * (`Name`, declared `Edm.PropertyPath` - only a direct property is supported, not a nested one), and
 * the name to use in the URL instead of it, if the service states one (`Alias`).
 */
export interface AlternateKeyRef {
  name: string;
  alias?: string;
}

/**
 * The alternate keys a service declares for an entity via `Core.AlternateKeys`
 * (`Collection(Core.AlternateKey)`): one entry per alternate key, itself one or more
 * {@link AlternateKeyRef} for a composite one.
 *
 * Unlike {@link getManagedState} or {@link isOptimisticConcurrency} this term is neither a scalar
 * constant nor a bare tag - it is a `Collection(Record)` nested two levels deep
 * (`AlternateKey.Key` is itself `Collection(PropertyRef)`), so it gets its own structural walk rather
 * than reusing {@link isConstant}/{@link getConstantValue}.
 */
export function getAlternateKeys(
  annotations: Array<Annotation> | undefined,
): Array<Array<AlternateKeyRef>> | undefined {
  const annotation = annotations?.find((a) => a.$.Term === ALTERNATE_KEYS);
  const alternateKeyRecords = annotation?.Collection?.[0]?.Record;
  if (!alternateKeyRecords?.length) {
    return undefined;
  }

  return alternateKeyRecords.map((record) => {
    const keyPropertyValue = record.PropertyValue?.find((pv) => pv.$.Property === "Key");
    const propertyRefRecords = keyPropertyValue?.Collection?.[0]?.Record ?? [];

    return propertyRefRecords.map((propertyRef) => {
      const nameValue = propertyRef.PropertyValue?.find((pv) => pv.$.Property === "Name");
      const aliasValue = propertyRef.PropertyValue?.find((pv) => pv.$.Property === "Alias");
      const name = nameValue?.$.PropertyPath ?? nameValue?.$.String;

      if (!name) {
        throw new Error(`${ALTERNATE_KEYS}: a PropertyRef without a Name/PropertyPath was found!`);
      }
      if (name.includes("/")) {
        throw new Error(
          `${ALTERNATE_KEYS}: nested property path "${name}" is not supported - only a direct property` +
            ` of the entity type may form an alternate key.`,
        );
      }

      return { name, alias: aliasValue?.$.String };
    });
  });
}
