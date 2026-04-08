import { apiRequest } from './backendApi';
import type { OrkgStatement } from '../types/orkgStatements';

/**
 * ORKG statements bundle (subject–predicate–object) via backend proxy.
 * @see https://www.orkg.org/ — bundle matches ORKG’s public API shape.
 */
export async function fetchOrkgStatementsBundle(
  resourceId: string,
  maxLevel = 15
): Promise<OrkgStatement[]> {
  const data = await apiRequest<{ statements: OrkgStatement[] }>(
    `/api/statements/bundle/${encodeURIComponent(resourceId)}?maxLevel=${maxLevel}`
  );
  return data.statements ?? [];
}
