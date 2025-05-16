import { Query } from '../constants/queries_chart_info';

export const mergeQueryWithFirebase = (
  query: Query,
  firebaseQuery: Record<string, unknown> //TODO: fix type
) => {
  if (!firebaseQuery) {
    return query;
  }
  return {
    ...query,
    ...firebaseQuery,
  };
};
