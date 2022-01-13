const {RDFRepositoryClient, RepositoryClientConfig} = require('graphdb').repository;
const {RDFMimeType} = require('graphdb').http;
const {SparqlXmlResultParser} = require('graphdb').parser;
const {QueryType, GetQueryPayload} = require('graphdb').query;

class Store {
    constructor(){
        const endpoint = 'http://localhost:7200';
        const repo = 'test_db';
        const readTimeout = 30000;
        const writeTimeout = 30000;
        this.config = new RepositoryClientConfig(endpoint)
            .setEndpoints([endpoint+'/repositories/'+repo])
            .setHeaders({
              'Accept': RDFMimeType.TURTLE
            })
            .setReadTimeout(readTimeout)
            .setWriteTimeout(writeTimeout);
        this.repository = new RDFRepositoryClient(this.config);
        this.repository.registerParser(new SparqlXmlResultParser());
    }

    select(q){
        const payload = new GetQueryPayload()
          .setQuery(q)
          .setQueryType(QueryType.SELECT)
          .setResponseType(RDFMimeType.SPARQL_RESULTS_XML)
          .setLimit(100);

        return this.repository.query(payload);
    }
};

module.exports = Store;
