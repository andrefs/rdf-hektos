import GraphOperations from '../../lib/GraphOperations.js';
import rdf from '@rdfjs/data-model';
import N3 from 'n3';
import {QueryEngine} from '@comunica/query-sparql';
import { N, Q, Query, V } from '../../lib/QueryBuilder.js';
const engine = new QueryEngine();
const NN = rdf.namedNode;
const pf = 'http://example.org/andrefs';
const n3 = new N3.Store();

n3.addQuad(NN(`${pf}/N1`),  NN(`${pf}/R1`), NN(`${pf}/N3`)); 
n3.addQuad(NN(`${pf}/N3`),  NN(`${pf}/R1`), NN(`${pf}/N4`)); 
n3.addQuad(NN(`${pf}/N4`),  NN(`${pf}/R1`), NN(`${pf}/N2`)); 
n3.addQuad(NN(`${pf}/N2`),  NN(`${pf}/R1`), NN(`${pf}/N1`)); 

n3.addQuad(NN(`${pf}/N3`),  NN(`${pf}/R4`), NN(`${pf}/N11`)); 
n3.addQuad(NN(`${pf}/N11`), NN(`${pf}/R4`), NN(`${pf}/N12`)); 

n3.addQuad(NN(`${pf}/N4`),  NN(`${pf}/R2`), NN(`${pf}/N5`)); 
n3.addQuad(NN(`${pf}/N4`),  NN(`${pf}/R2`), NN(`${pf}/N6`)); 

n3.addQuad(NN(`${pf}/N5`),  NN(`${pf}/R2`), NN(`${pf}/N7`)); 
n3.addQuad(NN(`${pf}/N5`),  NN(`${pf}/R2`), NN(`${pf}/N8`)); 
n3.addQuad(NN(`${pf}/N7`),  NN(`${pf}/R3`), rdf.literal("L1")); 
n3.addQuad(NN(`${pf}/N8`),  NN(`${pf}/R2`), NN(`${pf}/N13`)); 
n3.addQuad(NN(`${pf}/N13`), NN(`${pf}/R2`), NN(`${pf}/N15`)); 

n3.addQuad(NN(`${pf}/N6`),  NN(`${pf}/R2`), NN(`${pf}/N9`)); 
n3.addQuad(NN(`${pf}/N6`),  NN(`${pf}/R2`), NN(`${pf}/N10`)); 
n3.addQuad(NN(`${pf}/N9`),  NN(`${pf}/R2`), NN(`${pf}/N14`)); 
n3.addQuad(NN(`${pf}/N14`), NN(`${pf}/R2`), NN(`${pf}/N16`)); 


const graph = new GraphOperations({
  select: async (sparql) => {
    const res = await engine.queryBindings(sparql, {sources: [n3]});
    return res;
  }
});

test('getPreds', async() => {
  const preds = await graph.getPreds();

  expect(Object.keys(preds)).toHaveLength(4);
  expect(preds).toHaveProperty([`${pf}/R1`, 'count'], 4);
  expect(preds).toHaveProperty([`${pf}/R2`, 'count'], 10);
  expect(preds).toHaveProperty([`${pf}/R3`, 'count'], 1);
  expect(preds).toHaveProperty([`${pf}/R4`, 'count'], 2);
});


describe('_randomWalk', () => {
  test('finds loop', async() => {
  
    const acc = {};
    const r = await graph._randomWalk(
                      rdf.namedNode(`${pf}/R1`),
                      rdf.namedNode(`${pf}/N1`), 6, acc);
  
    expect(r).toHaveProperty('status', ['found_loop']);
    expect(r.nodes).toHaveLength(5);
    expect(r.nodes[0]).toHaveProperty('value', `${pf}/N4`);
    expect(r.nodes[1]).toHaveProperty('value', `${pf}/N2`);
    expect(r.nodes[2]).toHaveProperty('value', `${pf}/N1`);
    expect(r.nodes[3]).toHaveProperty('value', `${pf}/N3`);
    expect(r.nodes[4]).toHaveProperty('value', `${pf}/N4`);
  });

  test('finishes early', async () => {
    const acc = {};
    const r = await graph._randomWalk(
                      rdf.namedNode(`${pf}/R4`),
                      rdf.namedNode(`${pf}/N3`), 4, acc);
  
    expect(r).toHaveProperty('status', ['finished_early', 'finished_early']);
    expect(r.nodes).toHaveLength(3);
    expect(r.nodes[0]).toHaveProperty('value', `${pf}/N3`);
    expect(r.nodes[1]).toHaveProperty('value', `${pf}/N11`);
    expect(r.nodes[2]).toHaveProperty('value', `${pf}/N12`);
  
  });

  test('finds literal', async () => {
    const acc = {};
    const r = await graph._randomWalk(
                      rdf.namedNode(`${pf}/R3`),
                      rdf.namedNode(`${pf}/N7`), 4, acc);
  
    expect(r).toHaveProperty('status', ['found_literal', 'finished_early']);
    expect(r.nodes).toHaveLength(2);
    expect(r.nodes[0]).toHaveProperty('value', `${pf}/N7`);
    expect(r.nodes[1]).toHaveProperty('value', 'L1');
  });

  test('finishes', async () => {
    const acc = {};
    const r = await graph._randomWalk(
                      rdf.namedNode(`${pf}/R4`),
                      rdf.namedNode(`${pf}/N3`), 2, acc);
  
    expect(r).toHaveProperty('status', ['finished']);
    expect(r.nodes).toHaveLength(2);
    expect(r.nodes[0]).toHaveProperty('value', `${pf}/N3`);
    expect(r.nodes[1]).toHaveProperty('value', `${pf}/N11`);
  });
});


