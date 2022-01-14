const SparqlGenerator = require('sparqljs').Generator;
const generator = new SparqlGenerator();

const wrap = node => {
  return typeof node === 'string' ?
    VAR(node) :
    node;
}

const VAR = (varName) => ({
  termType: 'Variable',
  value: varName
});

const URI = (uri) => ({
  termType: 'NamedNode',
  value: uri
});

const COUNT = (node, as, distinct) => ({
  expression: {
    expression: wrap(node),
    type: 'aggregate',
    aggregation: 'count',
    distinct: !!distinct
  },
  variable: VAR(as)
});

const RAND = (...args) => ({
  type: 'operation',
  operator: 'rand',
  args
});


class Query {
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
      variables: binds
                  .map(b => wrap(b))
    };
    return this;
  }

  where(triples){
    this.obj = {
      ...this.obj,
      where: [{
        type: 'bgp',
        triples: triples.map(t => ({
          subject   : wrap(t[0]),
          predicate : wrap(t[1]),
          object    : wrap(t[2])
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

module.exports = {
  Query,
  COUNT,
  URI,
  RAND
}
