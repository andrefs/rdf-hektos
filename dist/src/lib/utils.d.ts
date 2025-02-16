import { GlobalMetrics, Predicate } from './GraphOperations.ts';
interface PredicateSummary {
    [key: string]: any;
    ratio?: number;
    count?: number;
    subjCoverage?: number;
    objCoverage?: number;
    sampledWalks?: number;
    branchingFactor?: number;
    walks?: {
        [key: string]: number;
    };
    avgLen?: number;
}
export declare const summMetrics: (preds: {
    [key: string]: Predicate;
}, globalMetrics: GlobalMetrics) => {
    [key: string]: PredicateSummary;
};
export declare const flattenObj: (obj: FlattableObject, parentKey?: (string | null), res?: {
    [key: string]: any;
}) => {
    [key: string]: any;
};
type FlattableObject = {
    [key: string]: (number | string | FlattableObject);
};
export declare const flattenObjValues: (obj: FlattableObject) => {
    [key: string]: any;
};
export declare const ppMatrix: (data: {
    [key: string]: any;
}, outputFile: string) => Promise<void>;
export declare const prettyMatrix: (data: {
    [key: string]: any;
}) => string;
export {};
