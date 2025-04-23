const fetchStatements = async (resourceId: string) => {
  const url = `https://www.orkg.org/orkg/api/statements/bundle/${resourceId}?maxLevel=15`;
  const response = await fetch(url);
  const data = await response.json();
  return data.statements;
};

const countRPL = async (resourceIds: string[]) => {
  const resources = [];
  const literals = [];
  const predicates = [];

  const distResources = new Set();
  const distLiterals = new Set();
  const distPredicates = new Set();

  let totalStatements = 0;

  for (const id of resourceIds) {
    const statements = await fetchStatements(id);
    totalStatements += statements.length;

    for (const statement of statements) {
      const subject = statement.subject;
      const object = statement.object;
      const predicate = statement.predicate;

      if (subject._class === 'resource') {
        resources.push(subject.id);
        distResources.add(subject.id);
      } else {
        literals.push(subject.id);
        distLiterals.add(subject.id);
      }

      if (object._class === 'resource') {
        resources.push(object.id);
        distResources.add(object.id);
      } else {
        literals.push(object.id);
        distLiterals.add(object.id);
      }

      predicates.push(predicate.id);
      distPredicates.add(predicate.id);
    }
  }

  return {
    '#Statements': totalStatements,
    '#Resources': resources.length,
    '#DistResources': distResources.size,
    '#Literals': literals.length,
    '#DistLiterals': distLiterals.size,
    '#Predicates': predicates.length,
    '#DistPredicates': distPredicates.size,
  };
};

export { countRPL };
