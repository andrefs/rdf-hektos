const SparqlGenerator = require('sparqljs').Generator;
const generator = new SparqlGenerator();

const wrapVar = (varName) => {
  return {
    termType: 'Variable',
    value: varName
  }
};

const COUNT = (bind, as, distinct) => ({
  expression: {
    expression: wrapVar(bind),
    type: 'aggregate',
    aggregation: 'count',
    distinct: !!distinct
  },
  variable: wrapVar(as)
});

const RAND = (...args) => ({
  expression: {
    type: operation,
    operator: 'rand',
    args
  }
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
                  .map(b => typeof b === 'string' ? wrapVar(b) : b)
    };
    return this;
  }

  where(triples){
    this.obj = {
      ...this.obj,
      where: {
        type: 'bgp',
        triples: triples.map(t => ({
          subject: {
            termType: 'Variable',
            value: t[0]
          },
          predicate: {
            termType: 'Variable',
            value: t[1]
          },
          object: {
            termType: 'Variable',
            value: t[2]
          }
        }))
      }
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

  orderBy(arg){
    if(typeof arg !== 'string'){
      this.obj.order = {
        expression: arg
      }
    } else {
      //todo
    }
    return this;
  }

  toSparql(){
    return generator.stringify(this.obj);
  }
};

module.exports = {
  Query,
  COUNT
}
