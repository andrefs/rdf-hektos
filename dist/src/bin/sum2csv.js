var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { summMetrics, ppMatrix, flattenObjValues } from '../lib/utils.ts';
import fs from 'node:fs/promises';
import opts from '../lib/sum2csv-opts.ts';
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        console.warn('Starting');
        const file = opts.input;
        console.warn(`Loading file ${file}`);
        const json = yield fs.readFile(file, { encoding: 'utf8' });
        const { predicates: preds, globalMetrics } = JSON.parse(json);
        const sum = summMetrics(preds, globalMetrics);
        const output = opts.output || 'results.csv';
        ppMatrix(flattenObjValues(sum), output);
    });
}
run();
//# sourceMappingURL=sum2csv.js.map