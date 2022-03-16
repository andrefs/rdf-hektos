import rdf from '@rdfjs/data-model';
import { Literal, Quad } from 'rdf-data-factory';
import RdfJs from '@rdfjs/types';
import SparqlJs, { OperationExpression } from 'sparqljs';

const generator = new SparqlJs.Generator();

export const UNION = 'UNION';

type Union = 'UNION';

export const normVar = (value: string) => value.replace(/^\?/, '');

type StrOr<T> = string | T;

export const V = (value: StrOr<RdfJs.Variable>): RdfJs.Variable => {
  if(typeof value === 'string'){
    const _val = normVar(value);
    let r = rdf.variable(_val);
    r.termType = 'Variable';
    return r;
  }
  return value;
};

export const Q = (s: RdfJs.Quad_Subject, p: RdfJs.Quad_Predicate, o: RdfJs.Quad_Object, graph=rdf.defaultGraph()) => {
  let r = rdf.quad(s, p, o, graph);
  r.termType = 'Quad';
  return r;
};

export const N = (value: StrOr<RdfJs.NamedNode>) => {
  if(typeof value === 'string'){
    let n = rdf.namedNode(value);
    n.termType = 'NamedNode';
    return n;
  }
  return value;
};

export const B = (value: StrOr<RdfJs.BlankNode>) => {
  if(typeof value === 'string'){
    let b = rdf.blankNode(value);
    b.termType = 'BlankNode';
    return b;
  }
  return value;
};

export const L = (value: number | StrOr<Literal>, languageOrDataType?: string) => {
  if(typeof value === 'string' || typeof value === 'number'){
    let l = rdf.literal(String(value), languageOrDataType);
    l.termType = 'Literal';
    return l;
  }
  return value;
};

export const COUNT = (value: StrOr<RdfJs.Variable>, as: StrOr<RdfJs.Variable>, distinct?: boolean | string): SparqlJs.VariableExpression => {
  return {
    expression: {
      expression: V(value),
      type: 'aggregate',
      aggregation: 'count',
      distinct: !!distinct
    },
    variable: V(as)
  };
};

export const RAND = (): OperationExpression => ({
  type: 'operation',
  operator: 'rand',
  args: []
});

export const FILTER = (exp: SparqlJs.Expression) : SparqlJs.FilterPattern => ({
  type: 'filter',
  expression: exp
});

export const NOT = (...args: StrOr<RdfJs.Variable>[]) => ({
  type: 'operation',
  operator: '!',
  args
});

export const IS_BLANK = (...args: StrOr<RdfJs.Variable>[]) => ({
  type: 'operation',
  operator: 'isblank',
  args: args.map(v => V(v))
});

export const BIND = (exp: SparqlJs.Expression, v: string | RdfJs.Variable) : SparqlJs.BindPattern => ({
  type: 'bind',
  variable: V(v),
  expression: exp
});

export class Query {
  obj: SparqlJs.SelectQuery;

  constructor(){
    const vars: SparqlJs.Variable[] = [];
    this.obj = {
      type: 'query',
      prefixes: {},
      queryType: 'SELECT',
      variables: vars
    };
  }

  prefix(pref: string, url: string){
    this.obj.prefixes[pref] = url;
    return this;
  }

  distinct(){
    this.obj.distinct = true;
    return this;
  }

  limit(lim: number){
    this.obj.limit = lim;
    return this;
  }

  select(...binds: StrOr<SparqlJs.Variable>[]){
    this.obj = {
      ...this.obj,
      queryType: 'SELECT',
    };
    const variables = this.obj.variables as SparqlJs.Variable[];
    variables.push(...binds.map(V));
    return this;
  }


  where(...args: WhereArg[]){
    const [w, prefixes] = _where(args);
    if(prefixes){
      this.obj.prefixes = {...this.obj.prefixes, ...prefixes};
    }
    this.obj = {...this.obj, where: w};
    return this;
  }

  groupBy(...vars: StrOr<RdfJs.Variable>[]){
    this.obj.group = vars.map(v => ({
      expression: V(v)
    }));
    return this;
  }

  orderBy(...args: OrderByArg[]){
    this.obj.order = args.map(a => {
      let v = a;
      let descending = false;
      if(Array.isArray(a)){
        v = a[0];
        descending = a[1] === 'DESC';
      }
      v = V(v as StrOr<RdfJs.Variable>);
      const r = {expression: v, descending};
      return r;
    });
    return this;
  }

  toSparql(){
    return generator.stringify(this.obj);
  }
};

const isQuad = (obj: any): obj is Quad => {
  return obj.termType === 'Quad';
};

type Prefixes = { [prefix: string]: string };

function _where(args: WhereArg[]): [SparqlJs.Pattern[], Prefixes] {
  const res: (SparqlJs.Pattern|Union)[] = [];
  let bgp: SparqlJs.Triple[] = [];
  let prefixes = {};
  for(let i=0; i<args.length; i++){
    const a = args[i];
    if(bgp.length){
      res.push({type: 'bgp', triples: bgp});
      bgp = [];
      continue;
    }
    if(a === UNION){
      res.push(a);
      continue;
    }
    if(isQuad(a)){
      bgp.push(a as SparqlJs.Triple);
      continue;
    }
    if(a instanceof Query){
      if(a.obj.prefixes){
        prefixes = {...prefixes, ...a.obj.prefixes};
        a.obj.prefixes = {};
      }
      res.push({type: 'group', patterns: [a.obj]})
      continue;
    }
    if(Array.isArray(a)){
      const [nested] = _where(a);
      const g = {type: 'group', patterns: nested};
      res.push(g as SparqlJs.GroupPattern);
      continue;
    }
    if(a.type === 'bind' || a.type === 'filter'){
      res.push(a);
      continue;
    }
  }
  if(bgp.length){
    res.push({type: 'bgp', triples: bgp});
  }

  const readyRes: SparqlJs.Pattern[] = [];

  for(let i=0; i<res.length; i++){
    if(res[i] !== UNION){
      readyRes.push(res[i] as SparqlJs.Pattern);
      continue;
    }

    const first = readyRes.pop();
    const union = isUnionPattern(first) ?
                                first :
                                {type: 'union', patterns: [first]};
    const second = res[++i];
    if(second === UNION || isUnionPattern(second)){ throw 'Error'; }
    else {
      union.patterns.push(second);
      readyRes.push(union as SparqlJs.UnionPattern);
    }
    continue;
  }
  return [readyRes, prefixes];
};

const isUnionPattern = (obj: any): obj is SparqlJs.UnionPattern => {
  return obj.type === 'union';
};



type WhereArg = Query | Quad | SparqlJs.BindPattern | SparqlJs.FilterPattern | Union | WhereArg[];
type OrderByArg = OperationExpression | StrOr<RdfJs.Variable> | [StrOr<RdfJs.Variable>, 'ASC' | 'DESC'];

