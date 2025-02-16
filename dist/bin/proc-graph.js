"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const SparqlWebStore_1 = __importDefault(require("../lib/stores/SparqlWebStore"));
const proc_graph_opts_1 = __importDefault(require("../lib/proc-graph-opts"));
const proc_graph_1 = require("../lib/proc-graph");
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!proc_graph_opts_1.default.dataset && !proc_graph_opts_1.default.endpoint) {
        console.error('No dataset or endpoint specified: at least one of --dataset or --endpoint must be provided');
        process.exit(1);
    }
    const host = 'http://localhost';
    const ds = proc_graph_opts_1.default.dataset;
    const port = '3030';
    const endpointUrl = proc_graph_opts_1.default.endpoint || `${host}:${port}/${ds}/sparql`;
    if (proc_graph_opts_1.default.verbose) {
        console.warn(`Using endpoint: ${endpointUrl}`);
    }
    let subQ;
    if (!proc_graph_opts_1.default.rois && !proc_graph_opts_1.default.roisFile && !proc_graph_opts_1.default.roiClass) {
        console.error('No resources of interest specified: at least one of --rois, --roisFile, or --roiClass must be provided');
        process.exit(1);
    }
    if (proc_graph_opts_1.default.rois) {
        subQ = (0, proc_graph_1.roisToSubQ)(proc_graph_opts_1.default.rois, 's');
    }
    else if (proc_graph_opts_1.default.roisFile) {
        const rois = yield fs_1.promises.readFile(proc_graph_opts_1.default.roisFile, 'utf8');
        subQ = (0, proc_graph_1.roisToSubQ)(rois.split('\n').filter(r => r), 's');
    }
    else if (proc_graph_opts_1.default.roiClass) {
        subQ = (0, proc_graph_1.classToSubQ)(proc_graph_opts_1.default.roiClass, 's');
    }
    const store = new SparqlWebStore_1.default({ endpointUrl });
    const res = yield (0, proc_graph_1.procGraph)(store, subQ, proc_graph_opts_1.default);
    const file = proc_graph_opts_1.default.output || `${ds}-metrics.json`;
    console.warn(`Saving output to ${file}`);
    yield fs_1.promises.writeFile(file, JSON.stringify(res, null, 2));
});
run().then(() => console.warn('done')).catch(console.error);
//# sourceMappingURL=proc-graph.js.map