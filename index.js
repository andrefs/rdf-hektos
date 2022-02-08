import GraphOperations from './lib/GraphOperations.js';
import flattenObj from './lib/flattenObj.js';


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


const summarize = (props) => {
  const res = {};
  for(const p of Object.keys(props)){
    res[p] = {};
    res[p].ratio = props[p].ratio;
    res[p].count = props[p].count;
    let len = 0;
    const walks = {};
    for(const w of Object.values(props[p].walks)){
      len += w.nodes.length;
      walks[w.status] = walks[w.status] || 0;
      walks[w.status] ++;
    }
    res[p].walks = walks;

    const walksCount = Object.keys(props[p].walks).length;

    res[p].avgLen = walksCount ? len/walksCount : 0;
  }
  return res;
}

const prettyPrint = (data) => {
  const table = [];
  const keys = {};
  for(const x of Object.values(data)){
    for(const k of Object.keys(x)){
      keys[k] = true;
    }
  }
  table.push(['Property', ...Object.keys(keys)]);
  for(const [prop,info] of Object.entries(data)){
    const row = [prop];
    for(const k of table[0].slice(1)){
      row.push(info[k] || '');
    }
    table.push(row);
  }

  console.log(table.map(x => x.join('\t')).join('\n'));

};

async function run(){
  console.warn('Starting');
  console.warn('  getting props');
  const graph = new GraphOperations('wordnet', {showProgBar});
  await graph.init();
  let props = await graph.getProps();

  const walks = await graph.calcRandomWalks(props, 0.01, 5);
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


  const sum  = summarize(props);
  //const flat = flattenObj(summarize(props));
  const flat = Object.keys(sum)
                     .reduce((previous, key) => {
                       previous[key] = flattenObj(sum[key]);
                       return previous;
                     }, {});
  prettyPrint(flat);

  console.log(JSON.stringify(flat, null, 2));
}

run();
