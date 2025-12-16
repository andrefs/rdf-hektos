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
const vitest_1 = require("vitest");
const GraphOperations_1 = __importDefault(require("../../lib/GraphOperations"));
const n3_1 = __importDefault(require("n3"));
const query_sparql_1 = require("@comunica/query-sparql");
const QueryBuilder_js_1 = require("../../lib/QueryBuilder.js");
const rdf_data_factory_1 = require("rdf-data-factory");
const factory = new rdf_data_factory_1.DataFactory();
const engine = new query_sparql_1.QueryEngine();
const NN = factory.namedNode;
const pf = "http://example.org/andrefs";
const n3 = new n3_1.default.Store();
n3.addQuad(NN(`${pf}/N1`), NN(`${pf}/R1`), NN(`${pf}/N3`));
n3.addQuad(NN(`${pf}/N2`), NN(`${pf}/R1`), NN(`${pf}/N1`));
n3.addQuad(NN(`${pf}/N3`), NN(`${pf}/R1`), NN(`${pf}/N4`));
n3.addQuad(NN(`${pf}/N4`), NN(`${pf}/R1`), NN(`${pf}/N2`));
n3.addQuad(NN(`${pf}/N4`), NN(`${pf}/R2`), NN(`${pf}/N5`));
n3.addQuad(NN(`${pf}/N4`), NN(`${pf}/R2`), NN(`${pf}/N6`));
n3.addQuad(NN(`${pf}/N5`), NN(`${pf}/R2`), NN(`${pf}/N7`));
n3.addQuad(NN(`${pf}/N5`), NN(`${pf}/R2`), NN(`${pf}/N8`));
n3.addQuad(NN(`${pf}/N6`), NN(`${pf}/R2`), NN(`${pf}/N9`));
n3.addQuad(NN(`${pf}/N6`), NN(`${pf}/R2`), NN(`${pf}/N10`));
n3.addQuad(NN(`${pf}/N8`), NN(`${pf}/R2`), NN(`${pf}/N13`));
n3.addQuad(NN(`${pf}/N9`), NN(`${pf}/R2`), NN(`${pf}/N14`));
n3.addQuad(NN(`${pf}/N13`), NN(`${pf}/R2`), NN(`${pf}/N15`));
n3.addQuad(NN(`${pf}/N14`), NN(`${pf}/R2`), NN(`${pf}/N16`));
n3.addQuad(NN(`${pf}/N7`), NN(`${pf}/R3`), factory.literal("L1"));
n3.addQuad(NN(`${pf}/N3`), NN(`${pf}/R4`), NN(`${pf}/N11`));
n3.addQuad(NN(`${pf}/N11`), NN(`${pf}/R4`), NN(`${pf}/N12`));
const graph = new GraphOperations_1.default({
    select: (sparql) => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield engine.queryBindings(sparql, { sources: [n3] });
        return res;
    }),
    engine: new query_sparql_1.QueryEngine(),
    source: "source",
});
(0, vitest_1.it)("getPreds", () => __awaiter(void 0, void 0, void 0, function* () {
    const preds = yield graph.getPreds();
    (0, vitest_1.expect)(Object.keys(preds)).toHaveLength(4);
    (0, vitest_1.expect)(preds).toHaveProperty([`${pf}/R1`, "count"], 4);
    (0, vitest_1.expect)(preds).toHaveProperty([`${pf}/R2`, "count"], 10);
    (0, vitest_1.expect)(preds).toHaveProperty([`${pf}/R3`, "count"], 1);
    (0, vitest_1.expect)(preds).toHaveProperty([`${pf}/R4`, "count"], 2);
}));
(0, vitest_1.describe)("_randomWalk", () => {
    (0, vitest_1.it)("finds loop", () => __awaiter(void 0, void 0, void 0, function* () {
        const r = yield graph._randomWalk(factory.namedNode(`${pf}/R1`), factory.namedNode(`${pf}/N1`), 6);
        (0, vitest_1.expect)(r).toHaveProperty("status", ["found_loop"]);
        (0, vitest_1.expect)(r.nodes).toHaveLength(5);
        (0, vitest_1.expect)(r.nodes[0]).toHaveProperty("value", `${pf}/N4`);
        (0, vitest_1.expect)(r.nodes[1]).toHaveProperty("value", `${pf}/N2`);
        (0, vitest_1.expect)(r.nodes[2]).toHaveProperty("value", `${pf}/N1`);
        (0, vitest_1.expect)(r.nodes[3]).toHaveProperty("value", `${pf}/N3`);
        (0, vitest_1.expect)(r.nodes[4]).toHaveProperty("value", `${pf}/N4`);
    }));
    (0, vitest_1.it)("finishes early", () => __awaiter(void 0, void 0, void 0, function* () {
        const r = yield graph._randomWalk(factory.namedNode(`${pf}/R4`), factory.namedNode(`${pf}/N3`), 4);
        (0, vitest_1.expect)(r).toHaveProperty("status", ["finished_early", "finished_early"]);
        (0, vitest_1.expect)(r.nodes).toHaveLength(3);
        (0, vitest_1.expect)(r.nodes[0]).toHaveProperty("value", `${pf}/N3`);
        (0, vitest_1.expect)(r.nodes[1]).toHaveProperty("value", `${pf}/N11`);
        (0, vitest_1.expect)(r.nodes[2]).toHaveProperty("value", `${pf}/N12`);
    }));
    (0, vitest_1.it)("finds literal", () => __awaiter(void 0, void 0, void 0, function* () {
        const r = yield graph._randomWalk(factory.namedNode(`${pf}/R3`), factory.namedNode(`${pf}/N7`), 4);
        (0, vitest_1.expect)(r).toHaveProperty("status", ["found_literal", "finished_early"]);
        (0, vitest_1.expect)(r.nodes).toHaveLength(2);
        (0, vitest_1.expect)(r.nodes[0]).toHaveProperty("value", `${pf}/N7`);
        (0, vitest_1.expect)(r.nodes[1]).toHaveProperty("value", "L1");
    }));
    (0, vitest_1.it)("finishes", () => __awaiter(void 0, void 0, void 0, function* () {
        const r = yield graph._randomWalk(factory.namedNode(`${pf}/R4`), factory.namedNode(`${pf}/N3`), 2);
        (0, vitest_1.expect)(r).toHaveProperty("status", ["finished"]);
        (0, vitest_1.expect)(r.nodes).toHaveLength(2);
        (0, vitest_1.expect)(r.nodes[0]).toHaveProperty("value", `${pf}/N3`);
        (0, vitest_1.expect)(r.nodes[1]).toHaveProperty("value", `${pf}/N11`);
    }));
});
(0, vitest_1.describe)("_randomWalks", () => {
    (0, vitest_1.it)("returns walks", () => __awaiter(void 0, void 0, void 0, function* () {
        const r = yield graph._randomWalks(factory.namedNode(`${pf}/R2`), [factory.namedNode(`${pf}/N8`), factory.namedNode(`${pf}/N9`)], 3);
        (0, vitest_1.expect)(r).toHaveProperty([`${pf}/N8`, "status"], ["finished"]);
        (0, vitest_1.expect)(r).toHaveProperty([`${pf}/N9`, "status"], ["finished"]);
        (0, vitest_1.expect)(r[`${pf}/N8`].nodes).toHaveLength(3);
        (0, vitest_1.expect)(r[`${pf}/N9`].nodes).toHaveLength(3);
        (0, vitest_1.expect)(r[`${pf}/N8`].nodes[0]).toHaveProperty("value", `${pf}/N5`);
        (0, vitest_1.expect)(r[`${pf}/N8`].nodes[1]).toHaveProperty("value", `${pf}/N8`);
        (0, vitest_1.expect)(r[`${pf}/N8`].nodes[2]).toHaveProperty("value", `${pf}/N13`);
        (0, vitest_1.expect)(r[`${pf}/N9`].nodes[0]).toHaveProperty("value", `${pf}/N6`);
        (0, vitest_1.expect)(r[`${pf}/N9`].nodes[1]).toHaveProperty("value", `${pf}/N9`);
        (0, vitest_1.expect)(r[`${pf}/N9`].nodes[2]).toHaveProperty("value", `${pf}/N14`);
    }));
});
(0, vitest_1.describe)("_randSelectSubjects", () => {
    (0, vitest_1.it)("selects subjects", () => __awaiter(void 0, void 0, void 0, function* () {
        const r = yield graph._randSelectSubjects(factory.namedNode(`${pf}/R4`), 3);
        const values = r.map((x) => x.value).sort();
        (0, vitest_1.expect)(r).toHaveLength(3);
        (0, vitest_1.expect)(values[0]).toBe(`${pf}/N11`);
        (0, vitest_1.expect)(values[1]).toBe(`${pf}/N12`);
        (0, vitest_1.expect)(values[2]).toBe(`${pf}/N3`);
    }));
});
(0, vitest_1.describe)("calcInOutRatios", () => {
    (0, vitest_1.it)("calculates ratios", () => __awaiter(void 0, void 0, void 0, function* () {
        const preds = yield graph.getPreds();
        const ratios = yield graph.calcInOutRatios(preds);
        (0, vitest_1.expect)(Object.keys(ratios)).toHaveLength(3);
        (0, vitest_1.expect)(ratios[`${pf}/R2`]).toBe(0.8333333333333334);
        (0, vitest_1.expect)(ratios[`${pf}/R1`]).toBe(1);
        (0, vitest_1.expect)(ratios[`${pf}/R4`]).toBe(1);
    }));
});
(0, vitest_1.describe)("calcRandomWalks", () => {
    (0, vitest_1.it)("calculates random walks", () => __awaiter(void 0, void 0, void 0, function* () {
        const preds = yield graph.getPreds();
        const walks = yield graph.calcRandomWalks(preds, 1, 6);
        const R1 = Object.values(walks[`${pf}/R1`][2])[0];
        (0, vitest_1.expect)(R1).toHaveProperty("status", ["found_loop"]);
        const vs = R1.nodes.map((n) => n.value);
        (0, vitest_1.expect)(R1.nodes).toHaveLength(5);
        (0, vitest_1.expect)(vs).toContain(`${pf}/N4`);
        (0, vitest_1.expect)(vs).toContain(`${pf}/N2`);
        (0, vitest_1.expect)(vs).toContain(`${pf}/N1`);
        (0, vitest_1.expect)(vs).toContain(`${pf}/N3`);
        const R2 = Object.values(walks[`${pf}/R2`][2])[0];
        (0, vitest_1.expect)(R2).toHaveProperty("status", ["finished_early", "finished_early"]);
        const R3 = Object.values(walks[`${pf}/R3`][2])[0];
        (0, vitest_1.expect)(R3).toHaveProperty("status", ["found_literal", "finished_early"]);
        const R4 = Object.values(walks[`${pf}/R4`][2])[0];
        (0, vitest_1.expect)(R4).toHaveProperty("status", ["finished_early", "finished_early"]);
    }));
});
(0, vitest_1.describe)("calcSubjectCoverage", () => {
    (0, vitest_1.it)("calculates coverage", () => __awaiter(void 0, void 0, void 0, function* () {
        const subq = new QueryBuilder_js_1.Query()
            .select("s")
            .where((0, QueryBuilder_js_1.Q)((0, QueryBuilder_js_1.V)("s"), (0, QueryBuilder_js_1.N)(`${pf}/R2`), (0, QueryBuilder_js_1.V)("o")));
        const cov = yield graph.calcSubjectCoverage(subq);
        (0, vitest_1.expect)(cov).toStrictEqual({
            "http://example.org/andrefs/R1": 2,
            "http://example.org/andrefs/R2": 16,
        });
    }));
});
(0, vitest_1.describe)("calcObjectCoverage", () => {
    (0, vitest_1.it)("calculates coverage", () => __awaiter(void 0, void 0, void 0, function* () {
        const subq = new QueryBuilder_js_1.Query()
            .select("s")
            .where((0, QueryBuilder_js_1.Q)((0, QueryBuilder_js_1.V)("s"), (0, QueryBuilder_js_1.N)(`${pf}/R2`), (0, QueryBuilder_js_1.V)("o")));
        const cov = yield graph.calcObjectCoverage(subq);
        (0, vitest_1.expect)(cov).toStrictEqual({
            "http://example.org/andrefs/R1": 2,
            "http://example.org/andrefs/R2": 16,
        });
    }));
});
(0, vitest_1.describe)("calcBranchingFactor", () => {
    (0, vitest_1.it)("calculates branching factors", () => __awaiter(void 0, void 0, void 0, function* () {
        const preds = yield graph.getPreds();
        const bfs = yield graph.calcBranchingFactor(preds);
        (0, vitest_1.expect)(bfs).toMatchInlineSnapshot(`
      {
        "http://example.org/andrefs/R1": 1,
        "http://example.org/andrefs/R2": 1.4285714285714286,
        "http://example.org/andrefs/R3": 1,
        "http://example.org/andrefs/R4": 1,
      }
    `);
    }));
});
(0, vitest_1.describe)("calcPredSeedDirectionRatio", () => {
    (0, vitest_1.it)("calculates direction ratios", () => __awaiter(void 0, void 0, void 0, function* () {
        const preds = yield graph.getPreds();
        const subq = new QueryBuilder_js_1.Query()
            .select("r")
            .where((0, QueryBuilder_js_1.VALUES)([{ "?r": (0, QueryBuilder_js_1.N)(`${pf}/N3`) }, { "?r": (0, QueryBuilder_js_1.N)(`${pf}/N6`) }]));
        const dirRatios = yield graph.calcPredSeedDirectionRatio(preds, subq);
        (0, vitest_1.expect)(dirRatios).toStrictEqual({
            "http://example.org/andrefs/R1": 1,
            "http://example.org/andrefs/R2": 2,
            "http://example.org/andrefs/R3": NaN,
            "http://example.org/andrefs/R4": Infinity,
        });
    }));
});
(0, vitest_1.describe)("globalMetrics", () => {
    (0, vitest_1.it)("calculates global metrics", () => __awaiter(void 0, void 0, void 0, function* () {
        const subq = new QueryBuilder_js_1.Query()
            .select("s")
            .where((0, QueryBuilder_js_1.Q)((0, QueryBuilder_js_1.V)("s"), (0, QueryBuilder_js_1.N)(`${pf}/R2`), (0, QueryBuilder_js_1.V)("o")));
        const global = yield graph.globalMetrics(subq);
        (0, vitest_1.expect)(global).toStrictEqual({
            totalNodes: 17, // N1-N16 + L1 = 17
            totalResources: 21, // N1-N16 + R1-R4 + L1 = 21
            totalSeeds: 10,
            totalSubjects: 12,
        });
    }));
});
//# sourceMappingURL=GraphOperations.test.js.map