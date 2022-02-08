import sparqljs  from 'sparqljs';
const generator = new sparqljs.Generator();
import rdf from '@rdfjs/data-model';
import Variable from '@rdfjs/data-model/lib/Variable.js';
import NamedNode from '@rdfjs/data-model/lib/NamedNode.js';
import BlankNode from '@rdfjs/data-model/lib/BlankNode.js';
import Literal from '@rdfjs/data-model/lib/Literal.js';

const normVar = value => {
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
  let n = rdf.namedNode(value);
  n.termType = 'NamedNode';
  return n;
};

export const B = (value) => {
  let b = rdf.blankNode(value);
  b.termType = 'BlankNode';
  return b;
};

export const L = (value, languageOrDataType) => {
  let l = rdf.literal(value, languageOrDataType);
  l.termType = 'Literal';
  return l;
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
    this.obj = {type: 'query'};
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
      expression: {
        termType: 'Variable',
        value: v
      }
    }));
    return this;
  }

  orderBy(...args){
    this.obj.order = args.map(a => {
      if(typeof arg !== 'string'){
        return {expression: a}
      } else {
        //todo
      }
    })
    return this;
  }

  toSparql(){
    return generator.stringify(this.obj);
  }
};

