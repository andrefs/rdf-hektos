var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { describe, it, expect, vi } from 'vitest';
import GraphOperations from './GraphOperations.ts';
import { Readable } from 'stream';
import rdf from '@rdfjs/data-model';
import SparqlWebStore from './stores/SparqlWebStore.ts';
const store = new SparqlWebStore({ endpointUrl: '' });
const mockSelect = vi.spyOn(store, 'select');
let graph = new GraphOperations(store);
const pf = 'http://example.org/andrefs';
const xml = 'http://www.w3.org/2001/XMLSchema';
const wrapReadable = (conts) => __awaiter(void 0, void 0, void 0, function* () {
    return Promise.resolve(Readable.from(conts.map((c) => ({ get: (b) => c[b] }))));
});
it('getPreds', () => __awaiter(void 0, void 0, void 0, function* () {
    //const s = new Readable.from([{a:1}, {b:2}, {c:3}]);
    const s = wrapReadable([{
            'p': rdf.namedNode(`${pf}/R1`),
            'total': rdf.literal("4", rdf.namedNode(`${xml}#integer`))
        }, {
            'p': rdf.namedNode(`${pf}/R2`),
            'total': rdf.literal("6", rdf.namedNode(`${xml}#integer`))
        }, {
            'p': rdf.namedNode(`${pf}/R3`),
            'total': rdf.literal("1", rdf.namedNode(`${xml}#integer`))
        }]);
    mockSelect.mockReturnValueOnce(s);
    const preds = yield graph.getPreds();
    expect(mockSelect.mock.calls.length).toBe(1);
    expect(Object.keys(preds)).toHaveLength(3);
    expect(preds).toHaveProperty([`${pf}/R1`, 'count'], 4);
    expect(preds).toHaveProperty([`${pf}/R2`, 'count'], 6);
    expect(preds).toHaveProperty([`${pf}/R3`, 'count'], 1);
}));
describe('_randomWalk', () => {
    it('finds loop', () => __awaiter(void 0, void 0, void 0, function* () {
        mockSelect
            .mockReturnValueOnce(wrapReadable([{ 'x': rdf.namedNode(`${pf}/N3`) }]))
            .mockReturnValueOnce(wrapReadable([{ 'x': rdf.namedNode(`${pf}/N2`) }]))
            .mockReturnValueOnce(wrapReadable([{ 'x': rdf.namedNode(`${pf}/N4`) }]))
            .mockReturnValueOnce(wrapReadable([{ 'x': rdf.namedNode(`${pf}/N4`) }]));
        const r = yield graph._randomWalk(rdf.namedNode(`${pf}/R1`), rdf.namedNode(`${pf}/N1`), 6);
        expect(r).toHaveProperty('status', ['found_loop']);
        expect(r.nodes).toHaveLength(5);
        expect(r.nodes[0]).toHaveProperty('value', `${pf}/N4`);
        expect(r.nodes[1]).toHaveProperty('value', `${pf}/N2`);
        expect(r.nodes[2]).toHaveProperty('value', `${pf}/N1`);
        expect(r.nodes[3]).toHaveProperty('value', `${pf}/N3`);
        expect(r.nodes[4]).toHaveProperty('value', `${pf}/N4`);
    }));
    it('finishes early', () => __awaiter(void 0, void 0, void 0, function* () {
        mockSelect
            .mockReturnValueOnce(wrapReadable([{ 'x': rdf.namedNode(`${pf}/N11`) }]))
            .mockReturnValueOnce(wrapReadable([]))
            .mockReturnValueOnce(wrapReadable([{ 'x': rdf.namedNode(`${pf}/N12`) }]))
            .mockReturnValueOnce(wrapReadable([]));
        const r = yield graph._randomWalk(rdf.namedNode(`${pf}/R4`), rdf.namedNode(`${pf}/N3`), 4);
        expect(r).toHaveProperty('status', ['finished_early', 'finished_early']);
        expect(r.nodes).toHaveLength(3);
        expect(r.nodes[0]).toHaveProperty('value', `${pf}/N3`);
        expect(r.nodes[1]).toHaveProperty('value', `${pf}/N11`);
        expect(r.nodes[2]).toHaveProperty('value', `${pf}/N12`);
    }));
    it('finds literal', () => __awaiter(void 0, void 0, void 0, function* () {
        mockSelect
            .mockReturnValueOnce(wrapReadable([{ 'x': rdf.literal('L1') }]))
            .mockReturnValueOnce(wrapReadable([]));
        const r = yield graph._randomWalk(rdf.namedNode(`${pf}/R3`), rdf.namedNode(`${pf}/N7`), 4);
        expect(r).toHaveProperty('status', ['found_literal', 'finished_early']);
        expect(r.nodes).toHaveLength(2);
        expect(r.nodes[0]).toHaveProperty('value', `${pf}/N7`);
        expect(r.nodes[1]).toHaveProperty('value', 'L1');
    }));
    it('finds literal in first node', () => __awaiter(void 0, void 0, void 0, function* () {
        mockSelect
            .mockReturnValueOnce(wrapReadable([{ 'x': rdf.namedNode(`${pf}/N7`) }]));
        const r = yield graph._randomWalk(rdf.namedNode(`${pf}/R3`), rdf.literal('L1'), 2);
        expect(r).toHaveProperty('status', ['found_literal', 'finished']);
        expect(r.nodes).toHaveLength(2);
        expect(r.nodes[0]).toHaveProperty('value', `${pf}/N7`);
        expect(r.nodes[1]).toHaveProperty('value', 'L1');
    }));
    it('finishes', () => __awaiter(void 0, void 0, void 0, function* () {
        mockSelect
            .mockReturnValueOnce(wrapReadable([{ 'x': rdf.namedNode(`${pf}/N11`) }]))
            .mockReturnValueOnce(wrapReadable([]))
            .mockReturnValueOnce(wrapReadable([{ 'x': rdf.namedNode(`${pf}/N12`) }]));
        const r = yield graph._randomWalk(rdf.namedNode(`${pf}/R4`), rdf.namedNode(`${pf}/N3`), 2);
        expect(r).toHaveProperty('status', ['finished']);
        expect(r.nodes).toHaveLength(2);
        expect(r.nodes[0]).toHaveProperty('value', `${pf}/N3`);
        expect(r.nodes[1]).toHaveProperty('value', `${pf}/N11`);
    }));
});
describe('_randomWalks', () => {
    it('returns walks', () => __awaiter(void 0, void 0, void 0, function* () {
        const _randomWalk = vi.fn();
        graph._randomWalk = _randomWalk;
        _randomWalk
            .mockReturnValueOnce(Promise.resolve({
            status: ['finished'],
            nodes: [
                rdf.namedNode(`${pf}/N5`),
                rdf.namedNode(`${pf}/N8`),
                rdf.namedNode(`${pf}/N13`)
            ]
        }))
            .mockReturnValueOnce(Promise.resolve({
            status: ['finished'],
            nodes: [
                rdf.namedNode(`${pf}/N6`),
                rdf.namedNode(`${pf}/N9`),
                rdf.namedNode(`${pf}/N14`)
            ]
        }));
        const r = yield graph._randomWalks(rdf.namedNode(`${pf}/R2`), [rdf.namedNode(`${pf}/N5`),
            rdf.namedNode(`${pf}/N6`)], 2);
        expect(r).toHaveProperty([`${pf}/N5`, 'status'], ['finished']);
        expect(r).toHaveProperty([`${pf}/N6`, 'status'], ['finished']);
        expect(r[`${pf}/N5`].nodes).toHaveLength(3);
        expect(r[`${pf}/N6`].nodes).toHaveLength(3);
        expect(r[`${pf}/N5`].nodes.map(n => n.value)).toContain(`${pf}/N5`);
        expect(r[`${pf}/N5`].nodes.map(n => n.value)).toContain(`${pf}/N8`);
        expect(r[`${pf}/N5`].nodes.map(n => n.value)).toContain(`${pf}/N13`);
        expect(r[`${pf}/N6`].nodes.map(n => n.value)).toContain(`${pf}/N6`);
        expect(r[`${pf}/N6`].nodes.map(n => n.value)).toContain(`${pf}/N9`);
        expect(r[`${pf}/N6`].nodes.map(n => n.value)).toContain(`${pf}/N14`);
    }));
});
describe('_randSelectSubjects', () => {
    it('selects subjects', () => __awaiter(void 0, void 0, void 0, function* () {
        mockSelect
            .mockReturnValueOnce(wrapReadable([
            { 'x': rdf.namedNode(`${pf}/N3`) },
            { 'x': rdf.namedNode(`${pf}/N11`) }
        ]));
        const r = yield graph._randSelectSubjects(rdf.namedNode(`${pf}/R4`), 2);
        expect(mockSelect.mock.calls.length).toBe(1);
        expect(r).toHaveLength(2);
        expect(r[0]).toHaveProperty('value', `${pf}/N3`);
        expect(r[1]).toHaveProperty('value', `${pf}/N11`);
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