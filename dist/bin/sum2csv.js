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
const utils_1 = require("../lib/utils");
const promises_1 = __importDefault(require("node:fs/promises"));
const sum2csv_opts_1 = __importDefault(require("../lib/sum2csv-opts"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        console.warn('Starting');
        const file = sum2csv_opts_1.default.input;
        console.warn(`Loading file ${file}`);
        const json = yield promises_1.default.readFile(file, { encoding: 'utf8' });
        const { predicates: preds, globalMetrics } = JSON.parse(json);
        const sum = (0, utils_1.summMetrics)(preds, globalMetrics);
        const output = sum2csv_opts_1.default.output || 'results.csv';
        (0, utils_1.ppMatrix)((0, utils_1.flattenObjValues)(sum), output);
    });
}
run();
//# sourceMappingURL=sum2csv.js.map