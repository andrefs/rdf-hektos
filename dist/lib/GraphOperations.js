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
const QueryBuilder_1 = require("./QueryBuilder");
const bluebird_1 = __importDefault(require("bluebird"));
const events_1 = __importDefault(require("events"));
const cli_progress_1 = __importDefault(require("cli-progress"));
const multibar = new cli_progress_1.default.MultiBar({
    stopOnComplete: true,
    clearOnComplete: false,
    hideCursor: true,
    barsize: 30,
    format: " {bar} {percentage}% | {value}/{total} {task} | {tid}",
}, cli_progress_1.default.Presets.shades_grey);
const FINISHED_EARLY = "finished_early";
const FOUND_BLANK = "found_blank";
const FOUND_LITERAL = "found_literal";
const FOUND_LOOP = "found_loop";
/**
 * Stream to array
 */
const s2a = (stream) => __awaiter(void 0, void 0, void 0, function* () {
    return new bluebird_1.default((resolve) => {
        const res = [];
        stream
            .on("data", (bindings) => res.push(bindings))
            .on("end", () => resolve(res));
    });
});
class GraphOperations extends events_1.default {
    constructor(store, { showProgBar, concurrency } = {}) {
        super();
        this._bars = {};
        this._concurrency = concurrency !== null && concurrency !== void 0 ? concurrency : 1;
        if (showProgBar) {
            this._handleEvents();
        }
        this._store = store;
    }
    _handleEvents() {
        this._bars = {};
        this.on("walks-started", (howMany) => {
            this._bars.walks = multibar.create(howMany, 0, {
                task: "preds",
                tid: "",
            });
        });
        this.on("walks-finished", () => {
            multibar.remove(this._bars.walks);
        });
        this.on("walks-pred", (id) => {
            this._bars.walks.increment({ task: "preds", tid: id });
        });
        this.on("walks-pred-starting", (howMany) => {
            this._bars.nodes = multibar.create(howMany, 0, {
                task: "nodes",
                tid: "",
            });
        });
        this.on("walks-pred-finished", () => {
            multibar.remove(this._bars.nodes);
        });
        this.on("walks-pred-node", (id) => {
            this._bars.nodes.increment({ task: "nodes", tid: id });
        });
        this.on("loops-starting", (howMany) => {
            this._bars.loops = multibar.create(howMany, 0, {
                task: "loops",
                tid: "",
            });
        });
        this.on("loops-finished", () => {
            multibar.remove(this._bars.loops);
        });
        this.on("loops-loop", () => {
            this._bars.loops.increment({ task: "loops" });
        });
    }
    getPreds() {
        return __awaiter(this, void 0, void 0, function* () {
            const q = new QueryBuilder_1.Query()
                .select("p", (0, QueryBuilder_1.COUNT)("p", "total"))
                .where((0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)("s"), (0, QueryBuilder_1.V)("p"), (0, QueryBuilder_1.V)("o")))
                .groupBy("p");
            this.emit("preds-starting");
            const res = yield this._runQuery(q);
            this.emit("preds-finished", res.length);
            return Object.fromEntries(res.map((r) => {
                var _a, _b;
                return [
                    (_a = r.get("p")) === null || _a === void 0 ? void 0 : _a.value,
                    {
                        count: Number((_b = r.get("total")) === null || _b === void 0 ? void 0 : _b.value) || 0,
                        node: r.get("p"),
                    },
                ];
            }));
        });
    }
    _randomWalks(pred, nodes, len) {
        return __awaiter(this, void 0, void 0, function* () {
            const walks = {};
            this.emit("walks-pred-starting", nodes.length);
            const ws = yield bluebird_1.default.map(nodes, (n) => {
                this.emit("walks-pred-node", n.value);
                return this._randomWalk(pred, n, len);
            }, { concurrency: this._concurrency });
            for (const [i, n] of nodes.entries()) {
                walks[n.value] = ws[i];
            }
            this.emit("walks-pred-finished");
            return walks;
        });
    }
    _runQuery(query, invalidateCache) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const sparql = typeof query !== "string" ? query.toSparql() : query;
            const stream = yield this._store.select(sparql);
            const res = yield s2a(stream);
            if (invalidateCache) {
                (_a = this._store.engine) === null || _a === void 0 ? void 0 : _a.invalidateHttpCache();
            }
            return res;
        });
    }
    rightRWStep(s, p, o) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const q = new QueryBuilder_1.Query()
                .select(o)
                .where((0, QueryBuilder_1.Q)(s, p, (0, QueryBuilder_1.V)(o)), (0, QueryBuilder_1.BIND)((0, QueryBuilder_1.RAND)(), "sortKey"))
                .orderBy("sortKey")
                .limit(1);
            const xs = yield this._runQuery(q, true);
            let res = (_a = xs === null || xs === void 0 ? void 0 : xs[0]) === null || _a === void 0 ? void 0 : _a.get(o);
            //if(res?.termType === 'BlankNode'){
            //  return this.rightRWStep(res, p, V(o));
            //}
            return Promise.resolve(res);
        });
    }
    leftRWStep(s, p, o) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const q = new QueryBuilder_1.Query()
                .select(s)
                .where((0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)(s), p, o), (0, QueryBuilder_1.BIND)((0, QueryBuilder_1.RAND)(), "sortKey"))
                .orderBy("sortKey")
                .limit(1);
            const xs = yield this._runQuery(q, true);
            let res = (_a = xs === null || xs === void 0 ? void 0 : xs[0]) === null || _a === void 0 ? void 0 : _a.get(s);
            //if(res?.termType === 'BlankNode'){
            //  return this.leftRWStep(V(s), p, res);
            //}
            return Promise.resolve(res);
        });
    }
    isRandomWalkOver(x, visitedNodes) {
        return !x
            ? FINISHED_EARLY
            : x.termType === "BlankNode"
                ? FOUND_BLANK
                : x.termType === "Literal"
                    ? FOUND_LITERAL
                    : visitedNodes.has(x.value)
                        ? FOUND_LOOP
                        : null;
    }
    //return {status, nodes: path};
    _randomWalk(pred, node, len) {
        return __awaiter(this, void 0, void 0, function* () {
            let leftNode = node;
            let rightNode = node;
            let visitedNodes = new Set().add(node.value);
            const path = [node];
            let rightFinished = false;
            let leftFinished = false;
            const status = [];
            const pathIsLoop = (path) => path.length > 1 && path[0].value === path[path.length - 1].value;
            if (rightNode.termType === "Literal") {
                status.push(FOUND_LITERAL);
                rightFinished = true;
            }
            while (path.length < len &&
                !pathIsLoop(path) &&
                (!rightFinished || !leftFinished)) {
                if (!rightFinished &&
                    !pathIsLoop(path) &&
                    (rightNode === null || rightNode === void 0 ? void 0 : rightNode.termType) === "NamedNode") {
                    const x = yield this.rightRWStep(rightNode, pred, "x");
                    const _s = this.isRandomWalkOver(x, visitedNodes);
                    if (x) {
                        visitedNodes.add(x.value);
                        path.push(x);
                    }
                    rightNode = x;
                    if (_s) {
                        status.push(_s);
                        rightFinished = true;
                    }
                }
                if (!leftFinished && path.length < len && !pathIsLoop(path)) {
                    const x = yield this.leftRWStep("x", pred, leftNode);
                    const _s = this.isRandomWalkOver(x, visitedNodes);
                    if (x) {
                        visitedNodes.add(x.value);
                        path.unshift(x);
                    }
                    leftNode = x;
                    if (_s) {
                        status.push(_s);
                        leftFinished = true;
                    }
                }
            }
            if (!pathIsLoop(path) && (!leftFinished || !rightFinished)) {
                status.push("finished");
            }
            return { status, nodes: path };
        });
    }
    _randSelectSubjects(p, howMany) {
        return __awaiter(this, void 0, void 0, function* () {
            const q = new QueryBuilder_1.Query()
                .distinct()
                .select("x")
                .where((0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)("x"), p, (0, QueryBuilder_1.V)("o")), QueryBuilder_1.UNION, (0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)("s"), p, (0, QueryBuilder_1.V)("x")), (0, QueryBuilder_1.FILTER)((0, QueryBuilder_1.NOT)((0, QueryBuilder_1.IS_BLANK)("x"))), (0, QueryBuilder_1.BIND)((0, QueryBuilder_1.RAND)(), "sortKey"))
                .orderBy("sortKey")
                .limit(howMany);
            const nodes = yield this._runQuery(q, true);
            const res = nodes.map((x) => x.get("x"));
            return res;
        });
    }
    calcRandomWalks(preds_1) {
        return __awaiter(this, arguments, void 0, function* (preds, pctg = 1, walkLength = 5) {
            var _a;
            this.emit("walks-started", Object.keys(preds).length);
            const walks = {};
            console.log(`  doing random walks (${Object.keys(preds).length} ` +
                `preds, ${pctg}% of paths, length ${walkLength})`);
            for (const p of Object.keys(preds)) {
                this.emit("walks-pred", p);
                const total = (_a = preds[p]) === null || _a === void 0 ? void 0 : _a.count;
                const sampledWalks = Math.ceil((total * pctg) / 100);
                const subjs = yield this._randSelectSubjects(preds[p].node, sampledWalks);
                const ws = yield this._randomWalks(preds[p].node, subjs, walkLength);
                walks[p] = [p, sampledWalks, ws];
            }
            this.emit("walks-finished");
            return walks;
        });
    }
    calcInOutRatios(preds) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
  
      SELECT ?p (AVG(?c) as ?avg) WHERE {
          SELECT
            ?p
            ?x 
            (COUNT(DISTINCT ?in) as ?cIn)
            (COUNT(DISTINCT ?out) as ?cOut)
            (xsd:integer(?cIn)/xsd:integer(?cOut) as ?c)
          WHERE {
              ?in ?p ?x .
              ?x ?p ?out
          }
          GROUP BY ?p ?x
      }
      GROUP BY ?p
      ORDER BY DESC(?avg)
      `;
            const stream = yield this._store.select(query);
            const res = yield s2a(stream);
            return Object.fromEntries(res.map((r) => {
                var _a, _b;
                const p = (_a = r.get("p")) === null || _a === void 0 ? void 0 : _a.value;
                const avg = Number((_b = r.get("avg")) === null || _b === void 0 ? void 0 : _b.value);
                return [p, avg];
            }));
        });
    }
    calcLoops(preds) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const loops = [];
            this.emit("loops-starting", Object.keys(preds).length);
            for (const p of Object.keys(preds)) {
                const query = `SELECT (COUNT(?s) AS ?loops)
                     WHERE { ?s <${p}>+ ?s .}`;
                const stream = yield this._store.select(query);
                const lc = yield s2a(stream);
                loops.push([p, Number((_a = lc[0].get("loops")) === null || _a === void 0 ? void 0 : _a.value)]);
                this.emit("loops-loop");
            }
            this.emit("loops-finished");
            return loops;
        });
    }
    /**
     * Calculate the subject coverage for each predicate
     * @param subSelect The subquery to select the seeds
     * @returns The subject coverage for each predicate
     */
    // FIXME this needs a DISTINCT maybe (right now seems to return the same as subject coverage)?
    calcSubjectCoverage(subSelect) {
        return __awaiter(this, void 0, void 0, function* () {
            const q = new QueryBuilder_1.Query()
                .select("p", (0, QueryBuilder_1.COUNT)("s", "cov"))
                .where((0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)("s"), (0, QueryBuilder_1.V)("p"), (0, QueryBuilder_1.V)("o")), subSelect)
                .groupBy("p");
            const cov = yield this._runQuery(q);
            return Object.fromEntries(cov.map((c) => {
                var _a, _b;
                return [
                    (_a = c.get("p")) === null || _a === void 0 ? void 0 : _a.value,
                    Number((_b = c.get("cov")) === null || _b === void 0 ? void 0 : _b.value),
                ];
            }));
        });
    }
    /**
     * Calculate the object coverage for each predicate
     * @param subSelect The subquery to select the seeds
     * @returns The object coverage for each predicate
     */
    // FIXME this needs a DISTINCT maybe (right now seems to return the same as subject coverage)?
    calcObjectCoverage(subSelect) {
        return __awaiter(this, void 0, void 0, function* () {
            const q = new QueryBuilder_1.Query()
                .select("p", (0, QueryBuilder_1.COUNT)("o", "cov"))
                .where((0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)("s"), (0, QueryBuilder_1.V)("p"), (0, QueryBuilder_1.V)("o")), subSelect)
                .groupBy("p");
            const cov = yield this._runQuery(q);
            return Object.fromEntries(cov.map((c) => {
                var _a, _b;
                return [
                    (_a = c.get("p")) === null || _a === void 0 ? void 0 : _a.value,
                    Number((_b = c.get("cov")) === null || _b === void 0 ? void 0 : _b.value),
                ];
            }));
        });
    }
    /**
     * Calculate the branching factor for each predicate
     * @param preds The predicates to calculate the branching factor for
     * @returns The branching factor for each predicate
     */
    calcBranchingFactor(preds) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const bfs = [];
            for (const p of Object.keys(preds)) {
                const res = yield this._runQuery(new QueryBuilder_1.Query()
                    .select((0, QueryBuilder_1.COUNT)("s", "nonLeaves", "distinct"), (0, QueryBuilder_1.COUNT)("o", "nonRoots", "distinct"))
                    .where((0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)("s"), (0, QueryBuilder_1.N)(p), (0, QueryBuilder_1.V)("o"))));
                const nrCount = (_a = res[0].get("nonRoots")) === null || _a === void 0 ? void 0 : _a.value;
                const nlCount = (_b = res[0].get("nonLeaves")) === null || _b === void 0 ? void 0 : _b.value;
                bfs.push([p, Number(nrCount) / Number(nlCount)]);
            }
            return Object.fromEntries(bfs);
        });
    }
    /**
     * Calculate the seed directionality for each predicate, i.e., the ratio of triples with each predicate where seeds are the
     * subject vs object
     * @param preds The predicates to calculate the ratio for
     * @param subSelect The subquery to select the seeds
     * @returns The ratio of triples with each predicate where seeds are the subject vs object
     */
    calcSeedDirectionality(preds, subSelect) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const sds = [];
            for (const p of Object.keys(preds)) {
                const q = new QueryBuilder_1.Query()
                    .select((0, QueryBuilder_1.COUNT)("r", "from"))
                    .where((0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)("r"), (0, QueryBuilder_1.N)(p), (0, QueryBuilder_1.V)("o")), subSelect);
                const from = yield this._runQuery(q);
                const q2 = new QueryBuilder_1.Query()
                    .select((0, QueryBuilder_1.COUNT)("r", "to"))
                    .where((0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)("s"), (0, QueryBuilder_1.N)(p), (0, QueryBuilder_1.V)("r")), subSelect);
                const to = yield this._runQuery(q2);
                const fromCount = Number((_a = from[0].get("from")) === null || _a === void 0 ? void 0 : _a.value);
                const toCount = Number((_b = to[0].get("to")) === null || _b === void 0 ? void 0 : _b.value);
                sds.push([p, fromCount / toCount]);
            }
            return Object.fromEntries(sds);
        });
    }
    globalMetrics(seedQuery) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const totalResQ = new QueryBuilder_1.Query()
                .select((0, QueryBuilder_1.COUNT)("x", "total", "distinct"))
                .where((0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)("x"), (0, QueryBuilder_1.V)("p"), (0, QueryBuilder_1.V)("o")), QueryBuilder_1.UNION, (0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)("s"), (0, QueryBuilder_1.V)("x"), (0, QueryBuilder_1.V)("o")), QueryBuilder_1.UNION, (0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)("s"), (0, QueryBuilder_1.V)("p"), (0, QueryBuilder_1.V)("x")));
            const totalResources = yield this._runQuery(totalResQ);
            const totalNodes = yield this._runQuery(new QueryBuilder_1.Query()
                .select((0, QueryBuilder_1.COUNT)("x", "total", "distinct"))
                .where((0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)("x"), (0, QueryBuilder_1.V)("p"), (0, QueryBuilder_1.V)("o")), QueryBuilder_1.UNION, (0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)("s"), (0, QueryBuilder_1.V)("p"), (0, QueryBuilder_1.V)("x"))));
            const totalSubjects = yield this._runQuery(new QueryBuilder_1.Query()
                .select((0, QueryBuilder_1.COUNT)("x", "total", "distinct"))
                .where((0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)("x"), (0, QueryBuilder_1.V)("p"), (0, QueryBuilder_1.V)("o"))));
            const totalSeeds = yield this._runQuery(seedQuery);
            return {
                totalResources: Number((_a = totalResources[0].get("total")) === null || _a === void 0 ? void 0 : _a.value),
                totalNodes: Number((_b = totalNodes[0].get("total")) === null || _b === void 0 ? void 0 : _b.value),
                totalSubjects: Number((_c = totalSubjects[0].get("total")) === null || _c === void 0 ? void 0 : _c.value),
                totalSeeds: totalSeeds.length,
            };
        });
    }
}
exports.default = GraphOperations;
//# sourceMappingURL=GraphOperations.js.map