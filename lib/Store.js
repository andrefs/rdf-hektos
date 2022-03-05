import {QueryEngine} from '@comunica/query-sparql';
import {LoggerPretty} from "@comunica/logger-pretty";

class Store {
  constructor({endpointUrl}){
    this.engine = new QueryEngine();
    this.source = endpointUrl;
  }


  async select(q){
    const res = await this.engine.queryBindings(q, {
      sources: [{
        type: 'sparql',
        value: this.source
      }],
      //log: new LoggerPretty({ level: 'trace' })
    });
    return res;
  }
};

export default Store;
