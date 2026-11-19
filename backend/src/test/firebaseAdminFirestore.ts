/**
 * Stand-in for `firebase-admin/firestore` during `npm test`.
 *
 * CI installs the repository root only. The backend dependency is not
 * present, and Vite fails the suite while resolving the real package.
 * Unit tests mock `config/firebase` and never talk to Firestore.
 */
export class Timestamp {
  private constructor(private readonly millis: number) {}

  static now(): Timestamp {
    return new Timestamp(Date.now());
  }

  static fromMillis(millis: number): Timestamp {
    return new Timestamp(millis);
  }

  static fromDate(date: Date): Timestamp {
    return new Timestamp(date.getTime());
  }

  toMillis(): number {
    return this.millis;
  }

  toDate(): Date {
    return new Date(this.millis);
  }
}

export const FieldValue = {
  serverTimestamp: () => ({ _methodName: 'serverTimestamp' }),
};

export function getFirestore(): never {
  throw new Error('Firestore is not available in unit tests.');
}

export type Firestore = object;
