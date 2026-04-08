export interface OrkgStatementSubject {
  id: string;
  _class: 'resource' | 'literal';
  label?: string;
}

export interface OrkgStatementObject {
  id: string;
  _class: 'resource' | 'literal';
  label?: string;
}

export interface OrkgStatementPredicate {
  id: string;
  label?: string;
}

export interface OrkgStatement {
  subject: OrkgStatementSubject;
  object: OrkgStatementObject;
  predicate: OrkgStatementPredicate;
}
