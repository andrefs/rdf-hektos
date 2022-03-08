var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import GraphOperations from './lib/GraphOperations.js';
import { summPreds, ppMatrix, flattenObjValues } from './lib/utils.js';
import Store from './lib/Store.js';
import opts from './lib/opts.js';
import { N, Q, Query, V } from './lib/QueryBuilder.js';
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        console.warn('Starting');
        console.warn('  getting predicates');
        const host = 'http://localhost';
        //const port = '7201';
        const repo = opts.repository || 'wordnet';
        //const endpointUrl = `${host}:${port}/repositories/${repo}`;
        const port = '3030';
        const endpointUrl = opts.endpointUrl || `${host}:${port}/${repo}/sparql`;
        const store = new Store({ endpointUrl });
        const graph = new GraphOperations(store, { showProgBar: opts.showProgBar });
        let preds = yield graph.getPreds();
        const walks = yield graph.calcRandomWalks(preds, 1, 10);
        for (const [p, sampledWalks, ws] of walks) {
            preds[p].sampledWalks = sampledWalks;
            preds[p].walks = ws;
        }
        const ratios = yield graph.calcInOutRatios(preds);
        for (const [p, r] of ratios) {
            if (preds[p]) {
                preds[p].ratio = r;
            }
        }
        const a = N('http://www.w3.org/1999/02/22-rdf-syntax-ns#type');
        const synsetClass = N('http://www.w3.org/ns/lemon/ontolex#LexicalConcept');
        const subq = new Query().select('s')
            .where(Q(V('s'), a, synsetClass));
        let global = yield graph.globalMetrics(subq);
        const cov = yield graph.calcCoverage(subq);
        for (const [p, c] of cov) {
            preds[p].coverage = c;
        }
        //await calcLoops(preds);
        const sum = summPreds(preds);
        ppMatrix(flattenObjValues(sum), opts.outputFile);
    });
}
run();
