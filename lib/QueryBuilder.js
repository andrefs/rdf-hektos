import sparqljs  from 'sparqljs';
const generator = new sparqljs.Generator();
import rdf from '@rdfjs/data-model';
import Variable from '@rdfjs/data-model/lib/Variable.js';
import NamedNode from '@rdfjs/data-model/lib/NamedNode.js';
import BlankNode from '@rdfjs/data-model/lib/BlankNode.js';
import Literal from '@rdfjs/data-model/lib/Literal.js';

export const normVar = value => {
  return value.replace(/^\?/, '');
}

export const V = (value) => {
  if(typeof value === 'string'){
    const _val = normVar(value);
    let r = rdf.variable(_val);
    r.termType = 'Variable';
    return r;
  }
  return value;
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

  where(triples){
    this.obj = {
      ...this.obj,
      where: [{
        type: 'bgp',
        triples: triples.map(t => ({
          subject   : t[0],
          predicate : t[1],
          object    : t[2]
        }))
      }]
    };
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

