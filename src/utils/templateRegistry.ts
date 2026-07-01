/**
 * Template Registry - Centralized registry for available templates
 * This makes it easy to add new templates without modifying the UI components
 */

export interface TemplateInfo {
  id: string;
  label: string;
  description: string;
  category?: string;
}

export const AVAILABLE_TEMPLATES: TemplateInfo[] = [
  {
    id: 'R186491',
    label: 'Empirical Research Practice',
    description: 'Research practices with data collection and analysis methods',
    category: 'Research Methods',
  },
];

export const getTemplateById = (id: string): TemplateInfo | undefined => {
  return AVAILABLE_TEMPLATES.find((template) => template.id === id);
};

export const getTemplatesByCategory = (category: string): TemplateInfo[] => {
  return AVAILABLE_TEMPLATES.filter(
    (template) => template.category === category
  );
};

export const getAvailableCategories = (): string[] => {
  const categories = AVAILABLE_TEMPLATES.map(
    (template) => template.category
  ).filter((category): category is string => category !== undefined);

  return [...new Set(categories)].sort();
};

export const getDefaultTemplate = (): TemplateInfo => {
  return (
    AVAILABLE_TEMPLATES[0] || {
      id: 'R186491',
      label: 'Empirical Research Practice',
      description:
        'Research practices with data collection and analysis methods',
      category: 'Research Methods',
    }
  );
};
