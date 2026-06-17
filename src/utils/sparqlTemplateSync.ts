import { useEffect, useState } from 'react';
import { apiRequest, updateTemplate } from '../services/backendApi';

export const DEFAULT_TEMPLATE_ID = 'R186491';
export const NLP4RE_TEMPLATE_ID = 'R1544125';

export async function loadTemplateIntroText(
  templateId: string | null | undefined
): Promise<string | null> {
  const activeTemplateId = (templateId || DEFAULT_TEMPLATE_ID).toUpperCase();
  if (activeTemplateId === NLP4RE_TEMPLATE_ID) return null;
  try {
    const data = await apiRequest(`/api/templates/${activeTemplateId}`);
    return data?.introText ?? null;
  } catch {
    return null;
  }
}

export async function saveTemplateIntroText(
  templateId: string,
  introText: string,
  userId: string,
  userEmail: string
): Promise<void> {
  await updateTemplate(
    templateId,
    { introText: introText.trim() },
    userId,
    userEmail
  );
}

export function useTemplateIntroText(templateId: string | null | undefined) {
  const [introCustomText, setIntroCustomText] = useState<string | null>(null);

  useEffect(() => {
    const loadIntroText = async () => {
      setIntroCustomText(null);
      const text = await loadTemplateIntroText(templateId);
      setIntroCustomText(text);
    };
    void loadIntroText();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  return { introCustomText, setIntroCustomText };
}
