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
