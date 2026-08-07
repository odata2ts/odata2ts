import { withNamespace } from "./DataModel.js";
import { ComplexType, EntityType, Property, Schema } from "./edmx/ODataEdmxModelBase.js";

/**
 * The character by which a service joins the path of a flattened structured element. SAP CAP uses the
 * underscore and that is the only spelling in the field, hence it is fixed rather than configurable.
 */
const SEPARATOR = "_";

/**
 * The leaf name which marks a group as a foreign key rather than a structured element, as long as it is the
 * only one under that prefix.
 */
const FOREIGN_KEY_LEAF = "Id";

/**
 * One structured element that a service has unfolded into a property per leaf, reconstructed as a tree:
 * a node is either a leaf, carrying the flat EDMX property it stands for, or a nested group.
 */
interface GroupNode {
  leaf?: Property;
  children?: Map<string, GroupNode>;
}

function isLeaf(node: GroupNode): node is Required<Pick<GroupNode, "leaf">> {
  return !!node.leaf;
}

/**
 * Reshapes structured elements which a service states flat - one property per leaf, joined by an
 * underscore - back into complex properties, by rewriting the EDMX before it is digested.
 *
 * Rewriting the source rather than the digested data model is what keeps this feature contained: from the
 * digester's point of view the service simply declared a complex property in the first place, so naming,
 * per-property configuration, converters and every generator downstream need to know nothing about it.
 *
 * See the `unflattenComplexTypes` option for what is grouped and what deliberately is not.
 */
export class ComplexTypeUnflattener<ET extends EntityType, CT extends ComplexType> {
  /**
   * All complex types of all schemas by their fully qualified name - the pool that a group of flat
   * properties is matched against, so an existing type is reused instead of a synthesized one.
   */
  private readonly complexTypes = new Map<string, CT>();

  constructor(
    private readonly schemas: Array<Schema<ET, CT>>,
    /**
     * The names of the navigation properties of a model. A group named like one of them is a foreign key,
     * not a structured element.
     */
    private readonly getNavPropNames: (model: ET | CT) => Array<string>,
  ) {
    for (const schema of schemas) {
      for (const ct of schema.ComplexType ?? []) {
        this.complexTypes.set(withNamespace(schema.$.Namespace, ct.$.Name), ct);
      }
    }
  }

  /**
   * Every property this shaper formed, as `<fully qualified model name>/<property name>`. The generator
   * needs to tell them from complex properties the service declared itself: only these travel and are
   * queried flat, so only these get a {@link QFlatComplexPath}.
   */
  private readonly reshaped = new Set<string>();

  /**
   * Groups the flat properties of every entity and complex type back into complex properties, mutating the
   * schemas in place. Complex types synthesized on the way are appended to the schema of the model that
   * needed them.
   *
   * @returns the reshaped properties, see {@link reshaped}
   */
  public unflatten(): Set<string> {
    for (const schema of this.schemas) {
      const synthesized: Array<CT> = [];

      for (const model of [...(schema.EntityType ?? []), ...(schema.ComplexType ?? [])]) {
        this.reshapeModel(schema, model, synthesized);
      }

      if (synthesized.length) {
        schema.ComplexType = [...(schema.ComplexType ?? []), ...synthesized];
      }
    }

    return this.reshaped;
  }

  private reshapeModel(schema: Schema<ET, CT>, model: ET | CT, synthesized: Array<CT>): void {
    const props = model.Property ?? [];
    if (!props.length) {
      return;
    }

    const blocked = new Set([
      ...this.getNavPropNames(model),
      // a key is addressed by name in every URL of the entity; burying it inside a complex property would
      // take that away, so it stays where the service put it
      ...((model as EntityType).Key?.[0]?.PropertyRef ?? []).map((ref) => ref.$.Name),
    ]);

    const groups = this.buildGroups(props, blocked);
    if (!groups.size) {
      return;
    }

    const replacements = new Map<string, Property>();
    for (const [name, node] of groups) {
      const fqType = this.resolveType(schema, model, name, node, synthesized);
      if (fqType) {
        this.reshaped.add(`${withNamespace(schema.$.Namespace, model.$.Name)}/${name}`);
        replacements.set(name, {
          $: {
            Name: name,
            Type: fqType,
            // a flattened structured element carries no nullability of its own; it is only non-nullable
            // where every one of its leaves is
            Nullable: collectLeaves(node).every((leaf) => leaf.$.Nullable === "false") ? "false" : "true",
          },
        });
      }
    }

    if (!replacements.size) {
      return;
    }

    // keep the declaration order of the service: the group takes the place of its first member
    const consumed = new Set<string>();
    for (const [name, node] of groups) {
      if (replacements.has(name)) {
        collectLeaves(node).forEach((leaf) => consumed.add(leaf.$.Name));
      }
    }

    const result: Array<Property> = [];
    for (const prop of props) {
      if (!consumed.has(prop.$.Name)) {
        result.push(prop);
        continue;
      }
      const groupName = prop.$.Name.split(SEPARATOR)[0];
      const replacement = replacements.get(groupName);
      if (replacement) {
        result.push(replacement);
        replacements.delete(groupName);
      }
    }
    model.Property = result;
  }

