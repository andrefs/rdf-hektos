const Store = require('./lib/Store');
const {Query, COUNT, URI, RAND} = require('./lib/QueryBuilder');
const flattenObj = require('./lib/flattenObj');
const store = new Store();
const cliProgress = require('cli-progress');
const multibar = new cliProgress.MultiBar({
    stopOnComplete: true,
    clearOnComplete: true,
    hideCursor: true,
    barSize: 30,
    format: ' {bar} {percentage}% | {value}/{total} {task}'
}, cliProgress.Presets.shades_grey);

let walksBar;


const s2a = async (stream) => {
    return new Promise((resolve, reject) => {
      const res = [];
      stream
        .on('data', (bindings) => res.push(bindings))
        .on('end',() => resolve(res));
    });
};

const getProps = async () => {
  const query = new Query()
                    .select('p', COUNT('p', 'total'))
                    .where([['s', 'p', 'o']])
                    .groupBy('p')
                    .toSparql();
  const stream = await store.select(query);
  const res = await s2a(stream);
  const props = {};
  return Object.fromEntries(res.map(r => [r.p.id, {count: Number(r.total.value)}]));
};

const randomWalks = async (prop, nodes, len) => {
  //const res = await randomWalk(prop, nodes[0], len, new Set());
  const walks = {};
  const pb = multibar.create(nodes.length, 0, {task: 'nodes'});
  for (const n of nodes){
    walks[n] = await randomWalk(prop, n, len, new Set());
    pb.increment();
  }
  multibar.remove(pb);
  return walks;
};


const randomWalk = async (p, s, len, acc) => {
  if(len === 0){ return {nodes: Array.from(acc), status: 'finished'}; }

  const query = new Query()
                    .select('o')
                    .where([[URI(s), URI(p), 'o']])
                    .toSparql();
  const stream =  await store.select(query);
  const os = await s2a(stream);
  if(!os.length){ return {nodes: Array.from(acc), status: 'finished_early'}; }
  const i = Math.floor(Math.random() * os.length);
  if(os[i].o.termType === 'Literal'){
    return {nodes: Array.from(acc), status: 'found_literal'}; r
  }
  const o = os[i].o.id;
  if(acc.has(o)){ return {nodes: Array.from(acc), status: 'loop'}; }

  return randomWalk(p, o, len-1, acc.add(s));
}

const randSelectSubjects = async (p, howMany) => {
  const query = new Query()
                    .select('s')
                    .where([['s', URI(p), 'o']])
                    .orderBy(RAND())
                    .limit(howMany)
  const q = query.toSparql();
  const stream = await store.select(q);
  const subjs = await s2a(stream);
  return subjs.map(s => s.s.id)
}


const calcRandomWalks = async (props) => {
  const pb = multibar.create(Object.keys(props).length, 0, {task: 'props'});
  const pctg = 1; // %
  const walkLength = 100;
  const walks = [];
  console.warn(`  doing random walks (${Object.keys(props).length} props, ${pctg}% of paths, length ${walkLength})`);
  for (const p of Object.keys(props)){
    const total = props[p].count;
    const subjs = await randSelectSubjects(p, Math.ceil(total*pctg/100));
    const ws = await randomWalks(p, subjs, walkLength);
    walks.push([p, ws]);
    pb.increment();
  }
  multibar.remove(pb);
  return walks;
};

const calcInOutRatios = async (props) => {
  const query = `
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

    SELECT ?p (AVG(?c) as ?avg) WHERE {
        SELECT
          ?p ?x (COUNT(DISTINCT ?in) as ?cIn)
          (COUNT(DISTINCT ?out) as ?cOut)
          (xsd:integer(?cIn)/xsd:integer(?cOut) as ?c) WHERE {
            ?in ?p ?x .
            ?x ?p ?out
        }
        GROUP BY ?p ?x
    }
    GROUP BY ?p
    ORDER BY DESC(?avg)
    `;

  const stream = await store.select(query);
  const res = await s2a(stream);
  for(const r of res){
    props[r.p.id].ratio = Number(r.avg.value);
  }

  return res.map(r => [r.p.id, r.avg.value]);
};

const calcLoops = async (props) => {
  const loops = [];
  const pb = multibar.create(Object.keys(props).length, 0, {task: 'loops'});
  for(const p of Object.keys(props)){
    const query = `SELECT (COUNT(?s) AS ?loops)
                   WHERE { ?s <${p}>+ ?s .}`;
    const stream = await store.select(query);
    const lc = await s2a(stream);
    loops.push([p, lc]);
    pb.increment();
  }
  multibar.remove(pb);
  return loops;
}



const summarize = (props) => {
  const res = {};
  for(const p of Object.keys(props)){
    res[p] = {};
    res[p].ratio = props[p].ratio;
    res[p].count = props[p].count;
    let len = 0;
    const walks = {};
    console.warn('XXXXXXXXXXXXXXX',p, JSON.stringify(props[p].walks, null, 2));
    //if(!props[p].walks){ continue; }
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
  let props = await getProps();


  const walks = await calcRandomWalks(props);
  for(const [p, w] of walks){
    props[p].walks = w;
  }

  //const ratios = await calcInOutRatios(props);
  //for(const [p, r] of ratios){
  //  props[p].ratio = r;
  //}

  //await calcLoops(props);


  const sum  = summarize(props);
  //const flat = flattenObj(summarize(props));
  const flat = Object.keys(sum)
                     .reduce((previous, key) => {
                       previous[key] = flattenObj(sum[key]);
                       return previous;
                     }, {});
  prettyPrint(flat);

  //console.log(JSON.stringify(flat, null, 2));
}

run();
