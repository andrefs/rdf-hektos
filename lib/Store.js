import SparqlClient from 'sparql-http-client';
import {DataFactory} from 'rdf-data-factory';

class Store {
  constructor({endpointUrl}){
    //const endpoint = (host || 'http://localhost')+':'+(port || 7200);
    const readTimeout = 300 * 1000;
    const writeTimeout = 300 * 1000;
    this.client = new SparqlClient({endpointUrl, factory: new DataFactory()});
  }


  select(q){
    return this.client.query.select(q);
  }
};

export default Store;
