import GraphOperations from './lib/GraphOperations.js';
import {summProps, ppMatrix, flattenObjValues} from './lib/utils.js'


import OptionParser from 'option-parser';
const parser = new OptionParser();

let showProgBar = true;
let quiet = false;

parser.addOption('h', 'help', 'Display this help message')
      .action(parser.helpAction());
parser.addOption('q', 'quiet', 'No output other than results')
      .action(() => quiet = true);
parser.addOption('b', 'no-progress-bar', 'Remove progress bar')
      .action(() => showProgBar = false);

parser.parse();

if(quiet){ showProgBar = false; }


async function run(){
  console.warn('Starting');
  console.warn('  getting props');
  const graph = new GraphOperations('wordnet', {showProgBar});
  await graph.init();
  let props = await graph.getProps();

  const walks = await graph.calcRandomWalks(props, 0.01, 10);
  for(const [p, w] of walks){
    props[p].walks = w;
  }

  const ratios = await graph.calcInOutRatios(props);
  for(const [p, r] of ratios){
    if(props[p]){
      props[p].ratio = r;
    }
  }

  //await calcLoops(props);


  const sum = summProps(props);
  ppMatrix(flattenObjValues(sum));
}

run();
