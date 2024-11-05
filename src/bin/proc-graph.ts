import GraphOperations, { Predicate } from '../lib/GraphOperations.ts';
import { promises as fs } from 'fs';

import Store from '../lib/Store.ts';
import opts, { CliOptions } from '../lib/proc-graph-opts.ts'
import { N, Q, Query, V } from '../lib/QueryBuilder.js';

const procGraph = async (store: Store, subSelect: Query, options: CliOptions) => {
  console.warn('Starting');
  console.warn('  getting predicates');

  const graph = new GraphOperations(store, { showProgBar: !options.noProgressBar });
  let basePreds = await graph.getPreds();
  let gm = await graph.globalMetrics(subSelect);

  const preds: { [key: string]: Predicate } = {};

  const scov = await graph.calcSubjectCoverage(subSelect);
  const ocov = await graph.calcObjectCoverage(subSelect);
  const bfs = await graph.calcBranchingFactor(basePreds);
  console.log('XXXXXXXXXXXXX', { bfs, basePreds })

  for (const [p, basePred] of Object.entries(basePreds)) {
    const s = scov[p] ?? 0;
    const o = ocov[p] ?? 0;
    const bf = bfs[p] ?? 0;
    preds[p] = {
      ...basePred,
      subjCoverage: s,
      objCoverage: o,
      branchingFactor: bf
    };
  }


  return { globalMetrics: gm, predicates: preds };
};

const run = async () => {
  const host = 'http://localhost';
  const repo = opts.repository || 'wordnet';
  const port = '3030';
  const endpointUrl = opts.endpoint || `${host}:${port}/${repo}/sparql`;
  const store = new Store({ endpointUrl })

  const a = N('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
  const synsetClass = N('http://www.w3.org/ns/lemon/ontolex#LexicalConcept');
  const subq = new Query().select('s')
    .where(Q(V('s'), a, synsetClass));

  const res = await procGraph(store, subq, opts);

  const file = opts.output || `proc-${repo}-results.json`;
  console.warn(`Saving output to ${file}`)
  await fs.writeFile(file, JSON.stringify(res, null, 2));
}



run();
