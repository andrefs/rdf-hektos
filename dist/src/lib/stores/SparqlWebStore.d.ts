/// <reference types="node" resolution-mode="require"/>
import { QueryEngine } from '@comunica/query-sparql';
import { EventEmitter } from 'stream';
import { Store } from './Store.ts';
declare class SparqlWebStore extends Store {
    engine: QueryEngine;
    source: string;
    constructor({ endpointUrl }: {
        endpointUrl: string;
    });
    select(q: string): Promise<EventEmitter>;
}
export default SparqlWebStore;
