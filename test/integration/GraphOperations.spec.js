import GraphOperations from '../../lib/GraphOperations.js';
import rdf from '@rdfjs/data-model';
import N3 from 'n3';
import {newEngine} from '@comunica/actor-init-sparql';
const myEngine = newEngine();
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
    const res = await myEngine.query(sparql, {sources: [n3]});
    return res.bindingsStream;
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
                      rdf.namedNode(`${pf}/N1`), 4, acc);
  
    expect(r).toHaveProperty('status', 'loop');
    expect(r.nodes).toHaveLength(4);
    expect(r.nodes).toContain(`${pf}/N1`);
    expect(r.nodes).toContain(`${pf}/N3`);
    expect(r.nodes).toContain(`${pf}/N4`);
    expect(r.nodes).toContain(`${pf}/N2`);
  });

  test('finishes early', async () => {
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
    const acc = {};
    const r = await graph._randomWalk(
                      rdf.namedNode(`${pf}/R3`),
                      rdf.namedNode(`${pf}/N7`), 4, acc);
  
    expect(r).toHaveProperty('status', 'found_literal');
    expect(r.nodes).toHaveLength(1);
    expect(r.nodes).toContain(`${pf}/N7`);
  });

  test('finishes', async () => {
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
    const r = await graph._randomWalks(
                      rdf.namedNode(`${pf}/R2`),
                      [rdf.namedNode(`${pf}/N8`),
                       rdf.namedNode(`${pf}/N9`)], 2);

    expect(r).toHaveProperty([`${pf}/N8`, 'status'], 'finished');
    expect(r).toHaveProperty([`${pf}/N9`, 'status'], 'finished');
    expect(r[`${pf}/N8`].nodes).toHaveLength(3);
    expect(r[`${pf}/N9`].nodes).toHaveLength(3);
    expect(r[`${pf}/N8`].nodes).toContain(`${pf}/N8`);
    expect(r[`${pf}/N8`].nodes).toContain(`${pf}/N13`);
    expect(r[`${pf}/N8`].nodes).toContain(`${pf}/N15`);
    expect(r[`${pf}/N9`].nodes).toContain(`${pf}/N9`);
    expect(r[`${pf}/N9`].nodes).toContain(`${pf}/N14`);
    expect(r[`${pf}/N9`].nodes).toContain(`${pf}/N16`);
  });
});


describe('_randSelectSubjects', () => {
  test('selects subjects', async () => {
    const r = await graph._randSelectSubjects(rdf.namedNode(`${pf}/R4`), 2);

    const values = r.map(x => x.value).sort();

    expect(r).toHaveLength(2);
    expect(values[0]).toBe(`${pf}/N11`);
    expect(values[1]).toBe(`${pf}/N3`);
  });
});

describe('calcInOutRatios', () => {
  test('calculates ratios', async () => {
    const preds = await graph.getPreds();
    const ratios = Object.fromEntries(await graph.calcInOutRatios(preds));

    expect(Object.keys(ratios)).toHaveLength(3);
    expect(ratios[`${pf}/R2`]).toBe("1.3333333333333333");
    expect(ratios[`${pf}/R1`]).toBe("1");
    expect(ratios[`${pf}/R4`]).toBe("1");
  });
});


describe('calcRandomWalks', () => {
  test('calculates random walks', async () => {
    const preds = await graph.getPreds();
    const walks = await graph.calcRandomWalks(preds, 1, 5);
    const items = Object.fromEntries(walks.map(([p, , ws]) => [p, ws]));

    const R1 = Object.values(items[`${pf}/R1`])[0];
    expect(R1).toHaveProperty('status', 'loop');
    expect(R1.nodes).toHaveLength(4);
    expect(R1.nodes).toContain(`${pf}/N1`);
    expect(R1.nodes).toContain(`${pf}/N2`);
    expect(R1.nodes).toContain(`${pf}/N3`);
    expect(R1.nodes).toContain(`${pf}/N4`);

    const R2 = Object.values(items[`${pf}/R2`])[0];
    expect(R2).toHaveProperty('status', 'finished_early');

    const R3 = Object.values(items[`${pf}/R3`])[0];
    expect(R3).toHaveProperty('status', 'found_literal');

    const R4 = Object.values(items[`${pf}/R4`])[0];
    expect(R4).toHaveProperty('status', 'finished_early');
  });
});
