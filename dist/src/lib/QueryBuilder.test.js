import { B, COUNT, L, N, normVar, Query, RAND, V, Q, NOT, FILTER, BIND, IS_BLANK, UNION, VALUES } from './QueryBuilder.ts';
import { describe, it, expect } from 'vitest';
import rdf from '@rdfjs/data-model';
import * as SparqlJs from 'sparqljs';
import { DataFactory } from 'rdf-data-factory';
const factory = new DataFactory();
describe('normVar', () => {
    it('does nothing if var is already normalized', () => {
        expect(normVar('x')).toEqual('x');
    });
    it('removes leading ?', () => {
        expect(normVar('?x')).toEqual('x');
    });
});
describe('V', () => {
    it('wraps a string into an @rdfjs/Variable', () => {
        expect(V('x')).toMatchObject({
            value: 'x',
            termType: 'Variable'
        });
    });
    it('does nothing to an @rdfjs/Variable', () => {
        const v = rdf.variable('v');
        expect(V(v)).toEqual(v);
    });
});
describe('N', () => {
    it('wraps a string into an @rdfjs/NamedNode', () => {
        expect(N('x')).toMatchObject({
            value: 'x',
            termType: 'NamedNode'
        });
    });
    it('does nothing to an @rdfjs/NamedNode', () => {
        const n = rdf.namedNode('n');
        expect(N(n)).toEqual(n);
    });
});
describe('B', () => {
    it('wraps a string into an @rdfjs/BlankNode', () => {
        expect(B('x')).toMatchObject({
            value: 'x',
            termType: 'BlankNode'
        });
    });
    it('does nothing to an @rdfjs/BlankNode', () => {
        const b = rdf.blankNode('b');
        expect(B(b)).toEqual(b);
    });
});
describe('L', () => {
    it('wraps a string into an @rdfjs/Literal', () => {
        expect(L('x')).toMatchObject({
            value: 'x',
            termType: 'Literal'
        });
    });
    it('wraps a number into an @rdfjs/Literal', () => {
        expect(L(3)).toMatchObject({
            value: '3',
            termType: 'Literal'
        });
    });
    it('does nothing to an @rdfjs/Literal', () => {
        const l = factory.literal('l');
        expect(L(l)).toEqual(l);
    });
});
describe('Q', () => {
    it('wraps arguments into an @rdfjs/Quad', () => {
        expect(Q(V('a'), V('b'), V('c'))).toMatchInlineSnapshot(`
Quad {
  "graph": DefaultGraph {},
  "object": Variable {
    "termType": "Variable",
    "value": "c",
  },
  "predicate": Variable {
    "termType": "Variable",
    "value": "b",
  },
  "subject": Variable {
    "termType": "Variable",
    "value": "a",
  },
  "termType": "Quad",
}
`);
    });
});
describe('COUNT', () => {
    it('correctly wraps variable and alias', () => {
        expect(COUNT('x', 'y')).toMatchInlineSnapshot(`
      {
        "expression": {
          "aggregation": "count",
          "distinct": false,
          "expression": Variable {
            "termType": "Variable",
            "value": "x",
          },
          "type": "aggregate",
        },
        "variable": Variable {
          "termType": "Variable",
          "value": "y",
        },
      }
    `);
    });
    it('accept distinct', () => {
        expect(COUNT('x', 'y', 'distinct'))
            .toHaveProperty('expression.distinct', true);
    });
});
describe('RAND', () => {
    it('wraps contents', () => {
        expect(RAND()).toEqual({
            type: 'operation',
            operator: 'rand',
            args: []
        });
    });
});
describe('FILTER', () => {
    it('wraps contents', () => {
        expect(FILTER(V('x'))).toEqual({
            type: 'filter',
            expression: V('x')
        });
    });
});
describe('NOT', () => {
    it('wraps contents', () => {
        expect(NOT('x', 'y')).toMatchInlineSnapshot(`
      {
        "args": [
          Variable {
            "termType": "Variable",
            "value": "x",
          },
          Variable {
            "termType": "Variable",
            "value": "y",
          },
        ],
        "operator": "!",
        "type": "operation",
      }
    `);
    });
});
describe('IS_BLANK', () => {
    it('wraps contents', () => {
        expect(IS_BLANK('x', 'y')).toEqual({
            type: 'operation',
            operator: 'isblank',
            args: ['x', 'y'].map(v => V(v))
        });
    });
});
describe('BIND', () => {
    it('wraps contents', () => {
        expect(BIND(RAND(), 'y')).toEqual({
            type: 'bind',
            variable: V('y'),
            expression: RAND()
        });
    });
});
describe('VALUES', () => {
    it('wraps contents', () => {
        expect(VALUES([{ '?x': N('http://example.org/a'), '?y': N('http://example.org/b') }])).toEqual({
            type: 'values',
            values: [{ '?x': N('http://example.org/a'), '?y': N('http://example.org/b') }]
        });
    });
});
describe('Query', () => {
    it('constructor', () => {
        expect(new Query()).toEqual({
            obj: {
                type: 'query',
                queryType: 'SELECT',
                prefixes: {},
                variables: []
            }
        });
    });
    it('prefix', () => {
        const q = new Query()
            .prefix('a', 'b')
            .prefix('c', 'd');
        expect(q.obj.prefixes).toEqual({
            a: 'b',
            c: 'd'
        });
    });
    it('distinct', () => {
        const q = new Query().distinct();
        expect(q).toHaveProperty('obj.distinct', true);
    });
    it('limit', () => {
        const q = new Query().limit(5);
        expect(q).toHaveProperty('obj.limit', 5);
    });
    it('select', () => {
        expect(new Query().select('a', '?b', V('c'))).
            toMatchInlineSnapshot(`
        Query {
          "obj": {
            "prefixes": {},
            "queryType": "SELECT",
            "type": "query",
            "variables": [
              Variable {
                "termType": "Variable",
                "value": "a",
              },
              Variable {
                "termType": "Variable",
                "value": "b",
              },
              Variable {
                "termType": "Variable",
                "value": "c",
              },
            ],
          },
        }
      `);
    });
    it('groupBy', () => {
        expect(new Query().groupBy('a', '?b', V('c'))).
            toMatchInlineSnapshot(`
        Query {
          "obj": {
            "group": [
              {
                "expression": Variable {
                  "termType": "Variable",
                  "value": "a",
                },
              },
              {
                "expression": Variable {
                  "termType": "Variable",
                  "value": "b",
                },
              },
              {
                "expression": Variable {
                  "termType": "Variable",
                  "value": "c",
                },
              },
            ],
            "prefixes": {},
            "queryType": "SELECT",
            "type": "query",
            "variables": [],
          },
        }
      `);
    });
    it('orderBy', () => {
        const q = new Query().orderBy('a', ['b', 'DESC'], ['c', 'ASC'], RAND());
        expect(q).toMatchInlineSnapshot(`
      Query {
        "obj": {
          "order": [
            {
              "descending": false,
              "expression": Variable {
                "termType": "Variable",
                "value": "a",
              },
            },
            {
              "descending": true,
              "expression": Variable {
                "termType": "Variable",
                "value": "b",
              },
            },
            {
              "descending": false,
              "expression": Variable {
                "termType": "Variable",
                "value": "c",
              },
            },
            {
              "descending": false,
              "expression": {
                "args": [],
                "operator": "rand",
                "type": "operation",
              },
            },
          ],
          "prefixes": {},
          "queryType": "SELECT",
          "type": "query",
          "variables": [],
        },
      }
    `);
    });
    it('produces a valid Sparql.js input', () => {
        const q = new Query()
            .select('p', COUNT('p', 'total'))
            .where(Q(V('s'), V('p'), V('o')))
            .groupBy('p')
            .orderBy(['total', 'DESC'], RAND());
        expect(() => {
            new SparqlJs.Generator().stringify(q.obj);
        }).not.toThrow();
    });
    it('produces the same object as Sparql.js', () => {
        const q = new Query()
            .select('p', COUNT('p', 'total'))
            .where(Q(V('s'), V('p'), V('o')))
            .groupBy('p')
            .orderBy(['total', 'DESC'], RAND());
        const query = `SELECT ?p (COUNT(?p) AS ?total)
                    WHERE { 	?s ?p ?o . } 
                    GROUP BY ?p 
                    ORDER BY DESC(?total) RAND()`;
        const parser = new SparqlJs.Parser();
        const parsed = parser.parse(query);
        expect(q.obj).toMatchObject(parsed);
    });
    it('produces valid SPARQL', () => {
        const q = new Query()
            .select('p', COUNT('p', 'total'))
            .where(Q(V('s'), V('p'), V('o')))
            .groupBy('p')
            .orderBy(['total', 'DESC'], RAND());
        const parser = new SparqlJs.Parser();
        expect(() => parser.parse(q.toSparql())).not.toThrow();
    });
});
describe('Query.where', () => {
    it('accepts quads', () => {
        expect(new Query().where(Q(V('a'), V('b'), V('c')))).toMatchInlineSnapshot(`
      Query {
        "obj": {
          "prefixes": {},
          "queryType": "SELECT",
          "type": "query",
          "variables": [],
          "where": [
            {
              "triples": [
                Quad {
                  "graph": DefaultGraph {},
                  "object": Variable {
                    "termType": "Variable",
                    "value": "c",
                  },
                  "predicate": Variable {
                    "termType": "Variable",
                    "value": "b",
                  },
                  "subject": Variable {
                    "termType": "Variable",
                    "value": "a",
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
    });
    it('accepts BIND', () => {
        const q = new Query().select('x', 'y')
            .where(Q(V('x'), V('p'), V('o')), BIND(RAND(), 'y'));
        expect(q.obj.where).toMatchInlineSnapshot(`
      [
        {
          "triples": [
            Quad {
              "graph": DefaultGraph {},
              "object": Variable {
                "termType": "Variable",
                "value": "o",
              },
              "predicate": Variable {
                "termType": "Variable",
                "value": "p",
              },
              "subject": Variable {
                "termType": "Variable",
                "value": "x",
              },
              "termType": "Quad",
            },
          ],
          "type": "bgp",
        },
        {
          "expression": {
            "args": [],
            "operator": "rand",
            "type": "operation",
          },
          "type": "bind",
          "variable": Variable {
            "termType": "Variable",
            "value": "y",
          },
        },
      ]
    `);
    });
    it('accepts VALUES', () => {
        const q = new Query().select('x', 'y')
            .where(Q(V('x'), V('p'), V('o')), VALUES([{ '?x': N('http://example.org/a'), '?y': N('http://example.org/b') }]));
        expect(q.obj.where).toMatchInlineSnapshot(`
      [
        {
          "triples": [
            Quad {
              "graph": DefaultGraph {},
              "object": Variable {
                "termType": "Variable",
                "value": "o",
              },
              "predicate": Variable {
                "termType": "Variable",
                "value": "p",
              },
              "subject": Variable {
                "termType": "Variable",
                "value": "x",
              },
              "termType": "Quad",
            },
          ],
          "type": "bgp",
        },
        {
          "type": "values",
          "values": [
            {
              "?x": NamedNode {
                "termType": "NamedNode",
                "value": "http://example.org/a",
              },
              "?y": NamedNode {
                "termType": "NamedNode",
                "value": "http://example.org/b",
              },
            },
          ],
        },
      ]
    `);
        expect(() => {
            new SparqlJs.Generator().stringify(q.obj);
        }).not.toThrow();
    });
    it('accepts subqueries', () => {
        var _a, _b;
        const subq = new Query()
            .prefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#')
            .prefix('ontolex', 'http://www.w3.org/ns/lemon/ontolex')
            .select('s')
            .where(Q(V('s'), N('rdf:type'), N('ontolex:LexicalConcept')));
        const q = new Query()
            .select('p', COUNT('s', 'cov', 'distinct'))
            .where(Q(V('i'), V('p'), V('o')), subq);
        expect((_b = (_a = q === null || q === void 0 ? void 0 : q.obj) === null || _a === void 0 ? void 0 : _a.where) === null || _b === void 0 ? void 0 : _b[1]).toMatchInlineSnapshot(`
      {
        "patterns": [
          {
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
                      "value": "ontolex:LexicalConcept",
                    },
                    "predicate": NamedNode {
                      "termType": "NamedNode",
                      "value": "rdf:type",
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
        ],
        "type": "group",
      }
    `);
    });
    it('accepts groups', () => {
        const q = new Query().select('x')
            .where(Q(V('x'), V('y'), V('z1')), [
            Q(V('x'), V('y'), V('z2')),
            Q(V('x'), V('y'), V('z3')),
        ]);
        expect(q.obj.where).toMatchInlineSnapshot(`
      [
        {
          "triples": [
            Quad {
              "graph": DefaultGraph {},
              "object": Variable {
                "termType": "Variable",
                "value": "z1",
              },
              "predicate": Variable {
                "termType": "Variable",
                "value": "y",
              },
              "subject": Variable {
                "termType": "Variable",
                "value": "x",
              },
              "termType": "Quad",
            },
          ],
          "type": "bgp",
        },
        {
          "patterns": [
            {
              "triples": [
                Quad {
                  "graph": DefaultGraph {},
                  "object": Variable {
                    "termType": "Variable",
                    "value": "z2",
                  },
                  "predicate": Variable {
                    "termType": "Variable",
                    "value": "y",
                  },
                  "subject": Variable {
                    "termType": "Variable",
                    "value": "x",
                  },
                  "termType": "Quad",
                },
                Quad {
                  "graph": DefaultGraph {},
                  "object": Variable {
                    "termType": "Variable",
                    "value": "z3",
                  },
                  "predicate": Variable {
                    "termType": "Variable",
                    "value": "y",
                  },
                  "subject": Variable {
                    "termType": "Variable",
                    "value": "x",
                  },
                  "termType": "Quad",
                },
              ],
              "type": "bgp",
            },
          ],
          "type": "group",
        },
      ]
    `);
    });
    it('accepts unions', () => {
        const q = new Query().select('x')
            .where(Q(V('x'), V('y'), V('z')), UNION, Q(V('z'), V('y'), V('x')), UNION, Q(V('z'), V('x'), V('y')));
        expect(q.obj.where).toMatchInlineSnapshot(`
      [
        {
          "patterns": [
            {
              "triples": [
                Quad {
                  "graph": DefaultGraph {},
                  "object": Variable {
                    "termType": "Variable",
                    "value": "z",
                  },
                  "predicate": Variable {
                    "termType": "Variable",
                    "value": "y",
                  },
                  "subject": Variable {
                    "termType": "Variable",
                    "value": "x",
                  },
                  "termType": "Quad",
                },
              ],
              "type": "bgp",
            },
            {
              "triples": [
                Quad {
                  "graph": DefaultGraph {},
                  "object": Variable {
                    "termType": "Variable",
                    "value": "x",
                  },
                  "predicate": Variable {
                    "termType": "Variable",
                    "value": "y",
                  },
                  "subject": Variable {
                    "termType": "Variable",
                    "value": "z",
                  },
                  "termType": "Quad",
                },
              ],
              "type": "bgp",
            },
            {
              "triples": [
                Quad {
                  "graph": DefaultGraph {},
                  "object": Variable {
                    "termType": "Variable",
                    "value": "y",
                  },
                  "predicate": Variable {
                    "termType": "Variable",
                    "value": "x",
                  },
                  "subject": Variable {
                    "termType": "Variable",
                    "value": "z",
                  },
                  "termType": "Quad",
                },
              ],
              "type": "bgp",
            },
          ],
          "type": "union",
        },
      ]
    `);
    });
});
//# sourceMappingURL=QueryBuilder.test.js.map