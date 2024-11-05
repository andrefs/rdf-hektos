import GraphOperations, { Predicate } from './lib/GraphOperations';
import { summPreds, ppMatrix, flattenObjValues } from './lib/utils'

import Store from './lib/Store';
import opts from './lib/proc-graph-opts'
import { N, Q, Query, V } from './lib/QueryBuilder';

async function run() {
  console.warn('Starting');
  console.warn('  getting predicates');

  const host = 'http://localhost';
  //const port = '7201';
  const repo = opts.repository || 'wordnet';
  //const endpointUrl = `${host}:${port}/repositories/${repo}`;
  const port = '3030';
  const endpointUrl = opts.endpoint || `${host}:${port}/${repo}/sparql`;
  const store = new Store({ endpointUrl })
  const graph = new GraphOperations(store, { showProgBar: !opts.noProgressBar });
  let basePreds = await graph.getPreds();

  const walks = await graph.calcRandomWalks(basePreds, 1, 10);
  const ratios = await graph.calcInOutRatios(basePreds);

  const a = N('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
  const synsetClass = N('http://www.w3.org/ns/lemon/ontolex#LexicalConcept');
  const subq = new Query().select('s')
    .where(Q(V('s'), a, synsetClass));
  let global = await graph.globalMetrics(subq); // TODO store this somewhere

  const scov = await graph.calcSubjectCoverage(subq);
  const ocov = await graph.calcObjectCoverage(subq);
  //await calcLoops(preds);
  const bfs = await graph.calcBranchingFactor(basePreds);

  const preds: { [key: string]: Predicate } = {};

  for (const [p, basePred] of Object.entries(basePreds)) {
    const s = scov[p] ?? 0;
    const o = ocov[p] ?? 0;
    const bf = bfs[p] ?? 0;
    const [_, sw, w] = walks[p];
    const r = ratios[p];


    preds[p] = {
      ...basePred,
      subjCoverage: s,
      objCoverage: o,
      branchingFactor: bf,
      sampledWalks: sw,
      walks: w,
      ratio: r
    };
  }



  const sum = summPreds(preds);

  const output = opts.output || `proc-${repo}-results.json`;
  ppMatrix(flattenObjValues(sum), output);
}

run();
