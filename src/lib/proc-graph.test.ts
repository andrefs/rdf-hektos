import { it, describe, expect } from 'vitest';
import { roisToSubQ } from './proc-graph';
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
      new SparqlJs.Generator().stringify(roiQ.obj)
    }).not.toThrow();
  });
});

