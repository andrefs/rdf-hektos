"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const QueryBuilder_1 = require("./QueryBuilder");
const vitest_1 = require("vitest");
const SparqlJs = __importStar(require("sparqljs"));
const rdf_data_factory_1 = require("rdf-data-factory");
const factory = new rdf_data_factory_1.DataFactory();
(0, vitest_1.describe)('normVar', () => {
    (0, vitest_1.it)('does nothing if var is already normalized', () => {
        (0, vitest_1.expect)((0, QueryBuilder_1.normVar)('x')).toEqual('x');
    });
    (0, vitest_1.it)('removes leading ?', () => {
        (0, vitest_1.expect)((0, QueryBuilder_1.normVar)('?x')).toEqual('x');
    });
});
(0, vitest_1.describe)('V', () => {
    (0, vitest_1.it)('wraps a string into an @rdfjs/Variable', () => {
        (0, vitest_1.expect)((0, QueryBuilder_1.V)('x')).toMatchObject({
            value: 'x',
            termType: 'Variable'
        });
    });
    (0, vitest_1.it)('does nothing to an @rdfjs/Variable', () => {
        const v = factory.variable('v');
        (0, vitest_1.expect)((0, QueryBuilder_1.V)(v)).toEqual(v);
    });
});
(0, vitest_1.describe)('N', () => {
    (0, vitest_1.it)('wraps a string into an @rdfjs/NamedNode', () => {
        (0, vitest_1.expect)((0, QueryBuilder_1.N)('x')).toMatchObject({
            value: 'x',
            termType: 'NamedNode'
        });
    });
    (0, vitest_1.it)('does nothing to an @rdfjs/NamedNode', () => {
        const n = factory.namedNode('n');
        (0, vitest_1.expect)((0, QueryBuilder_1.N)(n)).toEqual(n);
    });
});
(0, vitest_1.describe)('B', () => {
    (0, vitest_1.it)('wraps a string into an @rdfjs/BlankNode', () => {
        (0, vitest_1.expect)((0, QueryBuilder_1.B)('x')).toMatchObject({
            value: 'x',
            termType: 'BlankNode'
        });
    });
    (0, vitest_1.it)('does nothing to an @rdfjs/BlankNode', () => {
        const b = factory.blankNode('b');
        (0, vitest_1.expect)((0, QueryBuilder_1.B)(b)).toEqual(b);
    });
});
(0, vitest_1.describe)('L', () => {
    (0, vitest_1.it)('wraps a string into an @rdfjs/Literal', () => {
        (0, vitest_1.expect)((0, QueryBuilder_1.L)('x')).toMatchObject({
            value: 'x',
            termType: 'Literal'
        });
    });
    (0, vitest_1.it)('wraps a number into an @rdfjs/Literal', () => {
        (0, vitest_1.expect)((0, QueryBuilder_1.L)(3)).toMatchObject({
            value: '3',
            termType: 'Literal'
        });
    });
    (0, vitest_1.it)('does nothing to an @rdfjs/Literal', () => {
        const l = factory.literal('l');
        (0, vitest_1.expect)((0, QueryBuilder_1.L)(l)).toEqual(l);
    });
});
(0, vitest_1.describe)('Q', () => {
    (0, vitest_1.it)('wraps arguments into an @rdfjs/Quad', () => {
        const q = (0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)('a'), (0, QueryBuilder_1.V)('b'), (0, QueryBuilder_1.V)('c'));
        (0, vitest_1.expect)(q).toMatchInlineSnapshot(`
      Quad {
        "graph": DefaultGraph {
          "termType": "DefaultGraph",
          "value": "",
        },
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
        "value": "",
      }
    `);
    });
});
(0, vitest_1.describe)('COUNT', () => {
    (0, vitest_1.it)('correctly wraps variable and alias', () => {
        (0, vitest_1.expect)((0, QueryBuilder_1.COUNT)('x', 'y')).toMatchInlineSnapshot(`
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
    (0, vitest_1.it)('accept distinct', () => {
        (0, vitest_1.expect)((0, QueryBuilder_1.COUNT)('x', 'y', 'distinct'))
            .toHaveProperty('expression.distinct', true);
    });
});
(0, vitest_1.describe)('RAND', () => {
    (0, vitest_1.it)('wraps contents', () => {
        (0, vitest_1.expect)((0, QueryBuilder_1.RAND)()).toEqual({
            type: 'operation',
            operator: 'rand',
            args: []
        });
    });
});
(0, vitest_1.describe)('FILTER', () => {
    (0, vitest_1.it)('wraps contents', () => {
        (0, vitest_1.expect)((0, QueryBuilder_1.FILTER)((0, QueryBuilder_1.V)('x'))).toEqual({
            type: 'filter',
            expression: (0, QueryBuilder_1.V)('x')
        });
    });
});
(0, vitest_1.describe)('NOT', () => {
    (0, vitest_1.it)('wraps contents', () => {
        (0, vitest_1.expect)((0, QueryBuilder_1.NOT)('x', 'y')).toMatchInlineSnapshot(`
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
(0, vitest_1.describe)('IS_BLANK', () => {
    (0, vitest_1.it)('wraps contents', () => {
        (0, vitest_1.expect)((0, QueryBuilder_1.IS_BLANK)('x', 'y')).toEqual({
            type: 'operation',
            operator: 'isblank',
            args: ['x', 'y'].map(v => (0, QueryBuilder_1.V)(v))
        });
    });
});
(0, vitest_1.describe)('BIND', () => {
    (0, vitest_1.it)('wraps contents', () => {
        (0, vitest_1.expect)((0, QueryBuilder_1.BIND)((0, QueryBuilder_1.RAND)(), 'y')).toEqual({
            type: 'bind',
            variable: (0, QueryBuilder_1.V)('y'),
            expression: (0, QueryBuilder_1.RAND)()
        });
    });
});
(0, vitest_1.describe)('VALUES', () => {
    (0, vitest_1.it)('wraps contents', () => {
        (0, vitest_1.expect)((0, QueryBuilder_1.VALUES)([{ '?x': (0, QueryBuilder_1.N)('http://example.org/a'), '?y': (0, QueryBuilder_1.N)('http://example.org/b') }])).toEqual({
            type: 'values',
            values: [{ '?x': (0, QueryBuilder_1.N)('http://example.org/a'), '?y': (0, QueryBuilder_1.N)('http://example.org/b') }]
        });
    });
});
(0, vitest_1.describe)('Query', () => {
    (0, vitest_1.it)('constructor', () => {
        (0, vitest_1.expect)(new QueryBuilder_1.Query()).toEqual({
            obj: {
                type: 'query',
                queryType: 'SELECT',
                prefixes: {},
                variables: []
            }
        });
    });
    (0, vitest_1.it)('prefix', () => {
        const q = new QueryBuilder_1.Query()
            .prefix('a', 'b')
            .prefix('c', 'd');
        (0, vitest_1.expect)(q.obj.prefixes).toEqual({
            a: 'b',
            c: 'd'
        });
    });
    (0, vitest_1.it)('distinct', () => {
        const q = new QueryBuilder_1.Query().distinct();
        (0, vitest_1.expect)(q).toHaveProperty('obj.distinct', true);
    });
    (0, vitest_1.it)('limit', () => {
        const q = new QueryBuilder_1.Query().limit(5);
        (0, vitest_1.expect)(q).toHaveProperty('obj.limit', 5);
    });
    (0, vitest_1.it)('select', () => {
        (0, vitest_1.expect)(new QueryBuilder_1.Query().select('a', '?b', (0, QueryBuilder_1.V)('c'))).
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
    (0, vitest_1.it)('groupBy', () => {
        (0, vitest_1.expect)(new QueryBuilder_1.Query().groupBy('a', '?b', (0, QueryBuilder_1.V)('c'))).
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
    (0, vitest_1.it)('orderBy', () => {
        const q = new QueryBuilder_1.Query().orderBy('a', ['b', 'DESC'], ['c', 'ASC'], (0, QueryBuilder_1.RAND)());
        (0, vitest_1.expect)(q).toMatchInlineSnapshot(`
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
    (0, vitest_1.it)('produces a valid Sparql.js input', () => {
        const q = new QueryBuilder_1.Query()
            .select('p', (0, QueryBuilder_1.COUNT)('p', 'total'))
            .where((0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)('s'), (0, QueryBuilder_1.V)('p'), (0, QueryBuilder_1.V)('o')))
            .groupBy('p')
            .orderBy(['total', 'DESC'], (0, QueryBuilder_1.RAND)());
        (0, vitest_1.expect)(() => {
            new SparqlJs.Generator().stringify(q.obj);
        }).not.toThrow();
    });
    (0, vitest_1.it)('produces the same object as Sparql.js', () => {
        const q = new QueryBuilder_1.Query()
            .select('p', (0, QueryBuilder_1.COUNT)('p', 'total'))
            .where((0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)('s'), (0, QueryBuilder_1.V)('p'), (0, QueryBuilder_1.V)('o')))
            .groupBy('p')
            .orderBy(['total', 'DESC'], (0, QueryBuilder_1.RAND)());
        const query = `SELECT ?p (COUNT(?p) AS ?total)
                    WHERE { 	?s ?p ?o . } 
                    GROUP BY ?p 
                    ORDER BY DESC(?total) RAND()`;
        const parser = new SparqlJs.Parser();
        const parsed = parser.parse(query);
        (0, vitest_1.expect)(q.obj).toMatchObject(parsed);
    });
    (0, vitest_1.it)('produces valid SPARQL', () => {
        const q = new QueryBuilder_1.Query()
            .select('p', (0, QueryBuilder_1.COUNT)('p', 'total'))
            .where((0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)('s'), (0, QueryBuilder_1.V)('p'), (0, QueryBuilder_1.V)('o')))
            .groupBy('p')
            .orderBy(['total', 'DESC'], (0, QueryBuilder_1.RAND)());
        const parser = new SparqlJs.Parser();
        (0, vitest_1.expect)(() => parser.parse(q.toSparql())).not.toThrow();
    });
});
(0, vitest_1.describe)('Query.where', () => {
    (0, vitest_1.it)('accepts quads', () => {
        (0, vitest_1.expect)(new QueryBuilder_1.Query().where((0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)('a'), (0, QueryBuilder_1.V)('b'), (0, QueryBuilder_1.V)('c')))).toMatchInlineSnapshot(`
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
                  "graph": DefaultGraph {
                    "termType": "DefaultGraph",
                    "value": "",
                  },
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
                  "value": "",
                },
              ],
              "type": "bgp",
            },
          ],
        },
      }
    `);
    });
    (0, vitest_1.it)('accepts BIND', () => {
        const q = new QueryBuilder_1.Query().select('x', 'y')
            .where((0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)('x'), (0, QueryBuilder_1.V)('p'), (0, QueryBuilder_1.V)('o')), (0, QueryBuilder_1.BIND)((0, QueryBuilder_1.RAND)(), 'y'));
        (0, vitest_1.expect)(q.obj.where).toMatchInlineSnapshot(`
      [
        {
          "triples": [
            Quad {
              "graph": DefaultGraph {
                "termType": "DefaultGraph",
                "value": "",
              },
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
              "value": "",
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
    (0, vitest_1.it)('accepts VALUES', () => {
        const q = new QueryBuilder_1.Query().select('x', 'y')
            .where((0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)('x'), (0, QueryBuilder_1.V)('p'), (0, QueryBuilder_1.V)('o')), (0, QueryBuilder_1.VALUES)([{ '?x': (0, QueryBuilder_1.N)('http://example.org/a'), '?y': (0, QueryBuilder_1.N)('http://example.org/b') }]));
        (0, vitest_1.expect)(q.obj.where).toMatchInlineSnapshot(`
      [
        {
          "triples": [
            Quad {
              "graph": DefaultGraph {
                "termType": "DefaultGraph",
                "value": "",
              },
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
              "value": "",
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
        (0, vitest_1.expect)(() => {
            new SparqlJs.Generator().stringify(q.obj);
        }).not.toThrow();
    });
    (0, vitest_1.it)('accepts subqueries', () => {
        var _a, _b;
        const subq = new QueryBuilder_1.Query()
            .prefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#')
            .prefix('ontolex', 'http://www.w3.org/ns/lemon/ontolex')
            .select('s')
            .where((0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)('s'), (0, QueryBuilder_1.N)('rdf:type'), (0, QueryBuilder_1.N)('ontolex:LexicalConcept')));
        const q = new QueryBuilder_1.Query()
            .select('p', (0, QueryBuilder_1.COUNT)('s', 'cov', 'distinct'))
            .where((0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)('i'), (0, QueryBuilder_1.V)('p'), (0, QueryBuilder_1.V)('o')), subq);
        (0, vitest_1.expect)((_b = (_a = q === null || q === void 0 ? void 0 : q.obj) === null || _a === void 0 ? void 0 : _a.where) === null || _b === void 0 ? void 0 : _b[1]).toMatchInlineSnapshot(`
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
                    "graph": DefaultGraph {
                      "termType": "DefaultGraph",
                      "value": "",
                    },
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
                    "value": "",
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
    (0, vitest_1.it)('accepts groups', () => {
        const q = new QueryBuilder_1.Query().select('x')
            .where((0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)('x'), (0, QueryBuilder_1.V)('y'), (0, QueryBuilder_1.V)('z1')), [
            (0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)('x'), (0, QueryBuilder_1.V)('y'), (0, QueryBuilder_1.V)('z2')),
            (0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)('x'), (0, QueryBuilder_1.V)('y'), (0, QueryBuilder_1.V)('z3')),
        ]);
        (0, vitest_1.expect)(q.obj.where).toMatchInlineSnapshot(`
      [
        {
          "triples": [
            Quad {
              "graph": DefaultGraph {
                "termType": "DefaultGraph",
                "value": "",
              },
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
              "value": "",
            },
          ],
          "type": "bgp",
        },
        {
          "patterns": [
            {
              "triples": [
                Quad {
                  "graph": DefaultGraph {
                    "termType": "DefaultGraph",
                    "value": "",
                  },
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
                  "value": "",
                },
                Quad {
                  "graph": DefaultGraph {
                    "termType": "DefaultGraph",
                    "value": "",
                  },
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
                  "value": "",
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
    (0, vitest_1.it)('accepts unions', () => {
        const q = new QueryBuilder_1.Query().select('x')
            .where((0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)('x'), (0, QueryBuilder_1.V)('y'), (0, QueryBuilder_1.V)('z')), QueryBuilder_1.UNION, (0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)('z'), (0, QueryBuilder_1.V)('y'), (0, QueryBuilder_1.V)('x')), QueryBuilder_1.UNION, (0, QueryBuilder_1.Q)((0, QueryBuilder_1.V)('z'), (0, QueryBuilder_1.V)('x'), (0, QueryBuilder_1.V)('y')));
        (0, vitest_1.expect)(q.obj.where).toMatchInlineSnapshot(`
      [
        {
          "patterns": [
            {
              "triples": [
                Quad {
                  "graph": DefaultGraph {
                    "termType": "DefaultGraph",
                    "value": "",
                  },
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
                  "value": "",
                },
              ],
              "type": "bgp",
            },
            {
              "triples": [
                Quad {
                  "graph": DefaultGraph {
                    "termType": "DefaultGraph",
                    "value": "",
                  },
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
                  "value": "",
                },
              ],
              "type": "bgp",
            },
            {
              "triples": [
                Quad {
                  "graph": DefaultGraph {
                    "termType": "DefaultGraph",
                    "value": "",
                  },
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
                  "value": "",
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