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
const GraphOperations_1 = __importDefault(require("./GraphOperations"));
const stream_1 = require("stream");
const SparqlWebStore_1 = __importDefault(require("./stores/SparqlWebStore"));
const rdf_data_factory_1 = require("rdf-data-factory");
const factory = new rdf_data_factory_1.DataFactory();
const store = new SparqlWebStore_1.default({ endpointUrl: '' });
const mockSelect = vitest_1.vi.spyOn(store, 'select');
let graph = new GraphOperations_1.default(store);
const pf = 'http://example.org/andrefs';
const xml = 'http://www.w3.org/2001/XMLSchema';
const wrapReadable = (conts) => __awaiter(void 0, void 0, void 0, function* () {
    return Promise.resolve(stream_1.Readable.from(conts.map((c) => ({ get: (b) => c[b] }))));
});
(0, vitest_1.it)('getPreds', () => __awaiter(void 0, void 0, void 0, function* () {
    //const s = new Readable.from([{a:1}, {b:2}, {c:3}]);
    const s = wrapReadable([{
            'p': factory.namedNode(`${pf}/R1`),
            'total': factory.literal("4", factory.namedNode(`${xml}#integer`))
        }, {
            'p': factory.namedNode(`${pf}/R2`),
            'total': factory.literal("6", factory.namedNode(`${xml}#integer`))
        }, {
            'p': factory.namedNode(`${pf}/R3`),
            'total': factory.literal("1", factory.namedNode(`${xml}#integer`))
        }]);
    mockSelect.mockReturnValueOnce(s);
    const preds = yield graph.getPreds();
    (0, vitest_1.expect)(mockSelect.mock.calls.length).toBe(1);
    (0, vitest_1.expect)(Object.keys(preds)).toHaveLength(3);
    (0, vitest_1.expect)(preds).toHaveProperty([`${pf}/R1`, 'count'], 4);
    (0, vitest_1.expect)(preds).toHaveProperty([`${pf}/R2`, 'count'], 6);
    (0, vitest_1.expect)(preds).toHaveProperty([`${pf}/R3`, 'count'], 1);
}));
(0, vitest_1.describe)('_randomWalk', () => {
    (0, vitest_1.it)('finds loop', () => __awaiter(void 0, void 0, void 0, function* () {
        mockSelect
            .mockReturnValueOnce(wrapReadable([{ 'x': factory.namedNode(`${pf}/N3`) }]))
            .mockReturnValueOnce(wrapReadable([{ 'x': factory.namedNode(`${pf}/N2`) }]))
            .mockReturnValueOnce(wrapReadable([{ 'x': factory.namedNode(`${pf}/N4`) }]))
            .mockReturnValueOnce(wrapReadable([{ 'x': factory.namedNode(`${pf}/N4`) }]));
        const r = yield graph._randomWalk(factory.namedNode(`${pf}/R1`), factory.namedNode(`${pf}/N1`), 6);
        (0, vitest_1.expect)(r).toHaveProperty('status', ['found_loop']);
        (0, vitest_1.expect)(r.nodes).toHaveLength(5);
        (0, vitest_1.expect)(r.nodes[0]).toHaveProperty('value', `${pf}/N4`);
        (0, vitest_1.expect)(r.nodes[1]).toHaveProperty('value', `${pf}/N2`);
        (0, vitest_1.expect)(r.nodes[2]).toHaveProperty('value', `${pf}/N1`);
        (0, vitest_1.expect)(r.nodes[3]).toHaveProperty('value', `${pf}/N3`);
        (0, vitest_1.expect)(r.nodes[4]).toHaveProperty('value', `${pf}/N4`);
    }));
    (0, vitest_1.it)('finishes early', () => __awaiter(void 0, void 0, void 0, function* () {
        mockSelect
            .mockReturnValueOnce(wrapReadable([{ 'x': factory.namedNode(`${pf}/N11`) }]))
            .mockReturnValueOnce(wrapReadable([]))
            .mockReturnValueOnce(wrapReadable([{ 'x': factory.namedNode(`${pf}/N12`) }]))
            .mockReturnValueOnce(wrapReadable([]));
        const r = yield graph._randomWalk(factory.namedNode(`${pf}/R4`), factory.namedNode(`${pf}/N3`), 4);
        (0, vitest_1.expect)(r).toHaveProperty('status', ['finished_early', 'finished_early']);
        (0, vitest_1.expect)(r.nodes).toHaveLength(3);
        (0, vitest_1.expect)(r.nodes[0]).toHaveProperty('value', `${pf}/N3`);
        (0, vitest_1.expect)(r.nodes[1]).toHaveProperty('value', `${pf}/N11`);
        (0, vitest_1.expect)(r.nodes[2]).toHaveProperty('value', `${pf}/N12`);
    }));
    (0, vitest_1.it)('finds literal', () => __awaiter(void 0, void 0, void 0, function* () {
        mockSelect
            .mockReturnValueOnce(wrapReadable([{ 'x': factory.literal('L1') }]))
            .mockReturnValueOnce(wrapReadable([]));
        const r = yield graph._randomWalk(factory.namedNode(`${pf}/R3`), factory.namedNode(`${pf}/N7`), 4);
        (0, vitest_1.expect)(r).toHaveProperty('status', ['found_literal', 'finished_early']);
        (0, vitest_1.expect)(r.nodes).toHaveLength(2);
        (0, vitest_1.expect)(r.nodes[0]).toHaveProperty('value', `${pf}/N7`);
        (0, vitest_1.expect)(r.nodes[1]).toHaveProperty('value', 'L1');
    }));
    (0, vitest_1.it)('finds literal in first node', () => __awaiter(void 0, void 0, void 0, function* () {
        mockSelect
            .mockReturnValueOnce(wrapReadable([{ 'x': factory.namedNode(`${pf}/N7`) }]));
        const r = yield graph._randomWalk(factory.namedNode(`${pf}/R3`), factory.literal('L1'), 2);
        (0, vitest_1.expect)(r).toHaveProperty('status', ['found_literal', 'finished']);
        (0, vitest_1.expect)(r.nodes).toHaveLength(2);
        (0, vitest_1.expect)(r.nodes[0]).toHaveProperty('value', `${pf}/N7`);
        (0, vitest_1.expect)(r.nodes[1]).toHaveProperty('value', 'L1');
    }));
    (0, vitest_1.it)('finishes', () => __awaiter(void 0, void 0, void 0, function* () {
        mockSelect
            .mockReturnValueOnce(wrapReadable([{ 'x': factory.namedNode(`${pf}/N11`) }]))
            .mockReturnValueOnce(wrapReadable([]))
            .mockReturnValueOnce(wrapReadable([{ 'x': factory.namedNode(`${pf}/N12`) }]));
        const r = yield graph._randomWalk(factory.namedNode(`${pf}/R4`), factory.namedNode(`${pf}/N3`), 2);
        (0, vitest_1.expect)(r).toHaveProperty('status', ['finished']);
        (0, vitest_1.expect)(r.nodes).toHaveLength(2);
        (0, vitest_1.expect)(r.nodes[0]).toHaveProperty('value', `${pf}/N3`);
        (0, vitest_1.expect)(r.nodes[1]).toHaveProperty('value', `${pf}/N11`);
    }));
});
(0, vitest_1.describe)('_randomWalks', () => {
    (0, vitest_1.it)('returns walks', () => __awaiter(void 0, void 0, void 0, function* () {
        const _randomWalk = vitest_1.vi.fn();
        graph._randomWalk = _randomWalk;
        _randomWalk
            .mockReturnValueOnce(Promise.resolve({
            status: ['finished'],
            nodes: [
                factory.namedNode(`${pf}/N5`),
                factory.namedNode(`${pf}/N8`),
                factory.namedNode(`${pf}/N13`)
            ]
        }))
            .mockReturnValueOnce(Promise.resolve({
            status: ['finished'],
            nodes: [
                factory.namedNode(`${pf}/N6`),
                factory.namedNode(`${pf}/N9`),
                factory.namedNode(`${pf}/N14`)
            ]
        }));
        const r = yield graph._randomWalks(factory.namedNode(`${pf}/R2`), [factory.namedNode(`${pf}/N5`),
            factory.namedNode(`${pf}/N6`)], 2);
        (0, vitest_1.expect)(r).toHaveProperty([`${pf}/N5`, 'status'], ['finished']);
        (0, vitest_1.expect)(r).toHaveProperty([`${pf}/N6`, 'status'], ['finished']);
        (0, vitest_1.expect)(r[`${pf}/N5`].nodes).toHaveLength(3);
        (0, vitest_1.expect)(r[`${pf}/N6`].nodes).toHaveLength(3);
        (0, vitest_1.expect)(r[`${pf}/N5`].nodes.map(n => n.value)).toContain(`${pf}/N5`);
        (0, vitest_1.expect)(r[`${pf}/N5`].nodes.map(n => n.value)).toContain(`${pf}/N8`);
        (0, vitest_1.expect)(r[`${pf}/N5`].nodes.map(n => n.value)).toContain(`${pf}/N13`);
        (0, vitest_1.expect)(r[`${pf}/N6`].nodes.map(n => n.value)).toContain(`${pf}/N6`);
        (0, vitest_1.expect)(r[`${pf}/N6`].nodes.map(n => n.value)).toContain(`${pf}/N9`);
        (0, vitest_1.expect)(r[`${pf}/N6`].nodes.map(n => n.value)).toContain(`${pf}/N14`);
    }));
});
(0, vitest_1.describe)('_randSelectSubjects', () => {
    (0, vitest_1.it)('selects subjects', () => __awaiter(void 0, void 0, void 0, function* () {
        mockSelect
            .mockReturnValueOnce(wrapReadable([
            { 'x': factory.namedNode(`${pf}/N3`) },
            { 'x': factory.namedNode(`${pf}/N11`) }
        ]));
        const r = yield graph._randSelectSubjects(factory.namedNode(`${pf}/R4`), 2);
        (0, vitest_1.expect)(mockSelect.mock.calls.length).toBe(1);
        (0, vitest_1.expect)(r).toHaveLength(2);
        (0, vitest_1.expect)(r[0]).toHaveProperty('value', `${pf}/N3`);
        (0, vitest_1.expect)(r[1]).toHaveProperty('value', `${pf}/N11`);
    }));
});
//const rdf = `<${pf}/N1> <${pf}/R1> <${pf}/N2> 
//             <${pf}/N2> <${pf}/R1> <${pf}/N3> 
//             <${pf}/N3> <${pf}/R1> <${pf}/N4> 
//             <${pf}/N4> <${pf}/R1> <${pf}/N1> 
//             
//             <${pf}/N4> <${pf}/R2> <${pf}/N5> 
//             <${pf}/N4> <${pf}/R2> <${pf}/N6> 
//             <${pf}/N5> <${pf}/R2> <${pf}/N7> 
//             <${pf}/N5> <${pf}/R2> <${pf}/N8> 
//             <${pf}/N6> <${pf}/R2> <${pf}/N9> 
//             <${pf}/N6> <${pf}/R2> <${pf}/N10> 
//             
//             <${pf}/N7> <${pf}/R3> "L1"`;
//
//# sourceMappingURL=GraphOperations.test.js.map