describe('_randomWalks', () => {
  test('returns walks', async () => {
    const r = await graph._randomWalks(
                      rdf.namedNode(`${pf}/R2`),
                      [rdf.namedNode(`${pf}/N8`),
                       rdf.namedNode(`${pf}/N9`)], 3);

    expect(r).toHaveProperty([`${pf}/N8`, 'status'], ['finished']);
    expect(r).toHaveProperty([`${pf}/N9`, 'status'], ['finished']);
    expect(r[`${pf}/N8`].nodes).toHaveLength(3);
    expect(r[`${pf}/N9`].nodes).toHaveLength(3);
    expect(r[`${pf}/N8`].nodes[0]).toHaveProperty('value', `${pf}/N5`);
    expect(r[`${pf}/N8`].nodes[1]).toHaveProperty('value', `${pf}/N8`);
    expect(r[`${pf}/N8`].nodes[2]).toHaveProperty('value', `${pf}/N13`);
    expect(r[`${pf}/N9`].nodes[0]).toHaveProperty('value', `${pf}/N6`);
    expect(r[`${pf}/N9`].nodes[1]).toHaveProperty('value', `${pf}/N9`);
    expect(r[`${pf}/N9`].nodes[2]).toHaveProperty('value', `${pf}/N14`);
  });
});


describe('_randSelectSubjects', () => {
  test('selects subjects', async () => {
    const r = await graph._randSelectSubjects(rdf.namedNode(`${pf}/R4`), 3);

    const values = r.map(x => x.value).sort();

    expect(r).toHaveLength(3);
    expect(values[0]).toBe(`${pf}/N11`);
    expect(values[1]).toBe(`${pf}/N12`);
    expect(values[2]).toBe(`${pf}/N3`);
  });
});

describe('calcInOutRatios', () => {
  test('calculates ratios', async () => {
    const preds = await graph.getPreds();
    const ratios = Object.fromEntries(await graph.calcInOutRatios(preds));

    expect(Object.keys(ratios)).toHaveLength(3);
    expect(ratios[`${pf}/R2`]).toBe(1.3333333333333333);
    expect(ratios[`${pf}/R1`]).toBe(1);
    expect(ratios[`${pf}/R4`]).toBe(1);
  });
});


describe('calcRandomWalks', () => {
  test('calculates random walks', async () => {
    const preds = await graph.getPreds();
    const walks = await graph.calcRandomWalks(preds, 1, 6);
    const items = Object.fromEntries(walks.map(([p, , ws]) => [p, ws]));

    const R1 = Object.values(items[`${pf}/R1`])[0];
    expect(R1).toHaveProperty('status', ['found_loop']);
    const vs = R1.nodes.map(n => n.value);
    expect(R1.nodes).toHaveLength(5);
    expect(vs).toContain(`${pf}/N4`);
    expect(vs).toContain(`${pf}/N2`);
    expect(vs).toContain(`${pf}/N1`);
    expect(vs).toContain(`${pf}/N3`);

    const R2 = Object.values(items[`${pf}/R2`])[0];
    expect(R2).toHaveProperty('status', ['finished_early', 'finished_early']);

    const R3 = Object.values(items[`${pf}/R3`])[0];
    expect(R3).toHaveProperty('status', ['found_literal', 'finished_early']);

    const R4 = Object.values(items[`${pf}/R4`])[0];
    expect(R4).toHaveProperty('status', ['finished_early', 'finished_early']);
  });
});

describe('calcSubjectCoverage', () => {
  test('calculates coverage', async () => {
    const subq = new Query().select('s')
                            .where(Q(V('s'), N(`${pf}/R2`), V('o')));

    const cov = await graph.calcSubjectCoverage(subq);

    expect(cov).toStrictEqual([["http://example.org/andrefs/R1", 2],
                               ["http://example.org/andrefs/R2", 16]]);

  });
})

describe('calcObjectCoverage', () => {
  test('calculates coverage', async () => {
    const subq = new Query().select('s')
                            .where(Q(V('s'), N(`${pf}/R2`), V('o')));

    const cov = await graph.calcObjectCoverage(subq);

    expect(cov).toStrictEqual([["http://example.org/andrefs/R1", 2],
                               ["http://example.org/andrefs/R2", 16]]);

  });
})

describe('', () => {
  test('calculates branching factors', async () => {
    const preds = await graph.getPreds();
    const bfs = await graph.calcBranchingFactor(preds);
    expect(bfs).toMatchInlineSnapshot(`
Array [
  Array [
    "http://example.org/andrefs/R1",
    0.25,
  ],
  Array [
    "http://example.org/andrefs/R4",
    0.5,
  ],
  Array [
    "http://example.org/andrefs/R2",
    0.1,
  ],
  Array [
    "http://example.org/andrefs/R3",
    1,
  ],
]
`);
  });
})

describe('globalMetrics', () => {
  test('calculates global metrics', async () => {
    const subq = new Query().select('s')
                            .where(Q(V('s'), N(`${pf}/R2`), V('o')));

    const global = await graph.globalMetrics(subq);

    expect(global).toStrictEqual({
      totalNodes: 34,
      totalResources: 51,
      totalSeeds: 10,
      totalSubjects: 17,
    });
  });
})
