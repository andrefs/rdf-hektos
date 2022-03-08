import GraphOperations from './lib/GraphOperations.js';
import {summPreds, ppMatrix, flattenObjValues} from './lib/utils.js'

import Store from './lib/Store.js';
import opts from './lib/opts.js'

async function run(){
  console.warn('Starting');
  console.warn('  getting predicates');

  const host = 'http://localhost';
  //const port = '7201';
  const repo = opts.repository || 'wordnet';
  //const endpointUrl = `${host}:${port}/repositories/${repo}`;
  const port = '3030';
  const endpointUrl = opts.endpointUrl || `${host}:${port}/${repo}/sparql`;
  const store = new Store({endpointUrl})
  const graph = new GraphOperations(store, {showProgBar: opts.showProgBar});
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

  //await calcLoops(preds);

  const sum = summPreds(preds);

  ppMatrix(flattenObjValues(sum), opts.outputFile);
}

run();
