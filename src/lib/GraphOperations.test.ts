import { describe, it, expect, vi } from 'vitest';
import GraphOperations from './GraphOperations';
import { Readable } from 'stream';
import SparqlWebStore from './stores/SparqlWebStore';
import { DataFactory } from 'rdf-data-factory';
const factory = new DataFactory();

const store = new SparqlWebStore({ endpointUrl: '' });
const mockSelect = vi.spyOn(store, 'select');


let graph = new GraphOperations(store);
const pf = 'http://example.org/andrefs';
const xml = 'http://www.w3.org/2001/XMLSchema';



const wrapReadable = async (conts: object[]) => Promise.resolve(Readable.from(conts.map(
  (c: { [key: string]: any }) => ({ get: (b: string) => c[b] })
)));

it('getPreds', async () => {
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
  const preds = await graph.getPreds();

  expect(mockSelect.mock.calls.length).toBe(1);
  expect(Object.keys(preds)).toHaveLength(3);
  expect(preds).toHaveProperty([`${pf}/R1`, 'count'], 4);
  expect(preds).toHaveProperty([`${pf}/R2`, 'count'], 6);
  expect(preds).toHaveProperty([`${pf}/R3`, 'count'], 1);
});


describe('_randomWalk', () => {
  it('finds loop', async () => {
    mockSelect
      .mockReturnValueOnce(wrapReadable([{ 'x': factory.namedNode(`${pf}/N3`) }]))
      .mockReturnValueOnce(wrapReadable([{ 'x': factory.namedNode(`${pf}/N2`) }]))
      .mockReturnValueOnce(wrapReadable([{ 'x': factory.namedNode(`${pf}/N4`) }]))
      .mockReturnValueOnce(wrapReadable([{ 'x': factory.namedNode(`${pf}/N4`) }]));

    const r = await graph._randomWalk(
      factory.namedNode(`${pf}/R1`),
      factory.namedNode(`${pf}/N1`), 6);

    expect(r).toHaveProperty('status', ['found_loop']);
    expect(r.nodes).toHaveLength(5);
    expect(r.nodes[0]).toHaveProperty('value', `${pf}/N4`);
    expect(r.nodes[1]).toHaveProperty('value', `${pf}/N2`);
    expect(r.nodes[2]).toHaveProperty('value', `${pf}/N1`);
    expect(r.nodes[3]).toHaveProperty('value', `${pf}/N3`);
    expect(r.nodes[4]).toHaveProperty('value', `${pf}/N4`);
  });

  it('finishes early', async () => {
    mockSelect
      .mockReturnValueOnce(wrapReadable([{ 'x': factory.namedNode(`${pf}/N11`) }]))
      .mockReturnValueOnce(wrapReadable([]))
      .mockReturnValueOnce(wrapReadable([{ 'x': factory.namedNode(`${pf}/N12`) }]))
      .mockReturnValueOnce(wrapReadable([]));

    const r = await graph._randomWalk(
      factory.namedNode(`${pf}/R4`),
      factory.namedNode(`${pf}/N3`), 4);

    expect(r).toHaveProperty('status', ['finished_early', 'finished_early']);
    expect(r.nodes).toHaveLength(3);
    expect(r.nodes[0]).toHaveProperty('value', `${pf}/N3`);
    expect(r.nodes[1]).toHaveProperty('value', `${pf}/N11`);
    expect(r.nodes[2]).toHaveProperty('value', `${pf}/N12`);

  });

  it('finds literal', async () => {
    mockSelect
      .mockReturnValueOnce(wrapReadable([{ 'x': factory.literal('L1') }]))
      .mockReturnValueOnce(wrapReadable([]));

    const r = await graph._randomWalk(
      factory.namedNode(`${pf}/R3`),
      factory.namedNode(`${pf}/N7`), 4);

    expect(r).toHaveProperty('status', ['found_literal', 'finished_early']);
    expect(r.nodes).toHaveLength(2);
    expect(r.nodes[0]).toHaveProperty('value', `${pf}/N7`);
    expect(r.nodes[1]).toHaveProperty('value', 'L1');
  });

  it('finds literal in first node', async () => {
    mockSelect
      .mockReturnValueOnce(wrapReadable([{ 'x': factory.namedNode(`${pf}/N7`) }]))

    const r = await graph._randomWalk(
      factory.namedNode(`${pf}/R3`),
      factory.literal('L1'), 2);

    expect(r).toHaveProperty('status', ['found_literal', 'finished']);
    expect(r.nodes).toHaveLength(2);
    expect(r.nodes[0]).toHaveProperty('value', `${pf}/N7`);
    expect(r.nodes[1]).toHaveProperty('value', 'L1');
  });


  it('finishes', async () => {
    mockSelect
      .mockReturnValueOnce(wrapReadable([{ 'x': factory.namedNode(`${pf}/N11`) }]))
      .mockReturnValueOnce(wrapReadable([]))
      .mockReturnValueOnce(wrapReadable([{ 'x': factory.namedNode(`${pf}/N12`) }]));

    const r = await graph._randomWalk(
      factory.namedNode(`${pf}/R4`),
      factory.namedNode(`${pf}/N3`), 2);

    expect(r).toHaveProperty('status', ['finished']);
    expect(r.nodes).toHaveLength(2);
    expect(r.nodes[0]).toHaveProperty('value', `${pf}/N3`);
    expect(r.nodes[1]).toHaveProperty('value', `${pf}/N11`);
  });
});


describe('_randomWalks', () => {
  it('returns walks', async () => {
    const _randomWalk = vi.fn();
    graph._randomWalk = _randomWalk as any;
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

    const r = await graph._randomWalks(
      factory.namedNode(`${pf}/R2`),
      [factory.namedNode(`${pf}/N5`),
      factory.namedNode(`${pf}/N6`)], 2);

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
  });
});


describe('_randSelectSubjects', () => {
  it('selects subjects', async () => {
    mockSelect
      .mockReturnValueOnce(wrapReadable([
        { 'x': factory.namedNode(`${pf}/N3`) },
        { 'x': factory.namedNode(`${pf}/N11`) }]));

    const r = await graph._randSelectSubjects(factory.namedNode(`${pf}/R4`), 2);

    expect(mockSelect.mock.calls.length).toBe(1);
    expect(r).toHaveLength(2);
    expect(r[0]).toHaveProperty('value', `${pf}/N3`);
    expect(r[1]).toHaveProperty('value', `${pf}/N11`);
  });
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
