let _activeTemplateId = 'empirical';

export const setActiveTemplate = (templateId?: string) => {
  _activeTemplateId = templateId || 'empirical';
};

export const getActiveTemplate = () => _activeTemplateId;
