/* eslint-disable @typescript-eslint/no-explicit-any */
import qs from 'qs';

// Base API configuration
const API_BASE_URL = 'https://orkg.org/api/';

// Types
export interface Node {
  id: string;
  label: string;
  classes?: string[];
}

export interface PropertyShape {
  id?: string;
  path: string;
  name: string;
  description?: string;
  minCount?: number;
  maxCount?: number;
  order?: number;
  deactivated?: boolean;
  class?: Node;
  datatype?: string;
  nodeKind?: string;
}

export interface Template {
  id: string;
  label: string;
  description: string;
  formatted_label: string;
  target_class: Node;
  relations: {
    research_fields: Node[];
    research_problems: Node[];
    predicate?: Node;
  };
  properties: PropertyShape[];
  is_closed: boolean;
  organizations: string[];
  observatories: string[];
  created_at: string;
  created_by: string;
  visibility: string;
  unlisted_by?: string;
}

export interface Statement {
  id: string;
  subject: {
    id: string;
    label: string;
    classes?: string[];
  };
  predicate: {
    id: string;
    label: string;
  };
  object: {
    id: string;
    label: string;
    classes?: string[];
  };
  created_at: string;
  created_by: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sortBy?: Array<{ property: string; direction: 'asc' | 'desc' }>;
}

export type GetStatementsParams<T extends boolean = true> = {
  subjectClasses?: string[];
  subjectId?: string;
  subjectLabel?: string;
  predicateId?: string;
  createdBy?: string;
  createdAtStart?: string;
  createdAtEnd?: string;
  objectClasses?: string[];
  objectId?: string;
  objectLabel?: string;
  returnFormattedLabels?: boolean;
  returnContent?: T;
} & PaginationParams;

// Constants
export const CLASSES = {
  NODE_SHAPE: 'NodeShape',
} as const;

export const PREDICATES = {
  SHACL_TARGET_CLASS: 'sh:targetClass',
} as const;

// Simple fetch wrapper for templates (requires specific media type)
const templateApiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    accept: 'application/vnd.orkg.template.v1+json',
    'User-Agent': 'Mozilla/5.0 (compatible; EmpiRE-Compass/1.0)',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    // Add cache-busting to avoid stale service worker cache
    cache: 'no-cache',
  });

  if (!response.ok) {
    throw new Error(
      `Template API request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};

// Simple fetch wrapper for statements (uses standard JSON)
const statementApiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    accept: 'application/json',
    'User-Agent': 'Mozilla/5.0 (compatible; EmpiRE-Compass/1.0)',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    // Add cache-busting to avoid stale service worker cache
    cache: 'no-cache',
  });

  if (!response.ok) {
    throw new Error(
      `Statement API request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};

// Get a single template by ID
export const getTemplate = (id: string): Promise<Template> => {
  return templateApiRequest<Template>(`templates/${id}`);
};

// Get statements
export const getStatements = <T extends boolean = true>({
  subjectClasses = [],
  subjectId = undefined,
  subjectLabel = undefined,
  predicateId = undefined,
  createdBy = undefined,
  createdAtStart = undefined,
  createdAtEnd = undefined,
  objectClasses = [],
  objectId = undefined,
  objectLabel = undefined,
  page = 0,
  size = 9999,
  sortBy = [{ property: 'created_at', direction: 'desc' }],
  returnContent = true as T,
  returnFormattedLabels = false,
}: GetStatementsParams<T>): Promise<
  T extends true ? Statement[] : PaginatedResponse<Statement>
> => {
  let headers;
  if (returnFormattedLabels) {
    headers = {
      'Content-Type': 'application/json;charset=utf-8',
      Accept: 'application/json;formatted-labels=V1',
    };
  }

  const sort = sortBy
    .map(({ property, direction }) => `${property},${direction}`)
    .join(',');
  const searchParams = qs.stringify(
    {
      subject_classes:
        subjectClasses.length > 0 ? subjectClasses.join(',') : undefined,
      subject_id: subjectId,
      subject_label: subjectLabel,
      predicate_id: predicateId,
      created_by: createdBy,
      created_at_start: createdAtStart,
      created_at_end: createdAtEnd,
      object_classes:
        objectClasses.length > 0 ? objectClasses.join(',') : undefined,
      object_id: objectId,
      object_label: objectLabel,
      page,
      size,
      sort,
    },
    {
      skipNulls: true,
    }
  );

  return statementApiRequest<PaginatedResponse<Statement>>(
    `statements/?${searchParams}`,
    { headers }
  ).then((res) => (returnContent ? res.content : res)) as Promise<
    T extends true ? Statement[] : PaginatedResponse<Statement>
  >;
};

// Get templates by class
export const getTemplatesByClass = (classID: string): Promise<string[]> =>
  getStatements({
    objectId: classID,
    predicateId: PREDICATES.SHACL_TARGET_CLASS,
  })
    .then((statements) => {
      const templateIds = (statements as Statement[])
        .filter((statement: Statement) =>
          statement.subject.classes?.includes(CLASSES.NODE_SHAPE)
        )
        .map((st) => st.subject.id)
        .filter((c) => c);

      return templateIds;
    })
    .catch((error) => {
      console.error(`Error fetching templates for class ${classID}:`, error);
      return [];
    });

// Load template flow by ID
export const loadTemplateFlowByID = (
  id: string,
  loadedNodes: Set<string>
): Promise<object> => {
  if (!loadedNodes.has(id)) {
    loadedNodes.add(id);
    return getTemplate(id).then(async (t) => {
      const promises: Promise<object>[] = t.properties
        .filter((ps) => ps.class && ps.class.id)
        .map(async (ps) => {
          try {
            // Try to find templates that target this class
            const templateIds = await getTemplatesByClass(ps.class!.id);

            if (templateIds.length > 0) {
              // Only load actual templates (resources starting with 'R'), not classes or other types
              const resourceTemplateIds = templateIds.filter((templateId) =>
                templateId.startsWith('R')
              );

              if (resourceTemplateIds.length > 0) {
                // Load the first actual template for this class
                const subtemplate = await loadTemplateFlowByID(
                  resourceTemplateIds[0],
                  loadedNodes
                );
                return subtemplate;
              }
            }

            // If no actual template found for this class, don't create a placeholder
            // Just return empty object to be filtered out
            return {};
          } catch (error) {
            console.warn(
              `Failed to load template for class ${ps.class!.id}:`,
              error
            );
            return {};
          }
        });

      const neighborNodes = await Promise.all(promises);
      // Only keep actual templates, filter out empty objects and placeholders
      const filteredNeighbors = neighborNodes.filter(
        (n: any) =>
          Object.keys(n).length > 0 &&
          n.id &&
          !n.is_placeholder &&
          typeof n.id === 'string' &&
          n.id.startsWith('R')
      );

      return {
        ...t,
        neighbors: filteredNeighbors,
      };
    });
  }
  return Promise.resolve({});
};
