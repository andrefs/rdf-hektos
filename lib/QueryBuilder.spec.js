import {B, COUNT, L, N, normVar, Query, RAND, V, Q, NOT, FILTER, BIND, IS_BLANK, UNION} from './QueryBuilder.js';
import rdf from '@rdfjs/data-model';
import sparqljs, {Parser} from 'sparqljs';

describe('normVar', () => {
  test('does nothing if var is already normalized', () => {
    expect(normVar('x')).toEqual('x');
  });
  test('removes leading ?', () => {
    expect(normVar('?x')).toEqual('x');
  });
});


describe('V', () => {
  test('wraps a string into an @rdfjs/Variable', () => {
    expect(V('x')).toMatchObject({
      value: 'x',
      termType: 'Variable'
    });
  });
  test('does nothing to an @rdfjs/Variable', () => {
    const v = rdf.variable('v');
    expect(V(v)).toEqual(v);
  });
});

describe('N', () => {
  test('wraps a string into an @rdfjs/NamedNode', () => {
    expect(N('x')).toMatchObject({
      value: 'x',
      termType: 'NamedNode'
    });
  });
  test('does nothing to an @rdfjs/NamedNode', () => {
    const n = rdf.namedNode('n');
    expect(N(n)).toEqual(n);
  });
});

describe('B', () => {
  test('wraps a string into an @rdfjs/BlankNode', () => {
    expect(B('x')).toMatchObject({
      value: 'x',
      termType: 'BlankNode'
    });
  });
  test('does nothing to an @rdfjs/BlankNode', () => {
    const b = rdf.blankNode('b');
    expect(B(b)).toEqual(b);
  });
});

describe('L', () => {
  test('wraps a string into an @rdfjs/Literal', () => {
    expect(L('x')).toMatchObject({
      value: 'x',
      termType: 'Literal'
    });
  });
  test('wraps a string into an @rdfjs/Literal', () => {
    expect(L(3)).toMatchObject({
      value: 3,
      termType: 'Literal'
    });
  });
  test('does nothing to an @rdfjs/Literal', () => {
    const l = rdf.blankNode('l');
    expect(L(l)).toEqual(l);
  });
});

