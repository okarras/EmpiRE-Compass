const isEmptyObject = (obj: unknown): boolean => {
  if (typeof obj !== 'object' || obj === null) {
    return true;
  }

  return Object.keys(obj).length === 0;
};

export { isEmptyObject };
