import N3 from "n3";
import { QueryEngine } from "@comunica/query-sparql";
import { DataFactory } from "rdf-data-factory";

export const factory = new DataFactory();
export const engine = new QueryEngine();
export const NN = factory.namedNode;
export const pf = "http://example.org/andrefs/hektos-test";

/**
 * Sets up the test graph with sample data for GraphOperations tests
 */
export function setupTestGraph(): N3.Store {
  const n3 = new N3.Store();

  n3.addQuad(NN(`${pf}/N1`), NN(`${pf}/R1`), NN(`${pf}/N3`));
  n3.addQuad(NN(`${pf}/N2`), NN(`${pf}/R1`), NN(`${pf}/N1`));
  n3.addQuad(NN(`${pf}/N3`), NN(`${pf}/R1`), NN(`${pf}/N4`));
  n3.addQuad(NN(`${pf}/N4`), NN(`${pf}/R1`), NN(`${pf}/N2`));

  n3.addQuad(NN(`${pf}/N4`), NN(`${pf}/R2`), NN(`${pf}/N5`));
  n3.addQuad(NN(`${pf}/N4`), NN(`${pf}/R2`), NN(`${pf}/N6`));
  n3.addQuad(NN(`${pf}/N5`), NN(`${pf}/R2`), NN(`${pf}/N7`));
  n3.addQuad(NN(`${pf}/N5`), NN(`${pf}/R2`), NN(`${pf}/N8`));
  n3.addQuad(NN(`${pf}/N6`), NN(`${pf}/R2`), NN(`${pf}/N9`));
  n3.addQuad(NN(`${pf}/N6`), NN(`${pf}/R2`), NN(`${pf}/N10`));
  n3.addQuad(NN(`${pf}/N8`), NN(`${pf}/R2`), NN(`${pf}/N13`));
  n3.addQuad(NN(`${pf}/N9`), NN(`${pf}/R2`), NN(`${pf}/N14`));
  n3.addQuad(NN(`${pf}/N13`), NN(`${pf}/R2`), NN(`${pf}/N15`));
  n3.addQuad(NN(`${pf}/N14`), NN(`${pf}/R2`), NN(`${pf}/N16`));

  n3.addQuad(NN(`${pf}/N7`), NN(`${pf}/R3`), factory.literal("L1"));

  n3.addQuad(NN(`${pf}/N3`), NN(`${pf}/R4`), NN(`${pf}/N11`));
  n3.addQuad(NN(`${pf}/N11`), NN(`${pf}/R4`), NN(`${pf}/N12`));
  n3.addQuad(NN(`${pf}/N1`), NN(`${pf}/R4`), NN(`${pf}/N11`));

  return n3;
}
