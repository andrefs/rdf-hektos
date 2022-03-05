import {Query, COUNT, V, RAND, Q, BIND, UNION} from './QueryBuilder.js';
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
      this._bars.walks = multibar.create(howMany, 0, {task: 'preds', tid: ''});
    });
    this.on('walks-finished', () => {
      multibar.remove(this._bars.walks);
    });
    this.on('walks-pred', (id) => {
      this._bars.walks.increment({task: 'preds', tid: id});
    });

    this.on('walks-pred-starting', (howMany) => {
      this._bars.nodes = multibar.create(howMany, 0, {task: 'nodes', tid: ''});
    });
    this.on('walks-pred-finished', () => {
      multibar.remove(this._bars.nodes);
    });
    this.on('walks-pred-node', (id) => {
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

  async getPreds(){
    const query = new Query()
                      .select('p', COUNT('p', 'total'))
                      .where(
                        Q(V('s'), V('p'), V('o'))
                      )
                      .groupBy('p')
                      .toSparql();
    this.emit('preds-starting');
    const stream = await this._store.select(query);
    const res = await s2a(stream);
    this.emit('preds-finished', res.length); 
    return Object.fromEntries(res.map(r => {
      return [
      r.get('?p').value,
      {
        count: Number(r.get('?total').value),
        node: r.get('?p')
      }
    ];}));
  }

  async _randomWalks(pred, nodes, len){
    const walks = {};
    this.emit('walks-pred-starting', nodes.length);
    const ws = await Promise.map(nodes, n => {
      this.emit('walks-pred-node', n.value);
      return this._randomWalk(pred, n, len);
    }, {concurrency});

    for (const [i,n] of nodes.entries()){
      walks[n.value] = ws[i];
    }
    this.emit('walks-pred-finished');
    return walks;
  }

  async rwStep(x, bgp){
    const q = new Query().select(x)
                         .where(bgp, BIND(RAND(), 'sortKey'))
                         .orderBy('?sortKey')
                         .limit(1);

    const stream = await this._store.select(q.toSparql());
    const xs = await s2a(stream);
    const res = xs?.[0]?.get('?x');
    return res;
  }

  isRandomWalkOver(x, visitedNodes){
    return  !x ?                         'finished_early' :
            x.termType === 'BlankNode' ? 'found_blank'    :
            x.termType === 'Literal' ?   'found_literal'  :
            visitedNodes.has(x.value) ?  'found_loop'     :
            null;
  }

  async _randomWalk(pred, node, len){
    let leftNode = node;
    let rightNode = node;
    let visitedNodes = new Set().add(node.value);
    let path = [node];
    let rightFinished = false;
    let leftFinished = false;
    let status;

    while(path.length < len && (!rightFinished || !leftFinished)){
      if(!rightFinished){
        const x = await this.rwStep('x', Q(rightNode, pred, V('x')));
        if(x){
          visitedNodes.add(x.value);
          path.push(x);
        }
        status = this.isRandomWalkOver(x, visitedNodes);
        rightNode = x;
        if(status){ rightFinished = true; }
      }

      if(!leftFinished && path.length < len){
        const x = await this.rwStep('x', Q(V('x'), pred, leftNode));
        if(x){
          visitedNodes.add(x.value);
          path.push(x);
        }
        status = this.isRandomWalkOver(x, visitedNodes);
        leftNode = x;
        if(status){ leftFinished = true; }
      }
      if(leftFinished && rightFinished){
        return {status, nodes: path};
      }
    }
  }

  //async _randomWalk(p, r, len, acc, reverse=false){
  //  acc[r.value] = true;
  //  if(len === 0){ return {nodes: Object.keys(acc), status: 'finished'}; }

  //  const bgp = reverse ? Q(V('x'), p, r) : Q(r, p, V('x'));

  //  const query = new Query()
  //                    .select('x')
  //                    .where(
  //                      bgp,
  //                      BIND(RAND(), 'sortKey')
  //                    )
  //                    .orderBy('?sortKey')
  //                    .limit(1);

  //  const stream = await this._store.select(query.toSparql());
  //  const xs = await s2a(stream);
  //  if(!xs.length){
  //    return {
  //      nodes: Object.keys(acc),
  //      status: 'finished_early'
  //    };
  //  }
  //  //const i = Math.floor(Math.random() * os.length);
  //  if(xs[0].get('?x').termType === 'Literal'){
  //    return {nodes: Object.keys(acc), status: 'found_literal'};
  //  }
  //  const x = xs[0].get('?x');
  //  if(acc[x.value]){
  //    return {nodes: Object.keys(acc), status: 'loop'};
  //  }

  //  return this._randomWalk(p, x, len-1, acc, reverse);
  //}

  async _randSelectSubjects(p, howMany){
    const query = new Query()
                      .distinct()
                      .select('x')
                      .where(
                        Q(V('x'), p, V('o')),
                        UNION,
                        Q(V('s'), p, V('x')),
                        BIND(RAND(), 'sortKey')
                      )
                      .orderBy('sortKey')
                      .limit(howMany);
    const q = query.toSparql();
    const stream = await this._store.select(q);
    const nodes = await s2a(stream);
    return nodes.map(x => x.get('?x'));
  }


  async calcRandomWalks(preds, pctg=1, walkLength=5){
    this.emit('walks-started', Object.keys(preds).length);
    const walks = [];
    console.log(`  doing random walks (${Object.keys(preds).length} ` +
      `preds, ${pctg}% of paths, length ${walkLength})`);
    for (const p of Object.keys(preds)){
      this.emit('walks-pred', p);
      const total = preds[p].count;
      const sampledWalks = Math.ceil(total*pctg/100);
      const subjs = await this._randSelectSubjects(preds[p].node, sampledWalks);
      const ws = await this._randomWalks(preds[p].node, subjs, walkLength);
      walks.push([p, sampledWalks, ws]);
    }
    this.emit('walks-finished');
    return walks;
  };

  async calcInOutRatios(preds){
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
      if(preds[r.get('?p')]){
        preds[r.get('?p')].ratio = Number(r.get('?avg'));
      }
    }
  
    return res.map(r => [r.get('?p').value, r.get('?avg').value]);
  }

  async calcLoops(preds){
    const loops = [];
    this.emit('loops-starting', Object.keys(preds).length);
    for(const p of Object.keys(preds)){
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

