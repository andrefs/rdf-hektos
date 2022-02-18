import {jest} from '@jest/globals';
import GraphOperations from './GraphOperations.js';
import {Readable} from 'stream';
import rdf from '@rdfjs/data-model';

let store;
let graph;
const pf = 'http://example.org/andrefs';
const xml = 'http://www.w3.org/2001/XMLSchema';

beforeEach(() => {
  const mockSelect = jest.fn();
  store = {select: mockSelect};
  graph = new GraphOperations(store);
});

test('getProps', async() => {
  //const s = new Readable.from([{a:1}, {b:2}, {c:3}]);
  const s = new Readable.from([{
    p: rdf.namedNode(`${pf}/R1`),
    total: rdf.literal("4", rdf.namedNode(`${xml}#integer`))
  },{
    p: rdf.namedNode(`${pf}/R2`),
    total: rdf.literal("6", rdf.namedNode(`${xml}#integer`))
  },{
    p: rdf.namedNode(`${pf}/R3`),
    total: rdf.literal("1", rdf.namedNode(`${xml}#integer`))
  }]);

  store.select.mockReturnValueOnce(s);
  const props = await graph.getProps();

  expect(store.select.mock.calls.length).toBe(1);
  expect(Object.keys(props)).toHaveLength(3);
  expect(props).toHaveProperty([`${pf}/R1`, 'count'], 4);
  expect(props).toHaveProperty([`${pf}/R2`, 'count'], 6);
  expect(props).toHaveProperty([`${pf}/R3`, 'count'], 1);
});


describe('_randomWalk', () => {
  test('finds loop', async() => {
    store.select
      .mockReturnValueOnce(Readable.from([{o: rdf.namedNode(`${pf}/N3`)}]))
      .mockReturnValueOnce(Readable.from([{o: rdf.namedNode(`${pf}/N4`)}]))
      .mockReturnValueOnce(Readable.from([{o: rdf.namedNode(`${pf}/N2`)}]))
      .mockReturnValueOnce(Readable.from([{o: rdf.namedNode(`${pf}/N1`)}]));

    const acc = {};
    const r = await graph._randomWalk(
                      rdf.namedNode(`${pf}/R1`),
                      rdf.namedNode(`${pf}/N1`), 4, acc);

    expect(r).toHaveProperty('status', 'loop');
    expect(r.nodes).toHaveLength(4);
    expect(r.nodes).toContain(`${pf}/N1`);
    expect(r.nodes).toContain(`${pf}/N3`);
    expect(r.nodes).toContain(`${pf}/N4`);
    expect(r.nodes).toContain(`${pf}/N2`);
  });

  test('finishes early', async () => {
    store.select
      .mockReturnValueOnce(Readable.from([{o: rdf.namedNode(`${pf}/N11`)}]))
      .mockReturnValueOnce(Readable.from([{o: rdf.namedNode(`${pf}/N12`)}]))
      .mockReturnValueOnce(Readable.from([]));

    const acc = {};
    const r = await graph._randomWalk(
                      rdf.namedNode(`${pf}/R4`),
                      rdf.namedNode(`${pf}/N3`), 4, acc);

    expect(r).toHaveProperty('status', 'finished_early');
    expect(r.nodes).toHaveLength(3);
    expect(r.nodes).toContain(`${pf}/N3`);
    expect(r.nodes).toContain(`${pf}/N11`);
    expect(r.nodes).toContain(`${pf}/N12`);

  });

  test('finds literal', async () => {
    store.select
      .mockReturnValueOnce(Readable.from([{o: rdf.literal('L1')}]))

    const acc = {};
    const r = await graph._randomWalk(
                      rdf.namedNode(`${pf}/R3`),
                      rdf.namedNode(`${pf}/N7`), 4, acc);

    expect(r).toHaveProperty('status', 'found_literal');
    expect(r.nodes).toHaveLength(1);
    expect(r.nodes).toContain(`${pf}/N7`);
  });

  test('finishes', async () => {
    store.select
      .mockReturnValueOnce(Readable.from([{o: rdf.namedNode(`${pf}/N11`)}]))
      .mockReturnValueOnce(Readable.from([{o: rdf.namedNode(`${pf}/N12`)}]));

    const acc = {};
    const r = await graph._randomWalk(
                      rdf.namedNode(`${pf}/R4`),
                      rdf.namedNode(`${pf}/N3`), 2, acc);

    expect(r).toHaveProperty('status', 'finished');
    expect(r.nodes).toHaveLength(3);
    expect(r.nodes).toContain(`${pf}/N3`);
    expect(r.nodes).toContain(`${pf}/N11`);
  });
});


describe('_randomWalks', () => {
  test('returns walks', async () => {
    graph._randomWalk = jest.fn();
    graph._randomWalk
      .mockReturnValueOnce({
        status: 'finished',
        nodes: [`${pf}/N5`, `${pf}/N8`, `${pf}/N13`]
      })
      .mockReturnValueOnce({
        status: 'finished',
        nodes: [`${pf}/N6`, `${pf}/N9`, `${pf}/N14`]
      });

    const r = await graph._randomWalks(
                      rdf.namedNode(`${pf}/R2`),
                      [rdf.namedNode(`${pf}/N5`),
                       rdf.namedNode(`${pf}/N6`)], 2);

    expect(r).toHaveProperty([`${pf}/N5`, 'status'], 'finished');
    expect(r).toHaveProperty([`${pf}/N6`, 'status'], 'finished');
    expect(r[`${pf}/N5`].nodes).toHaveLength(3);
    expect(r[`${pf}/N6`].nodes).toHaveLength(3);
    expect(r[`${pf}/N5`].nodes).toContain(`${pf}/N5`);
    expect(r[`${pf}/N5`].nodes).toContain(`${pf}/N8`);
    expect(r[`${pf}/N5`].nodes).toContain(`${pf}/N13`);
    expect(r[`${pf}/N6`].nodes).toContain(`${pf}/N6`);
    expect(r[`${pf}/N6`].nodes).toContain(`${pf}/N9`);
    expect(r[`${pf}/N6`].nodes).toContain(`${pf}/N14`);
  });
});


describe('_randSelectSubjects', () => {
  test('selects subjects', async () => {
    store.select
      .mockReturnValueOnce(Readable.from([
                  {s: rdf.namedNode(`${pf}/N3`)},
                  {s: rdf.namedNode(`${pf}/N11`)}]));

    const r = await graph._randSelectSubjects(rdf.namedNode(`${pf}/R4`), 2);

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