describe('Q', () => {
  test('wraps arguments into an @rdfjs/Quad', () => {
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

})

describe('COUNT', () => {
  test('correctly wraps variable and alias', ()=>{
    expect(COUNT('x', 'y')).toMatchInlineSnapshot(`
Object {
  "expression": Object {
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

  test('accept distinct', ()=>{
    expect(COUNT('x', 'y', 'distinct'))
      .toHaveProperty('expression.distinct', true);
  });

});

describe('RAND', () => {
  test('wraps contents', () => {
    expect(RAND()).toEqual({
      type: 'operation',
      operator: 'rand',
      args: []
    })
  });
});

describe('FILTER', () => {
  test('wraps contents', () => {
    expect(FILTER('x')).toEqual({
      type: 'filter',
      expression: 'x'
    })
  });
});

describe('NOT', () => {
  test('wraps contents', () => {
    expect(NOT('x', 'y')).toEqual({
      type: 'operation',
      operator: '!',
      args: ['x', 'y']
    })
  });
});


describe('IS_BLANK', () => {
  test('wraps contents', () => {
    expect(IS_BLANK('x', 'y')).toEqual({
      type: 'operation',
      operator: 'isblank',
      args: ['x', 'y'].map(v => V(v))
    })
  });
});


describe('BIND', () => {
  test('wraps contents', () => {
    expect(BIND(COUNT('x'), 'y')).toEqual({
      type: 'bind',
      variable: V('y'),
      expression: COUNT('x')
    })
  });
});


describe('Query', () => {
  test('constructor', () => {
    expect(new Query()).toEqual({obj:{type:'query', prefixes: {}}});
  });

  test('prefix', () => {
    const q = new Query()
                  .prefix('a','b')
                  .prefix('c','d');
    expect(q.obj.prefixes).toEqual({
      a: 'b',
      c: 'd'
    });
  });

  test('distinct', () => {
    const q = new Query().distinct();
    expect(q).toHaveProperty('obj.distinct', true);
  });

  test('limit', () => {
    const q = new Query().limit(5);
    expect(q).toHaveProperty('obj.limit', 5);
  });

  test('select', () => {
    expect(new Query().select('a', '?b', V('c'))).
toMatchInlineSnapshot(`
Query {
  "obj": Object {
    "prefixes": Object {},
    "queryType": "SELECT",
    "type": "query",
    "variables": Array [
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

  test('groupBy', () => {
    expect(new Query().groupBy('a', '?b', V('c'))).
toMatchInlineSnapshot(`
Query {
  "obj": Object {
    "group": Array [
      Object {
        "expression": Variable {
          "termType": "Variable",
          "value": "a",
        },
      },
      Object {
        "expression": Variable {
          "termType": "Variable",
          "value": "b",
        },
      },
      Object {
        "expression": Variable {
          "termType": "Variable",
          "value": "c",
        },
      },
    ],
    "prefixes": Object {},
    "type": "query",
  },
}
`);
  });

  test('orderBy', () => {
    expect(new Query().orderBy('a', ['b', 'DESC'], ['c', 'ASC'], RAND())).
toMatchInlineSnapshot(`
Query {
  "obj": Object {
    "order": Array [
      Object {
        "expression": Variable {
          "termType": "Variable",
          "value": "a",
        },
      },
      Object {
        "descending": true,
        "expression": Variable {
          "termType": "Variable",
          "value": "b",
        },
      },
      Object {
        "ascending": true,
        "expression": Variable {
          "termType": "Variable",
          "value": "c",
        },
      },
      Object {
        "expression": Object {
          "args": Array [],
          "operator": "rand",
          "type": "operation",
        },
      },
    ],
    "prefixes": Object {},
    "type": "query",
  },
}
`);
  });


  test('produces a valid Sparql.js input', () => {
    const q = new Query()
                    .select('p', COUNT('p', 'total'))
                    .where(
                      Q(V('s'), V('p'), V('o'))
                    )
                    .groupBy('p')
                    .orderBy(['total', 'DESC'], RAND());

    expect(() => {
      new sparqljs.Generator().stringify(q.obj);
    }).not.toThrow();
  });

  test('produces the same object as Sparql.js', () => {
    const q = new Query()
                    .select('p', COUNT('p', 'total'))
                    .where(
                      Q(V('s'), V('p'), V('o'))
                    )
                    .groupBy('p')
                    .orderBy(['total', 'DESC'], RAND());

    const query = `SELECT ?p (COUNT(?p) AS ?total)
                    WHERE { 	?s ?p ?o . } 
                    GROUP BY ?p 
                    ORDER BY DESC(?total) RAND()`;

    const parser = new Parser();
    const parsed = parser.parse(query);
    expect(q.obj).toMatchObject(parsed);
  });

  test('produces valid SPARQL', () => {
    const q = new Query()
                    .select('p', COUNT('p', 'total'))
                    .where(
                      Q(V('s'), V('p'), V('o'))
                    )
                    .groupBy('p')
                    .orderBy(['total', 'DESC'], RAND());


    const parser = new Parser();
    expect(() => parser.parse(q.toSparql())).not.toThrow();
  });
});

describe('Query.where', () => {
  test('accepts quads', () => {
    expect(new Query().where(Q(V('a'), V('b'), V('c')))).
toMatchInlineSnapshot(`
Query {
  "obj": Object {
    "prefixes": Object {},
    "type": "query",
    "where": Array [
      Object {
        "triples": Array [
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

  test('accepts BIND', () => {
    const q = new Query().select('x', 'y')
                         .where(
                            Q(V('x'), V('p'), V('o')),
                            BIND(RAND(), 'y')
                         );

    expect(q.obj.where).toMatchInlineSnapshot(`
Array [
  Object {
    "triples": Array [
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
  Object {
    "expression": Object {
      "args": Array [],
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

  test('accepts subqueries', () => {
    const subq = new Query()
                      .prefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#')
                      .prefix('ontolex', 'http://www.w3.org/ns/lemon/ontolex')
                      .select('s')
                      .where(Q(V('s'), N('rdf:type'), N('ontolex:LexicalConcept')));

    const q = new Query()
                      .select('p', COUNT('s', 'cov', 'distinct'))
                      .where(
                        Q(V('i'), V('p'), V('o')),
                        subq
                      );
    expect(q.obj.where[1]).toMatchInlineSnapshot(`
Object {
  "patterns": Array [
    Object {
      "queryType": "SELECT",
      "type": "query",
      "variables": Array [
        Variable {
          "termType": "Variable",
          "value": "s",
        },
      ],
      "where": Array [
        Object {
          "triples": Array [
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

  test('accepts groups', () => {
    const q = new Query().select('x')
                         .where(
                            Q(V('x'), V('y'), V('z1')),
                            [
                              Q(V('x'), V('y'), V('z2')),
                              Q(V('x'), V('y'), V('z3')),
                            ]
                          );
    expect(q.obj.where).toMatchInlineSnapshot(`
Array [
  Object {
    "triples": Array [
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
  Object {
    "triples": Array [
      Array [
        Object {
          "triples": Array [
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
      Object {},
    ],
    "type": "group",
  },
]
`);
  });

  test('accepts unions', () => {
    const q = new Query().select('x')
                         .where(
                            Q(V('x'), V('y'), V('z')),
                            UNION,
                            Q(V('z'), V('y'), V('x')),
                            UNION,
                            Q(V('z'), V('x'), V('y')),
                          );
    expect(q.obj.where).toMatchInlineSnapshot(`
Array [
  Object {
    "patterns": Array [
      Object {
        "triples": Array [
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
    "type": "union",
  },
]
`);
  });

  
});

