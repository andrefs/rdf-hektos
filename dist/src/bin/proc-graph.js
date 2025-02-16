var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { promises as fs } from 'fs';
import SparqlWebStore from '../lib/stores/SparqlWebStore.ts';
import opts from '../lib/proc-graph-opts.ts';
import { classToSubQ, procGraph, roisToSubQ } from '../lib/proc-graph.ts';
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!opts.dataset && !opts.endpoint) {
        console.error('No dataset or endpoint specified: at least one of --dataset or --endpoint must be provided');
        process.exit(1);
    }
    const host = 'http://localhost';
    const ds = opts.dataset;
    const port = '3030';
    const endpointUrl = opts.endpoint || `${host}:${port}/${ds}/sparql`;
    if (opts.verbose) {
        console.warn(`Using endpoint: ${endpointUrl}`);
    }
    let subQ;
    if (!opts.rois && !opts.roisFile && !opts.roiClass) {
        console.error('No resources of interest specified: at least one of --rois, --roisFile, or --roiClass must be provided');
        process.exit(1);
    }
    if (opts.rois) {
        subQ = roisToSubQ(opts.rois, 's');
    }
    else if (opts.roisFile) {
        const rois = yield fs.readFile(opts.roisFile, 'utf8');
        subQ = roisToSubQ(rois.split('\n').filter(r => r), 's');
    }
    else if (opts.roiClass) {
        subQ = classToSubQ(opts.roiClass, 's');
    }
    const store = new SparqlWebStore({ endpointUrl });
    const res = yield procGraph(store, subQ, opts);
    const file = opts.output || `${ds}-metrics.json`;
    console.warn(`Saving output to ${file}`);
    yield fs.writeFile(file, JSON.stringify(res, null, 2));
});
run().then(() => console.warn('done')).catch(console.error);
//# sourceMappingURL=proc-graph.js.map