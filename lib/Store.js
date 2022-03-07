import {QueryEngine} from '@comunica/query-sparql';
import {LoggerPretty} from "@comunica/logger-pretty";

class Store {
  constructor({endpointUrl}){
    this.engine = new QueryEngine();
    this.source = endpointUrl;
  }


  async select(q){
    const preQuery = new Date().getTime();
    const res = await this.engine.queryBindings(q, {
      sources: [{
        type: 'sparql',
        value: this.source
      }],
      //log: new LoggerPretty({ level: 'trace' })
    });

    const postQuery = new Date().getTime();
    const duration = (postQuery-preQuery)/1000;
    if(duration > 10){
      console.warn(`Slow query (${duration}):\n${q}`);
    }

    return res;
  }
};

export default Store;
