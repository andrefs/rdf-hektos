import {Query, COUNT, V, RAND} from './QueryBuilder.js';
import Promise from 'bluebird';
import EventEmitter from 'events';
import cliProgress from 'cli-progress';
const multibar = new cliProgress.MultiBar({
    stopOnComplete: true,
    clearOnComplete: false,
    hideCursor: true,
    barSize: 30,
    format: ' {bar} {percentage}% | {value}/{total} {task} | {tid}'
}, cliProgress.Presets.shades_grey);


const concurrency = 1;

const s2a = async (stream) => {
    return new Promise((resolve) => {
      const res = [];
      stream
        .on('data', (bindings) => res.push(bindings))
        .on('end',() => resolve(res));
    });
};


class GraphOperations extends EventEmitter {

  constructor(store, {showProgBar}={}){
    super();
    if(showProgBar){
      this._handleEvents();
    }
    this._store = store;
  }

  _handleEvents(){
    this._bars = {};

    this.on('walks-started', (howMany) => {
      this._bars.walks = multibar.create(howMany, 0, {task: 'props', tid: ''});
    });
    this.on('walks-finished', () => {
      multibar.remove(this._bars.walks);
    });
    this.on('walks-prop', (id) => {
      this._bars.walks.increment({task: 'props', tid: id});
    });

    this.on('walks-prop-starting', (howMany) => {
      this._bars.nodes = multibar.create(howMany, 0, {task: 'nodes', tid: ''});
    });
    this.on('walks-prop-finished', () => {
      multibar.remove(this._bars.nodes);
    });
    this.on('walks-prop-node', (id) => {
      this._bars.nodes.increment({task: 'nodes', tid: id});
    });

    this.on('loops-starting', (howMany) => {
      this._bars.loops = multibar.create(howMany, 0, {task: 'loops', tid: ''});
    });
    this.on('loops-finished', () => {
      multibar.remove(this._bars.loops);
    });
    this.on('loops-loop', () => {
      this._bars.loops.increment({task: 'loops',});
    });

  }

  async getProps(){
    const query = new Query()
                      .select('p', COUNT('p', 'total'))
                      .where([
                        [V('s'), V('p'), V('o')]
                      ])
                      .groupBy('p')
                      .toSparql();
    this.emit('props-starting');
    const stream = await this._store.select(query);
    const res = await s2a(stream);
    this.emit('props-finished', res.length); 
    return Object.fromEntries(res.map(r => {
      return [
      r.get('?p').value,
      {
        count: Number(r.get('?total').value),
        node: r.get('?p')
      }
    ];}));
  }

  async _randomWalks(prop, nodes, len){
    const walks = {};
    this.emit('walks-prop-starting', nodes.length);
    const ws = await Promise.map(nodes, n => {
      this.emit('walks-prop-node', n.value);
      return this._randomWalk(prop, n, len, {});
    }, {concurrency});

    for (const [i,n] of nodes.entries()){
      walks[n.value] = ws[i];
    }
    this.emit('walks-prop-finished');
    return walks;
  }


  async _randomWalk(p, s, len, acc){
    acc[s.value] = true;
    if(len === 0){ return {nodes: Object.keys(acc), status: 'finished'}; }

    const query = new Query()
                      .select('o')
                      .where([[s, p, V('o')]])
                      .orderBy(RAND())
                      .limit(1);

    const stream = await this._store.select(query.toSparql());
    const os = await s2a(stream);
    if(!os.length){
      return {
        nodes: Object.keys(acc),
        status: 'finished_early'
      };
    }
    //const i = Math.floor(Math.random() * os.length);
    if(os[0].get('?o').termType === 'Literal'){
      return {nodes: Object.keys(acc), status: 'found_literal'};
    }
    const o = os[0].get('?o');
    if(acc[o.value]){
      return {nodes: Object.keys(acc), status: 'loop'};
    }

    return this._randomWalk(p, o, len-1, acc);
  }

  async _randSelectSubjects(p, howMany){
    const query = new Query()
                      .select('s')
                      .where([[V('s'), p, V('o')]])
                      .orderBy(RAND())
                      .limit(howMany);
    const q = query.toSparql();
    const stream = await this._store.select(q);
    const subjs = await s2a(stream);
    return subjs.map(s => s.get('?s'));
  }


  async calcRandomWalks(props, pctg=1, walkLength=5){
    this.emit('walks-started', Object.keys(props).length);
    const walks = [];
    console.warn(`  doing random walks (${Object.keys(props).length} ` +
      `props, ${pctg}% of paths, length ${walkLength})`);
    for (const p of Object.keys(props)){
      this.emit('walks-prop', p);
      const total = props[p].count;
      const subjs = await this._randSelectSubjects(props[p].node, Math.ceil(total*pctg/100));
      const ws = await this._randomWalks(props[p].node, subjs, walkLength);
      walks.push([p, ws]);
    }
    this.emit('walks-finished');
    return walks;
  };

  async calcInOutRatios(props){
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
  
    const stream = await this._store.select(query);
    const res = await s2a(stream);
    for(const r of res){
      if(props[r.get('?p')]){
        props[r.get('?p')].ratio = Number(r.get('?avg'));
      }
    }
  
    return res.map(r => [r.get('?p').value, r.get('?avg').value]);
  }

  async calcLoops(props){
    const loops = [];
    this.emit('loops-starting', Object.keys(props).length);
    for(const p of Object.keys(props)){
      const query = `SELECT (COUNT(?s) AS ?loops)
                     WHERE { ?s <${p}>+ ?s .}`;
      const stream = await this._store.select(query);
      const lc = await s2a(stream);
      loops.push([p, lc]);
      this.emit('loops-loop');
    }
    this.emit('loops-finished');
    return loops;
  }
};

export default GraphOperations;

