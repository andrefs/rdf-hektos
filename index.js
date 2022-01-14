const Store = require('./lib/Store');
const {Query, COUNT, URI} = require('./lib/QueryBuilder');
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
  return Object.fromEntries(res.map(r => [r.p.id, Number(r.total.value)]));
};

const randomWalks = async (seeds, props, len) => {
  const res = await randomWalk(seeds[0], props[0], len, new Set());
  console.log(res);

};


const randomWalk = async (s, p, len, acc) => {
  if(len === 0){ return {nodes: Array.from(acc), status: 'finished'}; }

  const query = new Query()
                    .select('o')
                    .where([[URI(s), URI(p), 'o']])
                    .toSparql();
  const stream =  await store.select(query);
  const os = await s2a(stream);
  if(!os.length){ return {nodes: Array.from(acc), status: 'finished_early'}; }
  const i = Math.floor(Math.random() * os.length);
  const o = os[i].o.id;
  if(acc.has(o)){ return {nodes: Array.from(acc), status: 'loop'}; }

  return randomWalk(o, p, len-1,acc.add(s));
}


async function run(){
    //const stream = await s.select('select * where {?s ?p ?o}');
    //for await (const bindings of stream){
    //    console.log(bindings);
    //}
    //getProps().then(console.log);
    randomWalks(
      ['http://wordnet-rdf.princeton.edu/id/02572262-n'],
      ['http://wordnet-rdf.princeton.edu/ontology#hypernym'],
      10);

}

run();
