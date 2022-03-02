import GraphOperations from './lib/GraphOperations.js';
import {summProps, ppMatrix, flattenObjValues} from './lib/utils.js'

import OptionParser from 'option-parser';
import Store from './lib/Store.js';
const parser = new OptionParser();

let showProgBar = true;
let quiet = false;
let outputFile;

parser.addOption('h', 'help', 'Display this help message')
      .action(parser.helpAction());
parser.addOption('q', 'quiet', 'No output other than results')
      .action(() => quiet = true);
parser.addOption('b', 'no-progress-bar', 'Remove progress bar')
      .action(() => showProgBar = false);
parser.addOption('o', 'output', 'Send output to file')
      .argument('FILE')
      .action((value) => outputFile = value);

parser.parse();

if(quiet){ showProgBar = false; }

async function run(){
  console.warn('Starting');
  console.warn('  getting props');

  const host = 'http://localhost';
  //const port = '7201';
  const repo = 'wordnet';
  //const endpointUrl = `${host}:${port}/repositories/${repo}`;
  const port = '3030';
  const endpointUrl = `${host}:${port}/${repo}/sparql`;
  const store = new Store({endpointUrl})
  const graph = new GraphOperations(store, {showProgBar});
  let props = await graph.getProps();

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
