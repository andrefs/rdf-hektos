import GraphOperations from './lib/GraphOperations';
import {summPreds, ppMatrix, flattenObjValues} from './lib/utils'

import Store from './lib/Store';
import opts from './lib/opts'
import { N, Q, Query, V } from './lib/QueryBuilder';

async function run(){
  console.warn('Starting');
  console.warn('  getting predicates');

  const host = 'http://localhost';
  //const port = '7201';
  const repo = opts.repository || 'wordnet';
  //const endpointUrl = `${host}:${port}/repositories/${repo}`;
  const port = '3030';
  const endpointUrl = opts.endpoint || `${host}:${port}/${repo}/sparql`;
  const store = new Store({endpointUrl})
  const graph = new GraphOperations(store, {showProgBar: !opts.noProgressBar});
  let preds = await graph.getPreds();

  const walks = await graph.calcRandomWalks(preds, 1, 10);
  for(const [p, sampledWalks, ws] of walks){
    preds[p].sampledWalks = sampledWalks;
    preds[p].walks = ws;
  }

  const ratios = await graph.calcInOutRatios(preds);
  for(const [p, r] of ratios){
    if(preds[p]){
      preds[p].ratio = r;
    }
  }

  const a = N('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
  const synsetClass = N('http://www.w3.org/ns/lemon/ontolex#LexicalConcept');
  const subq = new Query().select('s')
                    .where(Q(V('s'), a, synsetClass));
  let global = await graph.globalMetrics(subq); // TODO store this somewhere

  const scov = await graph.calcSubjectCoverage(subq);
  for(const [p, c] of scov){
    preds[p].subjCoverage = c;
  }

  const ocov = await graph.calcObjectCoverage(subq);
  for(const [p, c] of ocov){
    preds[p].objCoverage = c;
  }

  //await calcLoops(preds);
  
  const bfs = await graph.calcBranchingFactor(preds);
  for(const [p, bf] of bfs){
    preds[p].branchingFactor = bf;
  }

  const sum = summPreds(preds);

  ppMatrix(flattenObjValues(sum), opts.output);
}

run();
