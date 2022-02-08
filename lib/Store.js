import SparqlClient from 'sparql-http-client';
import {DataFactory} from 'rdf-data-factory';

class Store {
  constructor({endpointUrl}){
    this.client = new SparqlClient({endpointUrl, factory: new DataFactory()});
  }


  select(q){
    return this.client.query.select(q);
  }
};

export default Store;
