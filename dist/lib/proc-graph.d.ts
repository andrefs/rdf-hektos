import { Predicate } from "./GraphOperations";
import { CliOptions } from "./proc-graph-opts";
import { Query, WhereArg } from "./QueryBuilder";
import SparqlWebStore from "./stores/SparqlWebStore";
/**
 * Process the graph
 * @param store The store to query
 * @param subSelect The query to select the resources of interest
 * @param options The options for the process
 */
export declare function procGraph(store: SparqlWebStore, subSelect: WhereArg, options: CliOptions): Promise<{
    globalMetrics: import("./GraphOperations").GlobalMetrics;
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
 * Convert a list of resources of interest (ROIs) to a VALUES clause
 * @param rois The list of ROIs
 * @returns The VALUES clause
 */
export declare function roisToValues(rois: string[], roiVar?: string): import("sparqljs").ValuesPattern;
/**
 * Convert a class URI to a select subquery
 * @param classUri The URI of the class
 * @param classVar The variable name for the class
 * @param a The predicate to use for the class (default: rdf:type)
 * @returns The subquery
 */
export declare function classToSubQ(classUri: string, classVar: string, a?: string): Query;
