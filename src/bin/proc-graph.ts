import GraphOperations from '../lib/GraphOperations';
import {promises as fs} from 'fs';

import Store from '../lib/Store';
import opts, { CliOptions } from '../lib/opts'
import { N, Q, Query, V } from '../lib/QueryBuilder';

const procGraph = async (store: Store, subSelect: Query, options: CliOptions) => {
  console.warn('Starting');
  console.warn('  getting predicates');

  const graph = new GraphOperations(store, {showProgBar: !options.noProgressBar});
  let preds = await graph.getPreds();

  let gm = await graph.globalMetrics(subSelect);

  const scov = await graph.calcSubjectCoverage(subSelect);
  for(const [p, c] of scov){
    preds[p].subjCoverage = c;
  }

  const ocov = await graph.calcObjectCoverage(subSelect);
  for(const [p, c] of ocov){
    preds[p].objCoverage = c;
  }

  const bfs = await graph.calcBranchingFactor(preds);
  for(const [p, bf] of bfs){
    preds[p].branchingFactor = bf;
  }

  return {globalMetrics: gm, predicates: preds};
};

const run = async () => {
  console.warn('Starting');
  console.warn('  getting predicates');

  const host = 'http://localhost';
  const repo = opts.repository || 'wordnet';
  const port = '3030';
  const endpointUrl = opts.endpoint || `${host}:${port}/${repo}/sparql`;
  const store = new Store({endpointUrl})

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
