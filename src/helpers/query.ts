import { Query } from '../constants/queries_chart_info';

const sameId = (left: unknown, right: unknown) =>
  left != null && right != null && String(left) === String(right);

/**
 * Main Firebase question documents are keyed by their `uid` field
 * (`query_6_1`, not the code constant that names the other tab).
 * Match the document by id, then by either tab uid.
 */
export const findFirebaseQuestion = <
  T extends { id?: unknown; uid?: string; uid_2?: string },
>(
  questions: T[],
  query: { id?: unknown; uid?: string; uid_2?: string }
): T | undefined =>
  questions.find((question) => sameId(question.id, query.id)) ||
  questions.find((question) => question.uid === query.uid) ||
  questions.find(
    (question) => query.uid_2 != null && question.uid === query.uid_2
  ) ||
  questions.find(
    (question) =>
      question.uid_2 != null &&
      (question.uid_2 === query.uid || question.uid_2 === query.uid_2)
  );

export const mergeQueryWithFirebase = (
  query: Query,
  firebaseQuery: Record<string, unknown> | undefined
) => {
  if (!firebaseQuery) {
    return query;
  }

  const firebaseData = { ...firebaseQuery };
  delete firebaseData.dataProcessingFunction;
  delete firebaseData.dataProcessingFunction2;
  delete firebaseData.dataProcessingFunctionName;
  delete firebaseData.dataProcessingFunctionName2;

  return {
    ...query,
    ...firebaseData,
    // Firebase stores function names as strings. The implementations live in code
    // and are paired with the SPARQL shape for each question.
    dataProcessingFunction: query.dataProcessingFunction,
    dataProcessingFunction2: query.dataProcessingFunction2,
  };
};
