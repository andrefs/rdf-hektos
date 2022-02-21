import {newEngine} from '@comunica/actor-init-sparql';
import {LoggerPretty} from "@comunica/logger-pretty";

class Store {
  constructor({endpointUrl}){
    this.engine = newEngine();
    this.source = endpointUrl;
  }


  async select(q){
    const res = await this.engine.query(q, {
      sources: [{
        type: 'sparql',
        value: this.source
      }],
      log: new LoggerPretty({ level: 'trace' })
    });
    return res.bindingsStream;
  }
};

export default Store;
