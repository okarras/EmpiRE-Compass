import { db } from '../config/firebase.js';
import type {
  QuestionData,
  StatisticData,
  TemplateData,
} from '../routes/templates/swaggerSchemas.js';

let templatesCache: Record<string, TemplateData> | null = null;
let templatesCacheTime = 0;
const TEMPLATES_CACHE_TTL_MS = 60 * 1000; // 1 minute

const questionsCache: Record<string, { data: QuestionData[]; time: number }> =
  {};
const QUE_CACHE_TTL_MS = 60 * 1000; // 1 minute

const statsCache: Record<string, { data: StatisticData[]; time: number }> = {};
const STATS_CACHE_TTL_MS = 60 * 1000; // 1 minute

export function invalidateTemplatesCache(): void {
  templatesCache = null;
}

export function invalidateQuestionsCache(templateId: string): void {
  delete questionsCache[templateId];
}

export function invalidateStatsCache(templateId: string): void {
  delete statsCache[templateId];
}

export function invalidateTemplateNestedCaches(templateId: string): void {
  delete questionsCache[templateId];
  delete statsCache[templateId];
}

export async function getAllTemplates(): Promise<Record<string, TemplateData>> {
  const now = Date.now();
  if (templatesCache && now - templatesCacheTime < TEMPLATES_CACHE_TTL_MS) {
    return templatesCache;
  }

  const templatesSnapshot = await db.collection('Templates').get();
  const templates: Record<string, TemplateData> = {};

  templatesSnapshot.forEach((doc) => {
    templates[doc.id] = { id: doc.id, ...doc.data() } as TemplateData;
  });

  templatesCache = templates;
  templatesCacheTime = now;

  return templates;
}

export async function getTemplateById(
  templateId: string
): Promise<TemplateData | null> {
  const templateDoc = await db.collection('Templates').doc(templateId).get();

  if (!templateDoc.exists) {
    return null;
  }

  return { id: templateDoc.id, ...templateDoc.data() } as TemplateData;
}

export async function createTemplate(
  templateData: TemplateData
): Promise<TemplateData> {
  const templateRef = db.collection('Templates').doc(templateData.id);
  await templateRef.set(templateData);
  invalidateTemplatesCache();
  return { ...templateData, id: templateRef.id };
}

export async function updateTemplate(
  templateId: string,
  updates: Partial<TemplateData>
): Promise<{ ok: true } | { ok: false; reason: 'not_found' }> {
  const templateRef = db.collection('Templates').doc(templateId);
  const doc = await templateRef.get();

  if (!doc.exists) {
    return { ok: false, reason: 'not_found' };
  }

  await templateRef.update(updates);
  invalidateTemplatesCache();
  return { ok: true };
}

export async function deleteTemplate(
  templateId: string
): Promise<{ ok: true } | { ok: false; reason: 'not_found' }> {
  const templateRef = db.collection('Templates').doc(templateId);
  const doc = await templateRef.get();

  if (!doc.exists) {
    return { ok: false, reason: 'not_found' };
  }

  await templateRef.delete();
  invalidateTemplatesCache();
  invalidateTemplateNestedCaches(templateId);
  return { ok: true };
}

export async function getQuestions(
  templateId: string
): Promise<QuestionData[]> {
  const now = Date.now();
  const cached = questionsCache[templateId];

  if (cached && now - cached.time < QUE_CACHE_TTL_MS) {
    return cached.data;
  }

  const questionsSnapshot = await db
    .collection('Templates')
    .doc(templateId)
    .collection('Questions')
    .get();

  const questions: QuestionData[] = [];
  questionsSnapshot.forEach((doc) => {
    questions.push(doc.data() as QuestionData);
  });

  questions.sort((a, b) => a.id - b.id);

  questionsCache[templateId] = { data: questions, time: now };

  return questions;
}

export async function getQuestionById(
  templateId: string,
  questionId: string
): Promise<QuestionData | null> {
  const questionDoc = await db
    .collection('Templates')
    .doc(templateId)
    .collection('Questions')
    .doc(questionId)
    .get();

  if (!questionDoc.exists) {
    return null;
  }

  return questionDoc.data() as QuestionData;
}

export function resolveQuestionDocId(questionData: QuestionData): string {
  return questionData.uid && questionData.uid.trim().length > 0
    ? questionData.uid
    : String(questionData.id);
}

