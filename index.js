const Store = require('./lib/Store');
const {Query, COUNT, URI, RAND} = require('./lib/QueryBuilder');
const store = new Store();

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
  for (const n of nodes){
    walks[n] = await randomWalk(prop, n, len, new Set());
  }
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

  return randomWalk(o, p, len-1, acc.add(s));
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

async function run(){
    //randomWalks(
    //  'http://wordnet-rdf.princeton.edu/ontology#hypernym',
    //  ['http://wordnet-rdf.princeton.edu/id/02572262-n'],
    //  10);
    //randomWalks(
    //  'http://purl.org/dc/terms/subject',
    //  ['http://wordnet-rdf.princeton.edu/id/00274445-n'],
    //  10);

    console.warn('Starting');
    console.warn('  getting props');
    let props = await getProps();
    const pctg = 1; // %
    const walkLength = 100;
    console.warn('    done');
    console.warn(`  doing random walks (${Object.keys(props).length} props)`);
    for (const p of Object.keys(props)){
      const total = props[p].count;
      const subjs = await randSelectSubjects(p, Math.ceil(total*pctg/100));
      props[p].walks = await randomWalks(p, subjs, walkLength);
    }
    console.warn('    done');


    console.log(JSON.stringify(summarize(props), null, 2));


}

const summarize = (props) => {
  const res = {};
  for(const p of Object.keys(props)){
    res[p] = {};
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

run();
