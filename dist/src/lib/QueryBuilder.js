import rdf from '@rdfjs/data-model';
import { DataFactory } from 'rdf-data-factory';
import * as SparqlJs from 'sparqljs';
const factory = new DataFactory();
const generator = new SparqlJs.Generator();
export const UNION = 'UNION';
export const normVar = (value) => value.replace(/^\?/, '');
export const V = (value) => {
    if (typeof value === 'string') {
        const _val = normVar(value);
        let r = rdf.variable(_val);
        r.termType = 'Variable';
        return r;
    }
    return value;
};
export const Q = (s, p, o, graph = rdf.defaultGraph()) => {
    let r = rdf.quad(s, p, o, graph);
    r.termType = 'Quad';
    return r;
};
export const N = (value) => {
    if (typeof value === 'string') {
        let n = rdf.namedNode(value);
        n.termType = 'NamedNode';
        return n;
    }
    return value;
};
export const B = (value) => {
    if (typeof value === 'string') {
        let b = rdf.blankNode(value);
        b.termType = 'BlankNode';
        return b;
    }
    return value;
};
export const L = (value, languageOrDataType) => {
    if (typeof value === 'string' || typeof value === 'number') {
        let l = factory.literal(String(value), languageOrDataType);
        return l;
    }
    return value;
};
export const COUNT = (value, as, distinct) => {
    return {
        expression: {
            expression: V(value),
            type: 'aggregate',
            aggregation: 'count',
            distinct: !!distinct
        },
        variable: V(as)
    };
};
export const RAND = () => ({
    type: 'operation',
    operator: 'rand',
    args: []
});
export const FILTER = (exp) => ({
    type: 'filter',
    expression: exp
});
export const NOT = (...args) => ({
    type: 'operation',
    operator: '!',
    args: args.map(v => typeof v === 'string' ? V(v) : v)
});
export const IS_BLANK = (...args) => ({
    type: 'operation',
    operator: 'isblank',
    args: args.map(v => V(v))
});
export const BIND = (exp, v) => ({
    type: 'bind',
    variable: V(v),
    expression: exp
});
export const VALUES = (values) => ({
    type: 'values',
    values
});
export class Query {
    constructor() {
        const vars = [];
        this.obj = {
            type: 'query',
            prefixes: {},
            queryType: 'SELECT',
            variables: vars
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
        this.obj = Object.assign(Object.assign({}, this.obj), { queryType: 'SELECT' });
        const variables = this.obj.variables;
        variables.push(...binds.map(v => typeof v === 'object' && 'expression' in v ? v : V(v)));
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
        this.obj.group = vars.map(v => ({
            expression: V(v)
        }));
        return this;
    }
    orderBy(...args) {
        this.obj.order = args.map(a => {
            let v = a;
            let descending = false;
            if (Array.isArray(a)) {
                v = a[0];
                descending = a[1] === 'DESC';
            }
            v = V(v);
            const r = { expression: v, descending };
            return r;
        });
        return this;
    }
    toSparql() {
        return generator.stringify(this.obj);
    }
}
;
const isQuad = (obj) => {
    return obj.termType === 'Quad';
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
            res.push({ type: 'bgp', triples: bgp });
            bgp = [];
        }
        if (a === UNION) {
            res.push(a);
            continue;
        }
        if (a instanceof Query) {
            if (a.obj.prefixes) {
                prefixes = Object.assign(Object.assign({}, prefixes), a.obj.prefixes);
                a.obj.prefixes = {};
            }
            res.push({ type: 'group', patterns: [a.obj] });
            continue;
        }
        if (Array.isArray(a)) {
            const [nested] = _where(a);
            const g = { type: 'group', patterns: nested };
            res.push(g);
            continue;
        }
        if (a.type === 'bind' || a.type === 'filter') {
            res.push(a);
            continue;
        }
        if (a.type === 'values') {
            res.push(a);
            continue;
        }
    }
    if (bgp.length) {
        res.push({ type: 'bgp', triples: bgp });
    }
    const readyRes = [];
    for (let i = 0; i < res.length; i++) {
        if (res[i] !== UNION) {
            readyRes.push(res[i]);
            continue;
        }
        const first = readyRes.pop();
        const union = isUnionPattern(first) ?
            first :
            { type: 'union', patterns: [first] };
        const second = res[++i];
        if (second === UNION || isUnionPattern(second)) {
            throw 'Error';
        }
        else {
            union.patterns.push(second);
            readyRes.push(union);
        }
        continue;
    }
    return [readyRes, prefixes];
}
;
const isUnionPattern = (obj) => {
    return obj.type === 'union';
};
//# sourceMappingURL=QueryBuilder.js.map