export async function createQuestion(
  templateId: string,
  questionData: QuestionData
): Promise<Omit<QuestionData, 'id'> & { id: string }> {
  const questionDocId = resolveQuestionDocId(questionData);

  const questionRef = db
    .collection('Templates')
    .doc(templateId)
    .collection('Questions')
    .doc(questionDocId);

  await questionRef.set(questionData);
  invalidateQuestionsCache(templateId);

  return { ...questionData, id: questionRef.id };
}

export async function updateQuestion(
  templateId: string,
  questionId: string,
  updates: Partial<QuestionData>
): Promise<{ ok: true; id: string } | { ok: false; reason: 'not_found' }> {
  const questionRef = db
    .collection('Templates')
    .doc(templateId)
    .collection('Questions')
    .doc(questionId);

  const doc = await questionRef.get();
  if (!doc.exists) {
    const questionsCollection = db
      .collection('Templates')
      .doc(templateId)
      .collection('Questions');
    const legacyDoc = await questionsCollection
      .where('id', '==', Number(questionId))
      .limit(1)
      .get();

    if (!legacyDoc.empty) {
      const legacyDocRef = legacyDoc.docs[0].ref;
      await legacyDocRef.update(updates);
      invalidateQuestionsCache(templateId);
      return { ok: true, id: legacyDocRef.id };
    }

    return { ok: false, reason: 'not_found' };
  }

  await questionRef.update(updates);
  invalidateQuestionsCache(templateId);
  return { ok: true, id: questionId };
}

export async function deleteQuestion(
  templateId: string,
  questionId: string
): Promise<{ ok: true } | { ok: false; reason: 'not_found' }> {
  const questionRef = db
    .collection('Templates')
    .doc(templateId)
    .collection('Questions')
    .doc(questionId);

  const doc = await questionRef.get();
  if (!doc.exists) {
    const questionsCollection = db
      .collection('Templates')
      .doc(templateId)
      .collection('Questions');
    const legacyDoc = await questionsCollection
      .where('id', '==', Number(questionId))
      .limit(1)
      .get();

    if (!legacyDoc.empty) {
      const legacyDocRef = legacyDoc.docs[0].ref;
      await legacyDocRef.delete();
      invalidateQuestionsCache(templateId);
      return { ok: true };
    }

    return { ok: false, reason: 'not_found' };
  }

  await questionRef.delete();
  invalidateQuestionsCache(templateId);
  return { ok: true };
}

export async function getStatistics(
  templateId: string
): Promise<StatisticData[]> {
  const now = Date.now();
  const cached = statsCache[templateId];

  if (cached && now - cached.time < STATS_CACHE_TTL_MS) {
    return cached.data;
  }

  const statisticsSnapshot = await db
    .collection('Templates')
    .doc(templateId)
    .collection('Statistics')
    .get();

  const statistics: StatisticData[] = [];
  statisticsSnapshot.forEach((doc) => {
    statistics.push({ id: doc.id, ...doc.data() } as StatisticData);
  });

  statsCache[templateId] = { data: statistics, time: now };

  return statistics;
}

export async function createStatistic(
  templateId: string,
  statisticData: StatisticData
): Promise<StatisticData> {
  const statisticRef = db
    .collection('Templates')
    .doc(templateId)
    .collection('Statistics')
    .doc(statisticData.id);

  await statisticRef.set(statisticData);
  invalidateStatsCache(templateId);

  return { ...statisticData, id: statisticRef.id };
}

export async function updateStatistic(
  templateId: string,
  statisticId: string,
  updates: Partial<StatisticData>
): Promise<{ ok: true } | { ok: false; reason: 'not_found' }> {
  const statisticRef = db
    .collection('Templates')
    .doc(templateId)
    .collection('Statistics')
    .doc(statisticId);

  const doc = await statisticRef.get();
  if (!doc.exists) {
    return { ok: false, reason: 'not_found' };
  }

  await statisticRef.update(updates);
  invalidateStatsCache(templateId);
  return { ok: true };
}

export async function deleteStatistic(
  templateId: string,
  statisticId: string
): Promise<{ ok: true } | { ok: false; reason: 'not_found' }> {
  const statisticRef = db
    .collection('Templates')
    .doc(templateId)
    .collection('Statistics')
    .doc(statisticId);

  const doc = await statisticRef.get();
  if (!doc.exists) {
    return { ok: false, reason: 'not_found' };
  }

  await statisticRef.delete();
  invalidateStatsCache(templateId);
  return { ok: true };
}
