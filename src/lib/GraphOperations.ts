import {Query, COUNT, V, RAND, Q, N, BIND, UNION, FILTER, NOT, IS_BLANK} from './QueryBuilder';
import Bluebird from 'bluebird';
import EventEmitter from 'events';
import cliProgress from 'cli-progress';
import {Bindings, Term} from '@rdfjs/types';
import Store from './Store';
import { Quad_Predicate } from 'n3';
const multibar = new cliProgress.MultiBar({
    stopOnComplete: true,
    clearOnComplete: false,
    hideCursor: true,
    barsize: 30,
    format: ' {bar} {percentage}% | {value}/{total} {task} | {tid}'
}, cliProgress.Presets.shades_grey);


const concurrency = 1;

const  FINISHED_EARLY = 'finished_early';
const  FOUND_BLANK    = 'found_blank';    
const  FOUND_LITERAL  = 'found_literal';  
const  FOUND_LOOP     = 'found_loop';     



const s2a = async (stream: EventEmitter) => {
    return new Bluebird<Bindings[]>((resolve) => {
      const res: Bindings[] = [];
      stream
        .on('data', (bindings) => res.push(bindings))
        .on('end',() => resolve(res));
    });
};


class GraphOperations extends EventEmitter {
  _store: Store;
  _bars: {[key: string]: cliProgress.SingleBar} = {};

