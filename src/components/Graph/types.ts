// Types representing the JSON schema pieces we use
export type Template = {
  id: string;
  label: string;
  description?: string | null;
  target_class: {
    id: string;
    label: string;
  };
  properties?: TemplateProperty[];
};

export type TemplateProperty = {
  id: string;
  label: string;
  description?: string | null;
  order?: number;
  min_count: number | null;
  max_count: number | null;
  path: { id: string; label: string };
  class?: { id: string; label: string };
  datatype?: { id: string; label: string };
};

export type TemplateGraphProps = {
  data: Template[];
  loading?: boolean;
  error?: string | null;
};

export type PropertyMapping = {
  /**
   * Human-friendly label that has historically been used across prompts/graphs.
   * For object properties this is typically the target class label.
   */
  label: string;
  cardinality: string;
  description: string;
  /**
   * Explicit predicate label (always derived from the path label).
   * Helps explain predicates even when they point to subtemplates.
   */
  predicate_label?: string;
  /**
   * Optional metadata about the target class/subtemplate.
   */
  class_id?: string;
  class_label?: string;
  subtemplate_id?: string;
  subtemplate_label?: string;
  subtemplate_properties?: Record<string, PropertyMapping>;
};

export type PredicatesMapping = Record<string, PropertyMapping>;
