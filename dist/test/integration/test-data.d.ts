import N3 from "n3";
import { QueryEngine } from "@comunica/query-sparql";
import { DataFactory } from "rdf-data-factory";
export declare const factory: DataFactory<import("@rdfjs/types").Quad>;
export declare const engine: QueryEngine<import("@comunica/types").IQueryContextCommon>;
export declare const NN: <Iri extends string = string>(value: Iri) => import("rdf-data-factory").NamedNode<Iri>;
export declare const pf = "http://example.org/andrefs/hektos-test";
/**
 * Sets up the test graph with sample data for GraphOperations tests
 */
export declare function setupTestGraph(): N3.Store;
