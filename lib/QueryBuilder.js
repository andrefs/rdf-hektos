import sparqljs  from 'sparqljs';
const generator = new sparqljs.Generator();
import rdf from '@rdfjs/data-model';


export const UNION = 'UNION';

export const normVar = value => value.replace(/^\?/, '');

export const V = (value) => {
  if(typeof value === 'string'){
    const _val = normVar(value);
    let r = rdf.variable(_val);
    r.termType = 'Variable';
    return r;
  }
  return value;
};

export const Q = (s, p, o, graph=rdf.defaultGraph()) => {
  let r = rdf.quad(s, p, o, graph);
  r.termType = 'Quad';
  return r;
};

export const N = (value) => {
  if(typeof value === 'string'){
    let n = rdf.namedNode(value);
    n.termType = 'NamedNode';
    return n;
  }
  return value;
};

export const B = (value) => {
  if(typeof value === 'string'){
    let b = rdf.blankNode(value);
    b.termType = 'BlankNode';
    return b;
  }
  return value;
};

export const L = (value, languageOrDataType) => {
  if(typeof value === 'string' || typeof value === 'number'){
    let l = rdf.literal(value, languageOrDataType);
    l.termType = 'Literal';
    return l;
  }
  return value;
};


export const COUNT = (value, as, distinct) => {
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

export const RAND = (...args) => ({
  type: 'operation',
  operator: 'rand',
  args
});

export const BIND = (exp, v) => ({
  type: 'bind',
  variable: V(v),
  expression: exp
});

export class Query {
  constructor(){
    this.obj = {type: 'query', prefixes: {}};
  }

  prefix(pref, url){
    this.obj.prefixes = this.obj.prefixes || {};
    this.obj.prefixes[pref] = url;
    return this;
  }

  distinct(){
    this.obj.distinct = true;
    return this;
  }

  limit(lim){
    this.obj.limit = lim;
    return this;
  }

  select(...binds){
    this.obj = {
      ...this.obj,
      queryType: 'SELECT',
      variables: binds.map(b => V(b))
    };
    return this;
  }

  _where(args){
    const res = [];
    for(let i=0; i<args.length; i++){
      const a = args[i];
      if(a?.termType === 'Quad'){
        res.push(a);
      }
      else if(a?.type === 'bind' || a?.type === 'filter'){
       res.push(a);
      }
      else if(Array.isArray(a)){
        res.push({type: 'group', triples: this._where(a)})
      }
      else if(a === UNION){
        const prevGroup = res.pop();
        const union = prevGroup?.type === 'union' ? prevGroup :
                                                    {type: 'union', patterns: [prevGroup]};
        const nextGroup = args[++i];
        union.patterns.push(nextGroup);
        res.push(union)
      }
    }
    return res;
  }

  where(...args){
    const w = this._where(args);
    this.obj = {...this.obj, where: w};
    return this;
  }

  groupBy(...vars){
    this.obj.group = vars.map(v => ({
      expression: V(v)
    }));
    return this;
  }

  orderBy(...args){
    this.obj.order = args.map(a => {
      let v = a;
      let mod;
      if(Array.isArray(a)){
        v = a[0];
        mod = a[1] === 'DESC' ? 'descending' : 'ascending';
      }
      if(typeof v === 'string'){
        v = V(v);
      }
      const r = {expression: v};
      if(mod){ r[mod] = true; }
      return r;
    });
    return this;
  }

  toSparql(){
    return generator.stringify(this.obj);
  }
};

