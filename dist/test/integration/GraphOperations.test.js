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
const QueryBuilder_js_1 = require("../../lib/QueryBuilder.js");
const test_data_1 = require("./test-data");
const n3 = (0, test_data_1.setupTestGraph)();
const graph = new GraphOperations_1.default({
    select: (sparql) => __awaiter(void 0, void 0, void 0, function* () {
        const res = yield test_data_1.engine.queryBindings(sparql, { sources: [n3] });
        return res;
    }),
    engine: test_data_1.engine,
    source: "source",
});
(0, vitest_1.it)("getPreds", () => __awaiter(void 0, void 0, void 0, function* () {
    const preds = yield graph.getPreds();
    (0, vitest_1.expect)(Object.keys(preds)).toHaveLength(4);
    (0, vitest_1.expect)(preds).toHaveProperty([`${test_data_1.pf}/R1`, "count"], 4);
    (0, vitest_1.expect)(preds).toHaveProperty([`${test_data_1.pf}/R2`, "count"], 10);
    (0, vitest_1.expect)(preds).toHaveProperty([`${test_data_1.pf}/R3`, "count"], 1);
    (0, vitest_1.expect)(preds).toHaveProperty([`${test_data_1.pf}/R4`, "count"], 2);
}));
(0, vitest_1.describe)("_randomWalk", () => {
    (0, vitest_1.it)("finds loop", () => __awaiter(void 0, void 0, void 0, function* () {
        const r = yield graph._randomWalk(test_data_1.factory.namedNode(`${test_data_1.pf}/R1`), test_data_1.factory.namedNode(`${test_data_1.pf}/N1`), 6);
        (0, vitest_1.expect)(r).toHaveProperty("status", ["found_loop"]);
        (0, vitest_1.expect)(r.nodes).toHaveLength(5);
        (0, vitest_1.expect)(r.nodes[0]).toHaveProperty("value", `${test_data_1.pf}/N4`);
        (0, vitest_1.expect)(r.nodes[1]).toHaveProperty("value", `${test_data_1.pf}/N2`);
        (0, vitest_1.expect)(r.nodes[2]).toHaveProperty("value", `${test_data_1.pf}/N1`);
        (0, vitest_1.expect)(r.nodes[3]).toHaveProperty("value", `${test_data_1.pf}/N3`);
        (0, vitest_1.expect)(r.nodes[4]).toHaveProperty("value", `${test_data_1.pf}/N4`);
    }));
    (0, vitest_1.it)("finishes early", () => __awaiter(void 0, void 0, void 0, function* () {
        const r = yield graph._randomWalk(test_data_1.factory.namedNode(`${test_data_1.pf}/R4`), test_data_1.factory.namedNode(`${test_data_1.pf}/N3`), 4);
        (0, vitest_1.expect)(r).toHaveProperty("status", ["finished_early", "finished_early"]);
        (0, vitest_1.expect)(r.nodes).toHaveLength(3);
        (0, vitest_1.expect)(r.nodes[0]).toHaveProperty("value", `${test_data_1.pf}/N3`);
        (0, vitest_1.expect)(r.nodes[1]).toHaveProperty("value", `${test_data_1.pf}/N11`);
        (0, vitest_1.expect)(r.nodes[2]).toHaveProperty("value", `${test_data_1.pf}/N12`);
    }));
    (0, vitest_1.it)("finds literal", () => __awaiter(void 0, void 0, void 0, function* () {
        const r = yield graph._randomWalk(test_data_1.factory.namedNode(`${test_data_1.pf}/R3`), test_data_1.factory.namedNode(`${test_data_1.pf}/N7`), 4);
        (0, vitest_1.expect)(r).toHaveProperty("status", ["found_literal", "finished_early"]);
        (0, vitest_1.expect)(r.nodes).toHaveLength(2);
        (0, vitest_1.expect)(r.nodes[0]).toHaveProperty("value", `${test_data_1.pf}/N7`);
        (0, vitest_1.expect)(r.nodes[1]).toHaveProperty("value", "L1");
    }));
    (0, vitest_1.it)("finishes", () => __awaiter(void 0, void 0, void 0, function* () {
        const r = yield graph._randomWalk(test_data_1.factory.namedNode(`${test_data_1.pf}/R4`), test_data_1.factory.namedNode(`${test_data_1.pf}/N3`), 2);
        (0, vitest_1.expect)(r).toHaveProperty("status", ["finished"]);
        (0, vitest_1.expect)(r.nodes).toHaveLength(2);
        (0, vitest_1.expect)(r.nodes[0]).toHaveProperty("value", `${test_data_1.pf}/N3`);
        (0, vitest_1.expect)(r.nodes[1]).toHaveProperty("value", `${test_data_1.pf}/N11`);
    }));
});
(0, vitest_1.describe)("_randomWalks", () => {
    (0, vitest_1.it)("returns walks", () => __awaiter(void 0, void 0, void 0, function* () {
        const r = yield graph._randomWalks(test_data_1.factory.namedNode(`${test_data_1.pf}/R2`), [test_data_1.factory.namedNode(`${test_data_1.pf}/N8`), test_data_1.factory.namedNode(`${test_data_1.pf}/N9`)], 3);
        (0, vitest_1.expect)(r).toHaveProperty([`${test_data_1.pf}/N8`, "status"], ["finished"]);
        (0, vitest_1.expect)(r).toHaveProperty([`${test_data_1.pf}/N9`, "status"], ["finished"]);
        (0, vitest_1.expect)(r[`${test_data_1.pf}/N8`].nodes).toHaveLength(3);
        (0, vitest_1.expect)(r[`${test_data_1.pf}/N9`].nodes).toHaveLength(3);
        (0, vitest_1.expect)(r[`${test_data_1.pf}/N8`].nodes[0]).toHaveProperty("value", `${test_data_1.pf}/N5`);
        (0, vitest_1.expect)(r[`${test_data_1.pf}/N8`].nodes[1]).toHaveProperty("value", `${test_data_1.pf}/N8`);
        (0, vitest_1.expect)(r[`${test_data_1.pf}/N8`].nodes[2]).toHaveProperty("value", `${test_data_1.pf}/N13`);
        (0, vitest_1.expect)(r[`${test_data_1.pf}/N9`].nodes[0]).toHaveProperty("value", `${test_data_1.pf}/N6`);
        (0, vitest_1.expect)(r[`${test_data_1.pf}/N9`].nodes[1]).toHaveProperty("value", `${test_data_1.pf}/N9`);
        (0, vitest_1.expect)(r[`${test_data_1.pf}/N9`].nodes[2]).toHaveProperty("value", `${test_data_1.pf}/N14`);
    }));
});
(0, vitest_1.describe)("_randSelectSubjects", () => {
    (0, vitest_1.it)("selects subjects", () => __awaiter(void 0, void 0, void 0, function* () {
        const r = yield graph._randSelectSubjects(test_data_1.factory.namedNode(`${test_data_1.pf}/R4`), 3);
        const values = r.map((x) => x.value).sort();
        (0, vitest_1.expect)(r).toHaveLength(3);
        (0, vitest_1.expect)(values[0]).toBe(`${test_data_1.pf}/N11`);
        (0, vitest_1.expect)(values[1]).toBe(`${test_data_1.pf}/N12`);
        (0, vitest_1.expect)(values[2]).toBe(`${test_data_1.pf}/N3`);
    }));
});
(0, vitest_1.describe)("calcInOutRatios", () => {
    (0, vitest_1.it)("calculates ratios", () => __awaiter(void 0, void 0, void 0, function* () {
        const preds = yield graph.getPreds();
        const ratios = yield graph.calcInOutRatios(preds);
        (0, vitest_1.expect)(Object.keys(ratios)).toHaveLength(3);
        (0, vitest_1.expect)(ratios[`${test_data_1.pf}/R2`]).toBe(0.8333333333333334);
        (0, vitest_1.expect)(ratios[`${test_data_1.pf}/R1`]).toBe(1);
        (0, vitest_1.expect)(ratios[`${test_data_1.pf}/R4`]).toBe(1);
    }));
});
(0, vitest_1.describe)("calcRandomWalks", () => {
    (0, vitest_1.it)("calculates random walks", () => __awaiter(void 0, void 0, void 0, function* () {
        const preds = yield graph.getPreds();
        const walks = yield graph.calcRandomWalks(preds, 1, 6);
        const R1 = Object.values(walks[`${test_data_1.pf}/R1`][2])[0];
        (0, vitest_1.expect)(R1).toHaveProperty("status", ["found_loop"]);
        const vs = R1.nodes.map((n) => n.value);
        (0, vitest_1.expect)(R1.nodes).toHaveLength(5);
        (0, vitest_1.expect)(vs).toContain(`${test_data_1.pf}/N4`);
        (0, vitest_1.expect)(vs).toContain(`${test_data_1.pf}/N2`);
        (0, vitest_1.expect)(vs).toContain(`${test_data_1.pf}/N1`);
        (0, vitest_1.expect)(vs).toContain(`${test_data_1.pf}/N3`);
        const R2 = Object.values(walks[`${test_data_1.pf}/R2`][2])[0];
        (0, vitest_1.expect)(R2).toHaveProperty("status", ["finished_early", "finished_early"]);
        const R3 = Object.values(walks[`${test_data_1.pf}/R3`][2])[0];
        (0, vitest_1.expect)(R3).toHaveProperty("status", ["found_literal", "finished_early"]);
        const R4 = Object.values(walks[`${test_data_1.pf}/R4`][2])[0];
        (0, vitest_1.expect)(R4).toHaveProperty("status", ["finished_early", "finished_early"]);
    }));
});
(0, vitest_1.describe)("calcSubjectCoverage", () => {
    (0, vitest_1.it)("calculates coverage", () => __awaiter(void 0, void 0, void 0, function* () {
        const subq = new QueryBuilder_js_1.Query()
            .distinct()
            .select("seed")
            .where((0, QueryBuilder_js_1.Q)((0, QueryBuilder_js_1.V)("seed"), (0, QueryBuilder_js_1.N)(`${test_data_1.pf}/R2`), (0, QueryBuilder_js_1.V)("o")));
        const cov = yield graph.calcSubjectCoverage(subq);
        (0, vitest_1.expect)(cov).toStrictEqual({
            [`${test_data_1.pf}/R1`]: 1,
            [`${test_data_1.pf}/R2`]: 7,
        });
    }));
});
(0, vitest_1.describe)("calcObjectCoverage", () => {
    (0, vitest_1.it)("calculates coverage", () => __awaiter(void 0, void 0, void 0, function* () {
        const subq = new QueryBuilder_js_1.Query()
            .distinct()
            .select("s")
            .where((0, QueryBuilder_js_1.Q)((0, QueryBuilder_js_1.V)("s"), (0, QueryBuilder_js_1.N)(`${test_data_1.pf}/R2`), (0, QueryBuilder_js_1.V)("o")));
        const cov = yield graph.calcObjectCoverage(subq);
        (0, vitest_1.expect)(cov).toStrictEqual({
            [`${test_data_1.pf}/R1`]: 1,
            [`${test_data_1.pf}/R2`]: 10,
        });
    }));
});
(0, vitest_1.describe)("calcBranchingFactor", () => {
    (0, vitest_1.it)("calculates branching factors", () => __awaiter(void 0, void 0, void 0, function* () {
        const preds = yield graph.getPreds();
        const bfs = yield graph.calcBranchingFactor(preds);
        (0, vitest_1.expect)(bfs).toMatchInlineSnapshot(`
      {
        "http://example.org/andrefs/hektos-test/R1": {
          "obj": 4,
          "subj": 4,
        },
        "http://example.org/andrefs/hektos-test/R2": {
          "obj": 7,
          "subj": 10,
        },
        "http://example.org/andrefs/hektos-test/R3": {
          "obj": 1,
          "subj": 1,
        },
        "http://example.org/andrefs/hektos-test/R4": {
          "obj": 2,
          "subj": 2,
        },
      }
    `);
    }));
});
(0, vitest_1.describe)("calcSeedPosRatio", () => {
    (0, vitest_1.it)("calculates seed position ratios", () => __awaiter(void 0, void 0, void 0, function* () {
        const preds = yield graph.getPreds();
        const subq = new QueryBuilder_js_1.Query()
            .distinct()
            .select("seed")
            .where((0, QueryBuilder_js_1.VALUES)([{ "?seed": (0, QueryBuilder_js_1.N)(`${test_data_1.pf}/N3`) }, { "?seed": (0, QueryBuilder_js_1.N)(`${test_data_1.pf}/N6`) }]));
        const seedPRs = yield graph.calcSeedPosRatio(preds, subq);
        (0, vitest_1.expect)(seedPRs).toMatchInlineSnapshot(`
      {
        "http://example.org/andrefs/hektos-test/R1": {
          "obj": 1,
          "subj": 1,
        },
        "http://example.org/andrefs/hektos-test/R2": {
          "obj": 1,
          "subj": 2,
        },
        "http://example.org/andrefs/hektos-test/R3": {
          "obj": 0,
          "subj": 0,
        },
        "http://example.org/andrefs/hektos-test/R4": {
          "obj": 0,
          "subj": 1,
        },
      }
    `);
    }));
});
(0, vitest_1.describe)("globalMetrics", () => {
    (0, vitest_1.it)("calculates global metrics", () => __awaiter(void 0, void 0, void 0, function* () {
        const subq = new QueryBuilder_js_1.Query()
            .select("s")
            .where((0, QueryBuilder_js_1.Q)((0, QueryBuilder_js_1.V)("s"), (0, QueryBuilder_js_1.N)(`${test_data_1.pf}/R2`), (0, QueryBuilder_js_1.V)("o")));
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