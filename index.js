import GraphOperations from './lib/GraphOperations.js';
import {summProps, ppMatrix, flattenObjValues} from './lib/utils.js'

import Store from './lib/Store.js';
import opts from './lib/opts.js'

async function run(){
  console.warn('Starting');
  console.warn('  getting props');

  const host = 'http://localhost';
  //const port = '7201';
  const repo = 'wordnet';
  //const endpointUrl = `${host}:${port}/repositories/${repo}`;
  const port = '3030';
  const endpointUrl = opts.endpointUrl || `${host}:${port}/${repo}/sparql`;
  const store = new Store({endpointUrl})
  let props = await graph.getProps();
  const graph = new GraphOperations(store, {showProgBar: opts.showProgBar});

  const walks = await graph.calcRandomWalks(props, 1, 10);
  for(const [p, sampledWalks, ws] of walks){
    props[p].sampledWalks = sampledWalks;
    props[p].walks = ws;
  }

  const ratios = await graph.calcInOutRatios(props);
  for(const [p, r] of ratios){
    if(props[p]){
      props[p].ratio = r;
    }
  }

  //await calcLoops(props);

  const sum = summProps(props);

  ppMatrix(flattenObjValues(sum), outputFile);
}

run();
