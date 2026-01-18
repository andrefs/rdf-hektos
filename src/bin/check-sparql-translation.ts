import { Query, COUNT, V, Q, N } from '../lib/QueryBuilder';

/**
 * Script to demonstrate how GraphOperation's calcBranchingFactor() queries
 * are translated to SPARQL using QueryBuilder's .toSparql() method.
 *
 * The calcBranchingFactor method calculates the number of distinct subjects
 * and objects for each predicate in the graph.
 */

const demonstrateCalcBranchingFactorSparql = () => {
  console.log('=== GraphOperations.calcBranchingFactor() SPARQL Translation ===\n');

  // Sample predicates (this replicates what calcBranchingFactor does for each predicate)
  const predicates = [
    'http://example.org/predicate1',
    'http://example.org/predicate2',
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
  ];

  predicates.forEach((predicateUri, index) => {
    console.log(`Predicate ${index + 1}: ${predicateUri}`);
    console.log('-'.repeat(60));

    // This is the exact query from calcBranchingFactor() method
    const query = new Query()
      .select(
        COUNT("s", "subjects", "distinct"),
        COUNT("o", "objects", "distinct"),
      )
      .where(Q(V("s"), N(predicateUri), V("o")));

    console.log('Generated SPARQL:');
    console.log(query.toSparql());
    console.log();
  });

  console.log('Internal QueryBuilder representation (for first predicate):');
  const sampleQuery = new Query()
    .select(
      COUNT("s", "subjects", "distinct"),
      COUNT("o", "objects", "distinct"),
    )
    .where(Q(V("s"), N(predicates[0]), V("o")));

  console.log(JSON.stringify(sampleQuery.obj, null, 2));
};

demonstrateCalcBranchingFactorSparql();