  constructor(store: Store, {showProgBar}:{showProgBar?:boolean}={}){

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

  async getPreds(): Promise<{[key: string]: Predicate}>{
    const q = new Query()
                      .select('p', COUNT('p', 'total'))
                      .where(
                        Q(V('s'), V('p'), V('o'))
                      )
                      .groupBy('p');

    this.emit('preds-starting');
    const res = await this._runQuery(q);
    this.emit('preds-finished', res.length); 
    return Object.fromEntries(res.map(r => {
      return [
      r.get('p')?.value,
      {
        count: Number(r.get('total')?.value) || 0,
        node: r.get('p')
      }
    ];}));
  }

  async _randomWalks(pred: Term, nodes: Term[], len: number): Promise<{[key:string]: Walk}>{
    const walks: {[key:string]: Walk} = {};
    this.emit('walks-pred-starting', nodes.length);
    const ws = await Bluebird.map(nodes, n => {
      this.emit('walks-pred-node', n.value);
      return this._randomWalk(pred, n, len);
    }, {concurrency});

    for (const [i,n] of nodes.entries()){
      walks[n.value] = ws[i];
    }
    this.emit('walks-pred-finished');
    return walks;
  }

  async _runQuery(query: Query | string, invalidateCache?: boolean) {
    const sparql = typeof query !== 'string' ? query.toSparql() : query;
    const stream = await this._store.select(sparql);
    const res = await s2a(stream);
    if(invalidateCache){
      this._store.engine?.invalidateHttpCache();
    }
    return res;
  }


  async rightRWStep(s, p, o): Promise<Term | undefined>{
    const q = new Query().select(o)
                         .where(Q(s, p, V(o)), BIND(RAND(), 'sortKey'))
                         .orderBy('sortKey')
                         .limit(1);

    const xs = await this._runQuery(q, true);
    let res = xs?.[0]?.get(o);
    //if(res?.termType === 'BlankNode'){
    //  return this.rightRWStep(res, p, V(o));
    //}
    return res;
  }

  async leftRWStep(s, p, o): Promise<Term | undefined>{
    const q = new Query().select(s)
                         .where(Q(V(s), p, o), BIND(RAND(), 'sortKey'))
                         .orderBy('sortKey')
                         .limit(1);

    const xs = await this._runQuery(q, true);
    let res = xs?.[0]?.get(s);
    //if(res?.termType === 'BlankNode'){
    //  return this.leftRWStep(V(s), p, res);
    //}
    return res;
  }

  isRandomWalkOver(x: Term, visitedNodes: Set<string>){
    return  !x ?                         FINISHED_EARLY :
            x.termType === 'BlankNode' ? FOUND_BLANK    :
            x.termType === 'Literal' ?   FOUND_LITERAL  :
            visitedNodes.has(x.value) ?  FOUND_LOOP     :
            null;
  }

    //return {status, nodes: path};
  async _randomWalk(pred:Term, node:Term, len: number): Promise<{status: string[], nodes: Term[]}>{
    let leftNode: Term | undefined = node;
    let rightNode: Term | undefined = node;
    let visitedNodes = new Set<string>().add(node.value);
    const path = [node];
    let rightFinished = false;
    let leftFinished = false;
    const status = [];

    const pathIsLoop = (path: Term[]) => path.length > 1 && path[0].value === path[path.length-1].value;

    if(rightNode.termType === 'Literal'){
      status.push(FOUND_LITERAL);
      rightFinished = true;
    }

    while(path.length < len && !pathIsLoop(path) && (!rightFinished || !leftFinished)){
      if(!rightFinished && !pathIsLoop(path)){
        const x = await this.rightRWStep(rightNode, pred, 'x');
        const _s = this.isRandomWalkOver(x, visitedNodes);
        if(x){
          visitedNodes.add(x.value);
          path.push(x);
        }
        rightNode = x;
        if(_s){
          status.push(_s);
          rightFinished = true;
        }
      }

      if(!leftFinished && path.length < len && !pathIsLoop(path)){
        const x = await this.leftRWStep('x', pred, leftNode);
        const _s = this.isRandomWalkOver(x, visitedNodes);
        if(x){
          visitedNodes.add(x.value);
          path.unshift(x);
        }
        leftNode = x;
        if(_s){
          status.push(_s);
          leftFinished = true;
        }
      }
    }
    if(!pathIsLoop(path) && (!leftFinished || ! rightFinished)){
      status.push('finished');
    }
    return {status, nodes: path};
  }

  async _randSelectSubjects(p: Term, howMany: number): Promise<Term[]>{
    const q = new Query().distinct().select('x')
                      .where(
                        Q(V('x'), p as Quad_Predicate, V('o')),
                        UNION,
                        Q(V('s'), p as Quad_Predicate, V('x')),
                        FILTER(NOT(IS_BLANK('x'))),
                        BIND(RAND(), 'sortKey')
                      )
                      .orderBy('sortKey')
                      .limit(howMany);
    const nodes = await this._runQuery(q, true);
    return nodes.map(x => x.get('x') as Term);
  }


  async calcRandomWalks(preds: {[key:string]: Predicate}, pctg=1, walkLength=5): Promise<PredicateWalks[]>{
    this.emit('walks-started', Object.keys(preds).length);
    const walks: PredicateWalks[] = [];
    console.log(`  doing random walks (${Object.keys(preds).length} ` +
      `preds, ${pctg}% of paths, length ${walkLength})`);
    for (const p of Object.keys(preds)){
      this.emit('walks-pred', p);
      const total = preds[p]?.count;
      const sampledWalks = Math.ceil(total*pctg/100);
      const subjs = await this._randSelectSubjects(preds[p].node, sampledWalks);
      const ws = await this._randomWalks(preds[p].node, subjs, walkLength);
      walks.push([p, sampledWalks, ws]);
    }
    this.emit('walks-finished');
    return walks;
  };

  async calcInOutRatios(preds: {[key:string]: Predicate}): Promise<Array<[string, number]>>{
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
    return res.map(r => {
      const p = r.get('p')?.value as string;
      const avg = Number(r.get('avg')?.value);
      return [p, avg];
    });
  }

  async calcLoops(preds: {[key:string]: Predicate}): Promise<Array<[string, number]>>{
    const loops: [string, number][] = [];
    this.emit('loops-starting', Object.keys(preds).length);
    for(const p of Object.keys(preds)){
      const query = `SELECT (COUNT(?s) AS ?loops)
                     WHERE { ?s <${p}>+ ?s .}`;
      const stream = await this._store.select(query);
      const lc = await s2a(stream);
      loops.push([p, Number(lc[0].get('loops')?.value)]);
      this.emit('loops-loop');
    }
    this.emit('loops-finished');
    return loops;
  }

  async calcSubjectCoverage(subSelect: Query): Promise<Array<[string, number]>>{
    const q = new Query().select('p', COUNT('s', 'cov'))
                       .where(
                         Q(V('s'), V('p'), V('o')),
                        subSelect
                       )
                      .groupBy('p')
    const cov = await this._runQuery(q);
    return cov.map(c => [c.get('p')?.value as string, Number(c.get('cov')?.value)]);
  }

  async calcObjectCoverage(subSelect: Query): Promise<Array<[string, number]>>{
    const q = new Query().select('p', COUNT('o', 'cov'))
                       .where(
                         Q(V('s'), V('p'), V('o')),
                        subSelect
                       )
                      .groupBy('p')
    const cov = await this._runQuery(q);
    return cov.map(c => [c.get('p')?.value as string, Number(c.get('cov')?.value)]);
  }


  async calcBranchingFactor(preds: {[key:string]: Predicate}): Promise<Array<[string, number]>>{
    const bfs: [string, number][] = [];
    for(const p of Object.keys(preds)){
      const res = await this._runQuery(new Query()
                                .select(
                                  COUNT('s', 'nonLeaves', 'distinct'),
                                  COUNT('o', 'nonRoots', 'distinct'),
                                )
                                .where(
                                  Q(V('s'), N(p), V('o')),
                                ));
      const nrCount = res[0].get('nonRoots')?.value;
      const nlCount = res[0].get('nonLeaves')?.value;
      bfs.push([p, Number(nrCount)/Number(nlCount)]);
    }

    return bfs;
  }

  async globalMetrics(seedQuery: Query): Promise<{totalResources: number, totalNodes: number, totalSubjects: number, totalSeeds: number}>{
    const totalResources = await this._runQuery(new Query()
                                .select(COUNT('x', 'total', 'distinct'))
                                .where(
                                  Q(V('x'), V('p'), V('o')),
                                  UNION,
                                  Q(V('s'), V('x'), V('o')),
                                  UNION,
                                  Q(V('s'), V('p'), V('x')),
                                ));

    const totalNodes = await this._runQuery(new Query()
                                .select(COUNT('x', 'total', 'distinct'))
                                .where(
                                  Q(V('x'), V('p'), V('o')),
                                  UNION,
                                  Q(V('s'), V('p'), V('x')),
                                ));

    const totalSubjects = await this._runQuery(new Query()
                                .select(COUNT('x', 'total', 'distinct'))
                                .where(
                                  Q(V('x'), V('p'), V('o')),
                                ));

    const totalSeeds = await this._runQuery(seedQuery);

    return {
      totalResources: Number(totalResources[0].get('total')?.value),
      totalNodes: Number(totalNodes[0].get('total')?.value),
      totalSubjects: Number(totalSubjects[0].get('total')?.value),
      totalSeeds: totalSeeds.length
    }
  }
};

export interface Predicate {
  count: number,
  node: Term,
  sampledWalks?: number,
  walks?: {[key:string]: Walk},
  ratio?: number,
  branchingFactor?: number,
  subjCoverage?: number,
  objCoverage?: number,
};

export interface Walk {
  status: string[],
  nodes: Term[]
};

export type PredicateWalks = [string, number, {[key:string]: Walk}];

export default GraphOperations;

