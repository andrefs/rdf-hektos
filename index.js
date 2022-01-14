const Store = require('./lib/Store');
const {Query, COUNT, URI, RAND} = require('./lib/QueryBuilder');
const store = new Store();
const progress = require('progressbar');


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
  const pb = progress.create().step(prop);
  pb.setTotal(nodes.length);
  for (const n of nodes){
    pb.addTick();
    walks[n] = await randomWalk(prop, n, len, new Set());
  }
  pb.finish();
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
  const pb = progress.create().step('Performing random walks');
  pb.setTotal(Object.keys(props).length);
  const pctg = 1; // %
  const walkLength = 100;
  const walks = [];
  console.warn(`  doing random walks (${Object.keys(props).length} props, ${pctg}% of paths, length ${walkLength})`);
  for (const p of Object.keys(props)){
    pb.addTick();
    const total = props[p].count;
    const subjs = await randSelectSubjects(p, Math.ceil(total*pctg/100));
    const ws = await randomWalks(p, subjs, walkLength);
    walks.push([p, ws]);
  }
  pb.finish();
  console.warn('    done');
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
  const pb = progress.create().step('Counting loops');
  pb.setTotal(Object.keys(props).length);
  for(const p of Object.keys(props)){
    pb.addTick();
    const query = `SELECT (COUNT(?s) AS ?loops)
                   WHERE { ?s <${p}>+ ?s .}`;
    const stream = await store.select(query);
    const lc = await s2a(stream);
    loops.push([p, lc]);
  }
  pb.finish();
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
    if(!props[p].walks){ continue; }
    for(const w of Object.values(props[p].walks)){
      len += w.nodes.length;
      walks[w.status] = walks[w.status] || 0;
      walks[w.status] ++;
    }
    res[p].walks = walks;
    res[p].avgLen = props[p].walks?.length ?
                        len/props[p].walks.length :
                        0;
  }
  return res;
}

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

  console.log(JSON.stringify(summarize(props), null, 2));
}

run();
