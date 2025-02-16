var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import GraphOperations from "./GraphOperations.ts";
import { N, Q, Query, V, VALUES } from "./QueryBuilder.ts";
/**
 * Process the graph
 * @param store The store to query
 * @param subSelect The query to select the resources of interest
 * @param options The options for the process
 */
export function procGraph(store, subSelect, options) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        console.warn('Starting');
        console.warn('  getting predicates');
        const graph = new GraphOperations(store, { showProgBar: !options.noProgressBar });
        let basePreds = yield graph.getPreds();
        let gm = yield graph.globalMetrics(subSelect);
        const preds = {};
        const scov = yield graph.calcSubjectCoverage(subSelect);
        const ocov = yield graph.calcObjectCoverage(subSelect);
        const bfs = yield graph.calcBranchingFactor(basePreds);
        for (const [p, basePred] of Object.entries(basePreds)) {
            const s = (_a = scov[p]) !== null && _a !== void 0 ? _a : 0;
            const o = (_b = ocov[p]) !== null && _b !== void 0 ? _b : 0;
            const bf = (_c = bfs[p]) !== null && _c !== void 0 ? _c : 0;
            preds[p] = Object.assign(Object.assign({}, basePred), { subjCoverage: s, objCoverage: o, branchingFactor: bf });
        }
        return { globalMetrics: gm, predicates: preds };
    });
}
;
/**
 * Convert a list of resources of interest (ROIs) to a select VALUES subquery
 * @param rois The list of ROIs
 * @param roiVar The variable name for the ROI
 * @returns The subquery
 */
export function roisToSubQ(rois, roiVar) {
    const roiQ = new Query().select(roiVar)
        .where(VALUES(rois.map(r => ({ [roiVar]: N(r) }))));
    return roiQ;
}
/**
 * Convert a class URI to a select subquery
 * @param classUri The URI of the class
 * @param classVar The variable name for the class
 * @param a The predicate to use for the class (default: rdf:type)
 * @returns The subquery
 */
export function classToSubQ(classUri, classVar, a = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
    const classNode = N(classUri);
    const subq = new Query().select(classVar)
        .where(Q(V(classVar), N(a), classNode));
    return subq;
}
//# sourceMappingURL=proc-graph.js.map