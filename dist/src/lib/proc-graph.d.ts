import { Predicate } from "./GraphOperations.ts";
import { CliOptions } from "./proc-graph-opts.ts";
import { Query } from "./QueryBuilder.ts";
import SparqlWebStore from "./stores/SparqlWebStore.ts";
/**
 * Process the graph
 * @param store The store to query
 * @param subSelect The query to select the resources of interest
 * @param options The options for the process
 */
export declare function procGraph(store: SparqlWebStore, subSelect: Query, options: CliOptions): Promise<{
    globalMetrics: import("./GraphOperations.ts").GlobalMetrics;
    predicates: {
        [key: string]: Predicate;
    };
}>;
/**
 * Convert a list of resources of interest (ROIs) to a select VALUES subquery
 * @param rois The list of ROIs
 * @param roiVar The variable name for the ROI
 * @returns The subquery
 */
export declare function roisToSubQ(rois: string[], roiVar: string): Query;
/**
 * Convert a class URI to a select subquery
 * @param classUri The URI of the class
 * @param classVar The variable name for the class
 * @param a The predicate to use for the class (default: rdf:type)
 * @returns The subquery
 */
export declare function classToSubQ(classUri: string, classVar: string, a?: string): Query;
