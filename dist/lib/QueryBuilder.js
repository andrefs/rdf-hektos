"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Query = exports.VALUES = exports.BIND = exports.IS_BLANK = exports.NOT = exports.FILTER = exports.RAND = exports.COUNT = exports.L = exports.B = exports.N = exports.Q = exports.V = exports.normVar = exports.UNION = void 0;
const rdf_data_factory_1 = require("rdf-data-factory");
const SparqlJs = __importStar(require("sparqljs"));
const factory = new rdf_data_factory_1.DataFactory();
const generator = new SparqlJs.Generator();
exports.UNION = "UNION";
const normVar = (value) => value.replace(/^\?/, "");
exports.normVar = normVar;
const V = (value) => {
    if (typeof value === "string") {
        const _val = (0, exports.normVar)(value);
        let r = factory.variable(_val);
        return r;
    }
    return value;
};
exports.V = V;
const Q = (s, p, o, graph = factory.defaultGraph()) => {
    let r = factory.quad(s, p, o, graph);
    r.termType = "Quad";
    return r;
};
exports.Q = Q;
const N = (value) => {
    if (typeof value === "string") {
        let n = factory.namedNode(value);
        return n;
    }
    return value;
};
exports.N = N;
const B = (value) => {
    if (typeof value === "string") {
        let b = factory.blankNode(value);
        return b;
    }
    return value;
};
exports.B = B;
const L = (value, languageOrDataType) => {
    if (typeof value === "string" || typeof value === "number") {
        let l = factory.literal(String(value), languageOrDataType);
        return l;
    }
    return value;
};
exports.L = L;
const COUNT = (value, as, distinct) => {
    return {
        expression: {
            expression: (0, exports.V)(value),
            type: "aggregate",
            aggregation: "count",
            distinct: !!distinct,
        },
        variable: (0, exports.V)(as),
    };
};
exports.COUNT = COUNT;
const RAND = () => ({
    type: "operation",
    operator: "rand",
    args: [],
});
exports.RAND = RAND;
const FILTER = (exp) => ({
    type: "filter",
    expression: exp,
});
exports.FILTER = FILTER;
const NOT = (...args) => ({
    type: "operation",
    operator: "!",
    args: args.map((v) => (typeof v === "string" ? (0, exports.V)(v) : v)),
});
exports.NOT = NOT;
const IS_BLANK = (...args) => ({
    type: "operation",
    operator: "isblank",
    args: args.map((v) => (0, exports.V)(v)),
});
exports.IS_BLANK = IS_BLANK;
const BIND = (exp, v) => ({
    type: "bind",
    variable: (0, exports.V)(v),
    expression: exp,
});
exports.BIND = BIND;
const VALUES = (values) => ({
    type: "values",
    values,
});
exports.VALUES = VALUES;
class Query {
    constructor() {
        const vars = [];
        this.obj = {
            type: "query",
            prefixes: {},
            queryType: "SELECT",
            variables: vars,
        };
    }
    prefix(pref, url) {
        this.obj.prefixes[pref] = url;
        return this;
    }
    distinct() {
        this.obj.distinct = true;
        return this;
    }
    limit(lim) {
        this.obj.limit = lim;
        return this;
    }
    select(...binds) {
        this.obj = Object.assign(Object.assign({}, this.obj), { queryType: "SELECT" });
        const variables = this.obj.variables;
        variables.push(...binds.map((v) => typeof v === "object" && "expression" in v ? v : (0, exports.V)(v)));
        return this;
    }
    where(...args) {
        const [w, prefixes] = _where(args);
        if (prefixes) {
            this.obj.prefixes = Object.assign(Object.assign({}, this.obj.prefixes), prefixes);
        }
        this.obj = Object.assign(Object.assign({}, this.obj), { where: w });
        return this;
    }
    groupBy(...vars) {
        this.obj.group = vars.map((v) => ({
            expression: (0, exports.V)(v),
        }));
        return this;
    }
    orderBy(...args) {
        this.obj.order = args.map((a) => {
            let v = a;
            let descending = false;
            if (Array.isArray(a)) {
                v = a[0];
                descending = a[1] === "DESC";
            }
            v = (0, exports.V)(v);
            const r = { expression: v, descending };
            return r;
        });
        return this;
    }
    toSparql() {
        return generator.stringify(this.obj);
    }
}
exports.Query = Query;
const isQuad = (obj) => {
    return obj.termType === "Quad";
};
function _where(args) {
    const res = [];
    let bgp = [];
    let prefixes = {};
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (isQuad(a)) {
            bgp.push(a);
            continue;
        }
        if (bgp.length) {
            res.push({ type: "bgp", triples: bgp });
            bgp = [];
        }
        if (a === exports.UNION) {
            res.push(a);
            continue;
        }
        if (a instanceof Query) {
            if (a.obj.prefixes) {
                prefixes = Object.assign(Object.assign({}, prefixes), a.obj.prefixes);
                a.obj.prefixes = {};
            }
            res.push({ type: "group", patterns: [a.obj] });
            continue;
        }
        if (Array.isArray(a)) {
            const [nested] = _where(a);
            const g = { type: "group", patterns: nested };
            res.push(g);
            continue;
        }
        if (a.type === "bind" || a.type === "filter") {
            res.push(a);
            continue;
        }
        if (a.type === "values") {
            res.push(a);
            continue;
        }
    }
    if (bgp.length) {
        res.push({ type: "bgp", triples: bgp });
    }
    const readyRes = [];
    for (let i = 0; i < res.length; i++) {
        if (res[i] !== exports.UNION) {
            readyRes.push(res[i]);
            continue;
        }
        const first = readyRes.pop();
        const union = isUnionPattern(first)
            ? first
            : { type: "union", patterns: [first] };
        const second = res[++i];
        if (second === exports.UNION || isUnionPattern(second)) {
            throw "Error";
        }
        else {
            union.patterns.push(second);
            readyRes.push(union);
        }
        continue;
    }
    return [readyRes, prefixes];
}
const isUnionPattern = (obj) => {
    return obj.type === "union";
};
//# sourceMappingURL=QueryBuilder.js.map