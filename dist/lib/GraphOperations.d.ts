import { Query } from "./QueryBuilder";
import EventEmitter from "events";
import cliProgress from "cli-progress";
import { Bindings, Term } from "@rdfjs/types";
import SparqlWebStore from "./stores/SparqlWebStore";
import { Quad_Object, Quad_Predicate, Quad_Subject } from "n3";
interface GraphOperationsOpts {
    showProgBar?: boolean;
    concurrency?: number;
}
declare class GraphOperations extends EventEmitter {
    _store: SparqlWebStore;
    _concurrency: number;
    _bars: {
        [key: string]: cliProgress.SingleBar;
    };
    constructor(store: SparqlWebStore, { showProgBar, concurrency }?: GraphOperationsOpts);
    _handleEvents(): void;
    getPreds(): Promise<{
        [key: string]: BasePredicate;
    }>;
    _randomWalks(pred: Term, nodes: Term[], len: number): Promise<{
        [key: string]: Walk;
    }>;
    _runQuery(query: Query | string, invalidateCache?: boolean): Promise<Bindings[]>;
    rightRWStep(s: Quad_Subject, p: Term, o: string): Promise<Term | undefined>;
    leftRWStep(s: string, p: Quad_Predicate, o: Quad_Object): Promise<Term | undefined>;
    isRandomWalkOver(x: Term | undefined, visitedNodes: Set<string>): "finished_early" | "found_blank" | "found_literal" | "found_loop" | null;
    _randomWalk(pred: Term, node: Term, len: number): Promise<{
        status: string[];
        nodes: Term[];
    }>;
    _randSelectSubjects(p: Term, howMany: number): Promise<Term[]>;
    calcRandomWalks(preds: {
        [key: string]: BasePredicate;
    }, pctg?: number, walkLength?: number): Promise<{
        [key: string]: PredicateWalks;
    }>;
    calcInOutRatios(preds: {
        [key: string]: BasePredicate;
    }): Promise<{
        [key: string]: number;
    }>;
    calcLoops(preds: {
        [key: string]: Predicate;
    }): Promise<Array<[string, number]>>;
    /**
     * Calculate the subject coverage for each predicate
     * @param subSelect The subquery to select the seeds
     * @returns The subject coverage for each predicate
     */
    calcSubjectCoverage(subSelect: Query): Promise<{
        [key: string]: number;
    }>;
    /**
     * Calculate the object coverage for each predicate
     * @param subSelect The subquery to select the seeds
     * @returns The object coverage for each predicate
     */
    calcObjectCoverage(subSelect: Query): Promise<{
        [key: string]: number;
    }>;
    /**
     * Calculate the branching factor for each predicate
     * @param preds The predicates to calculate the branching factor for
     * @returns The branching factor for each predicate
     */
    calcBranchingFactor(preds: {
        [key: string]: BasePredicate;
    }): Promise<{
        [key: string]: number;
    }>;
    /**
     * Calculate the seed directionality for each predicate, i.e., the ratio of triples with each predicate where seeds are the
     * subject vs object
     * @param preds The predicates to calculate the ratio for
     * @param subSelect The subquery to select the seeds
     * @returns The ratio of triples with each predicate where seeds are the subject vs object
     */
    calcSeedDirectionality(preds: {
        [key: string]: BasePredicate;
    }, subSelect: Query): Promise<{
        [key: string]: number;
    }>;
    globalMetrics(seedQuery: Query): Promise<GlobalMetrics>;
}
export interface BasePredicate {
    count: number;
    node: Term;
}
export interface Predicate extends BasePredicate {
    sampledWalks?: number;
    walks?: {
        [key: string]: Walk;
    };
    ratio?: number;
    branchingFactor: number;
    subjCoverage: number;
    objCoverage: number;
    seedDirectionality: number;
}
export interface Walk {
    status: string[];
    nodes: Term[];
}
export interface GlobalMetrics {
    totalResources: number;
    totalNodes: number;
    totalSubjects: number;
    totalSeeds: number;
}
export type PredicateWalks = [string, number, {
    [key: string]: Walk;
}];
export default GraphOperations;
