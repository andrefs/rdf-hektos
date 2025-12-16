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
const query_sparql_1 = require("@comunica/query-sparql");
const Store_1 = __importDefault(require("./Store"));
const logger_pretty_1 = require("@comunica/logger-pretty");
class SparqlWebStore extends Store_1.default {
    constructor({ endpointUrl }) {
        super();
        this.engine = new query_sparql_1.QueryEngine();
        this.source = endpointUrl;
    }
    select(q) {
        return __awaiter(this, void 0, void 0, function* () {
            const preQuery = Date.now();
            console.log("XXXXXXXXXXXXXXx SparqlWebStore", { q });
            const res = yield this.engine.queryBindings(q, {
                sources: [
                    {
                        type: "sparql",
                        value: this.source,
                    },
                ],
                log: new logger_pretty_1.LoggerPretty({ level: "trace" }),
            });
            res.on("end", () => {
                const postQuery = Date.now();
                const duration = (postQuery - preQuery) / 1000;
                if (duration > 5) {
                    console.warn(`Slow query (${duration}):\n${q}`);
                }
            });
            return res;
        });
    }
}
exports.default = SparqlWebStore;
//# sourceMappingURL=SparqlWebStore.js.map