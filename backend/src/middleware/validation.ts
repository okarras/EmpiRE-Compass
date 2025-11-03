import { Request, Response, NextFunction } from 'express';

/**
 * Validate SPARQL query syntax (basic validation)
 * Only validates if sparqlQuery is present in body
 */
export const validateSPARQLQuery = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Check if sparqlQuery exists in body (could be sparqlQuery or sparqlQuery2)
  const sparqlQuery = req.body.sparqlQuery || req.body.sparqlQuery2;

  // If no SPARQL query present, skip validation
  if (!sparqlQuery) {
    return next();
  }

  if (typeof sparqlQuery !== 'string') {
    return res.status(400).json({ error: 'SPARQL query must be a string' });
  }

  // Basic validation
  if (sparqlQuery.length > 50000) {
    return res
      .status(400)
      .json({ error: 'SPARQL query too long (max 50000 characters)' });
  }

  // Check for dangerous patterns (basic security)
  const dangerousPatterns = [
    /DELETE\s+DATA/i,
    /DROP\s+GRAPH/i,
    /CREATE\s+GRAPH/i,
    /;.*;/, // Multiple statements
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(sparqlQuery)) {
      return res.status(400).json({
        error: 'Query contains potentially dangerous operations',
      });
    }
  }

  next();
};

/**
 * Validate request body has required fields
 */
export const validateRequiredFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing = fields.filter((field) => !req.body[field]);

    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missing.join(', ')}`,
      });
    }

    next();
  };
};