  /**
   * Builds the group tree of those properties whose name carries a separator, and drops every group that
   * cannot be told apart from an ordinary property with an underscore in its name.
   *
   * A group is discarded when it is blocked (a navigation property or a key), when it collides with a
   * property the service declares under the group name itself, when any of its segments is empty - CAP's
   * `Location_` sits right next to `Location_Id` and neither is a structured element - or when it consists
   * of nothing but an `Id`, which makes it a foreign key.
   */
  private buildGroups(props: Array<Property>, blocked: Set<string>): Map<string, GroupNode> {
    const declaredNames = new Set(props.map((p) => p.$.Name));
    const groups = new Map<string, GroupNode>();
    const discarded = new Set<string>();

    for (const prop of props) {
      const segments = prop.$.Name.split(SEPARATOR);
      if (segments.length < 2) {
        continue;
      }
      const groupName = segments[0];
      if (discarded.has(groupName)) {
        continue;
      }
      if (
        segments.some((segment) => !segment) ||
        blocked.has(prop.$.Name) ||
        blocked.has(groupName) ||
        declaredNames.has(groupName)
      ) {
        discarded.add(groupName);
        groups.delete(groupName);
        continue;
      }

      if (!this.addToTree(groups, segments, prop)) {
        discarded.add(groupName);
        groups.delete(groupName);
      }
    }

    // A lone `Publisher_Id` is a foreign key. OData does not require a service to state one as a property
    // at all - the navigation property alone traverses the relation - but where one does, as SAP CAP does,
    // it spells it exactly like a flattened structured element. Reading it as a foreign key costs only the
    // ability to recognise a complex type which consists of nothing but a property named `Id`, whereas
    // `Publisher_Id` next to `Publisher_Name` is a structured element again.
    for (const [groupName, node] of groups) {
      const onlyChild = node.children?.size === 1 ? node.children.get(FOREIGN_KEY_LEAF) : undefined;
      if (onlyChild && isLeaf(onlyChild)) {
        groups.delete(groupName);
      }
    }

    return groups;
  }

  /**
   * Files one flat property into the group tree. Fails where a name is used as both a leaf and a group
   * (`A_B` next to `A_B_C`), which no structured element can produce and which therefore means the
   * underscore is part of the name rather than a separator.
   */
  private addToTree(root: Map<string, GroupNode>, segments: Array<string>, prop: Property): boolean {
    let level = root;

    for (let i = 0; i < segments.length - 1; i++) {
      const existing = level.get(segments[i]);
      if (existing && isLeaf(existing)) {
        return false;
      }
      const node: GroupNode = existing ?? { children: new Map() };
      level.set(segments[i], node);
      level = node.children!;
    }

    const lastSegment = segments[segments.length - 1];
    if (level.has(lastSegment)) {
      return false;
    }
    level.set(lastSegment, { leaf: prop });
    return true;
  }

  /**
   * The type a group is stated as: an existing complex type wherever one matches the group exactly, so the
   * generated client speaks the vocabulary of the service instead of an invented one. Only where the
   * service never declares the type - which happens when it uses the structured element in no other place -
   * is one synthesized.
   */
  private resolveType(
    schema: Schema<ET, CT>,
    model: ET | CT,
    groupName: string,
    node: GroupNode,
    synthesized: Array<CT>,
  ): string | undefined {
    const children = node.children;
    if (!children?.size) {
      return undefined;
    }

    const matches = [...this.complexTypes].filter(([, candidate]) => this.matches(candidate, children));
    if (matches.length) {
      // several complex types can be structurally identical - `DateRange` and a hypothetical `Period` both
      // being {From, To} - in which case the one named after the group is the one the service means
      const byName = matches.find(([fqName]) => fqName.split(".").pop()!.endsWith(groupName));
      return (byName ?? matches[0])[0];
    }

    return this.synthesize(schema, model, groupName, children, synthesized);
  }

  /**
   * Whether a complex type states exactly the group: the same property names, the same types, and nothing
   * on either side that the other does not have. Anything less than exact would silently type a property
   * as something the service does not send.
   */
  private matches(candidate: CT, children: Map<string, GroupNode>): boolean {
    const candidateProps = candidate.Property ?? [];
    if (candidateProps.length !== children.size) {
      return false;
    }

    return candidateProps.every((candidateProp) => {
      const child = children.get(candidateProp.$.Name);
      if (!child) {
        return false;
      }
      if (isLeaf(child)) {
        return child.leaf.$.Type === candidateProp.$.Type;
      }
      // a nested group only matches a nested complex type, which has to match in turn
      const nested = this.complexTypes.get(candidateProp.$.Type);
      return !!nested && !!child.children && this.matches(nested, child.children);
    });
  }

  /**
   * Declares a complex type for a group the service states nowhere else, named after the model it was found
   * in and the group itself (`Members` + `Address` -> `Members_Address`), which keeps it recognisable and
   * unique without inventing domain vocabulary.
   */
  private synthesize(
    schema: Schema<ET, CT>,
    model: ET | CT,
    groupName: string,
    children: Map<string, GroupNode>,
    synthesized: Array<CT>,
  ): string | undefined {
    const name = `${model.$.Name}${SEPARATOR}${groupName}`;
    const fqName = withNamespace(schema.$.Namespace, name);
    if (this.complexTypes.has(fqName)) {
      return undefined;
    }

    const props: Array<Property> = [];
    for (const [childName, child] of children) {
      if (isLeaf(child)) {
        props.push({ ...child.leaf, $: { ...child.leaf.$, Name: childName } });
        continue;
      }
      const nestedType = this.synthesize(
        schema,
        model,
        `${groupName}${SEPARATOR}${childName}`,
        child.children!,
        synthesized,
      );
      if (!nestedType) {
        return undefined;
      }
      props.push({ $: { Name: childName, Type: nestedType, Nullable: "true" } });
    }

    const complexType = { $: { Name: name }, Property: props } as unknown as CT;
    this.complexTypes.set(fqName, complexType);
    synthesized.push(complexType);
    return fqName;
  }
}

function collectLeaves(node: GroupNode): Array<Property> {
  if (isLeaf(node)) {
    return [node.leaf];
  }
  return [...(node.children?.values() ?? [])].flatMap(collectLeaves);
}
