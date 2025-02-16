var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { QueryEngine } from '@comunica/query-sparql';
import { Store } from './Store.ts';
class SparqlWebStore extends Store {
    constructor({ endpointUrl }) {
        super();
        this.engine = new QueryEngine();
        this.source = endpointUrl;
    }
    select(q) {
        return __awaiter(this, void 0, void 0, function* () {
            const preQuery = Date.now();
            const res = yield this.engine.queryBindings(q, {
                sources: [{
                        type: 'sparql',
                        value: this.source
                    }],
                //log: new LoggerPretty({ level: 'trace' })
            });
            res.on('end', () => {
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
;
export default SparqlWebStore;
//# sourceMappingURL=SparqlWebStore.js.map