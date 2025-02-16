import { it, describe, expect } from 'vitest';
import { classToSubQ, roisToSubQ } from './proc-graph.ts';
import * as SparqlJs from 'sparqljs';
describe('roisToSubQ', () => {
    it('should return a query that selects the resources of interest', () => {
        const rois = ['http://example.org/a', 'http://example.org/b'];
        const roiQ = roisToSubQ(rois, 's');
        expect(roiQ).toMatchInlineSnapshot(`
      Query {
        "obj": {
          "prefixes": {},
          "queryType": "SELECT",
          "type": "query",
          "variables": [
            Variable {
              "termType": "Variable",
              "value": "s",
            },
          ],
          "where": [
            {
              "type": "values",
              "values": [
                {
                  "s": NamedNode {
                    "termType": "NamedNode",
                    "value": "http://example.org/a",
                  },
                },
                {
                  "s": NamedNode {
                    "termType": "NamedNode",
                    "value": "http://example.org/b",
                  },
                },
              ],
            },
          ],
        },
      }
    `);
        expect(() => {
            new SparqlJs.Generator().stringify(roiQ.obj);
        }).not.toThrow();
    });
});
describe('classToSubQ', () => {
    it('should return a query that selects the instances of the given class', () => {
        const classIri = 'http://example.org/Class';
        const classQ = classToSubQ(classIri, 's');
        expect(classQ).toMatchInlineSnapshot(`
      Query {
        "obj": {
          "prefixes": {},
          "queryType": "SELECT",
          "type": "query",
          "variables": [
            Variable {
              "termType": "Variable",
              "value": "s",
            },
          ],
          "where": [
            {
              "triples": [
                Quad {
                  "graph": DefaultGraph {},
                  "object": NamedNode {
                    "termType": "NamedNode",
                    "value": "http://example.org/Class",
                  },
                  "predicate": NamedNode {
                    "termType": "NamedNode",
                    "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  },
                  "subject": Variable {
                    "termType": "Variable",
                    "value": "s",
                  },
                  "termType": "Quad",
                },
              ],
              "type": "bgp",
            },
          ],
        },
      }
    `);
        expect(() => {
            new SparqlJs.Generator().stringify(classQ.obj);
        }).not.toThrow();
    });
    it('should return a query that selects the instances of the given class with a given predicate', () => {
        const classIri = 'http://example.org/Class';
        const predicateIri = 'http://example.org/predicate';
        const classQ = classToSubQ(classIri, 's', predicateIri);
        expect(classQ).toMatchInlineSnapshot(`
      Query {
        "obj": {
          "prefixes": {},
          "queryType": "SELECT",
          "type": "query",
          "variables": [
            Variable {
              "termType": "Variable",
              "value": "s",
            },
          ],
          "where": [
            {
              "triples": [
                Quad {
                  "graph": DefaultGraph {},
                  "object": NamedNode {
                    "termType": "NamedNode",
                    "value": "http://example.org/Class",
                  },
                  "predicate": NamedNode {
                    "termType": "NamedNode",
                    "value": "http://example.org/predicate",
                  },
                  "subject": Variable {
                    "termType": "Variable",
                    "value": "s",
                  },
                  "termType": "Quad",
                },
              ],
              "type": "bgp",
            },
          ],
        },
      }
    `);
        expect(() => {
            new SparqlJs.Generator().stringify(classQ.obj);
        }).not.toThrow();
    });
});
//# sourceMappingURL=proc-graph.test.js.map