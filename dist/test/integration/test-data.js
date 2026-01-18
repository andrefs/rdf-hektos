"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pf = exports.NN = exports.engine = exports.factory = void 0;
exports.setupTestGraph = setupTestGraph;
const n3_1 = __importDefault(require("n3"));
const query_sparql_1 = require("@comunica/query-sparql");
const rdf_data_factory_1 = require("rdf-data-factory");
exports.factory = new rdf_data_factory_1.DataFactory();
exports.engine = new query_sparql_1.QueryEngine();
exports.NN = exports.factory.namedNode;
exports.pf = "http://example.org/andrefs/hektos-test";
/**
 * Sets up the test graph with sample data for GraphOperations tests
 */
function setupTestGraph() {
    const n3 = new n3_1.default.Store();
    n3.addQuad((0, exports.NN)(`${exports.pf}/N1`), (0, exports.NN)(`${exports.pf}/R1`), (0, exports.NN)(`${exports.pf}/N3`));
    n3.addQuad((0, exports.NN)(`${exports.pf}/N2`), (0, exports.NN)(`${exports.pf}/R1`), (0, exports.NN)(`${exports.pf}/N1`));
    n3.addQuad((0, exports.NN)(`${exports.pf}/N3`), (0, exports.NN)(`${exports.pf}/R1`), (0, exports.NN)(`${exports.pf}/N4`));
    n3.addQuad((0, exports.NN)(`${exports.pf}/N4`), (0, exports.NN)(`${exports.pf}/R1`), (0, exports.NN)(`${exports.pf}/N2`));
    n3.addQuad((0, exports.NN)(`${exports.pf}/N4`), (0, exports.NN)(`${exports.pf}/R2`), (0, exports.NN)(`${exports.pf}/N5`));
    n3.addQuad((0, exports.NN)(`${exports.pf}/N4`), (0, exports.NN)(`${exports.pf}/R2`), (0, exports.NN)(`${exports.pf}/N6`));
    n3.addQuad((0, exports.NN)(`${exports.pf}/N5`), (0, exports.NN)(`${exports.pf}/R2`), (0, exports.NN)(`${exports.pf}/N7`));
    n3.addQuad((0, exports.NN)(`${exports.pf}/N5`), (0, exports.NN)(`${exports.pf}/R2`), (0, exports.NN)(`${exports.pf}/N8`));
    n3.addQuad((0, exports.NN)(`${exports.pf}/N6`), (0, exports.NN)(`${exports.pf}/R2`), (0, exports.NN)(`${exports.pf}/N9`));
    n3.addQuad((0, exports.NN)(`${exports.pf}/N6`), (0, exports.NN)(`${exports.pf}/R2`), (0, exports.NN)(`${exports.pf}/N10`));
    n3.addQuad((0, exports.NN)(`${exports.pf}/N8`), (0, exports.NN)(`${exports.pf}/R2`), (0, exports.NN)(`${exports.pf}/N13`));
    n3.addQuad((0, exports.NN)(`${exports.pf}/N9`), (0, exports.NN)(`${exports.pf}/R2`), (0, exports.NN)(`${exports.pf}/N14`));
    n3.addQuad((0, exports.NN)(`${exports.pf}/N13`), (0, exports.NN)(`${exports.pf}/R2`), (0, exports.NN)(`${exports.pf}/N15`));
    n3.addQuad((0, exports.NN)(`${exports.pf}/N14`), (0, exports.NN)(`${exports.pf}/R2`), (0, exports.NN)(`${exports.pf}/N16`));
    n3.addQuad((0, exports.NN)(`${exports.pf}/N7`), (0, exports.NN)(`${exports.pf}/R3`), exports.factory.literal("L1"));
    n3.addQuad((0, exports.NN)(`${exports.pf}/N3`), (0, exports.NN)(`${exports.pf}/R4`), (0, exports.NN)(`${exports.pf}/N11`));
    n3.addQuad((0, exports.NN)(`${exports.pf}/N11`), (0, exports.NN)(`${exports.pf}/R4`), (0, exports.NN)(`${exports.pf}/N12`));
    n3.addQuad((0, exports.NN)(`${exports.pf}/N1`), (0, exports.NN)(`${exports.pf}/R4`), (0, exports.NN)(`${exports.pf}/N11`));
    return n3;
}
//# sourceMappingURL=test-data.js.map