import {flattenObj, summPreds, flattenObjValues, prettyMatrix} from './utils.js';

const obj = {
  a: {b: {c: 1}},
  d: {b: {c: 2,
          e: 3}},
  f: {b: {g: 4}}
};

test('flattenObj correctly flattens object', () => {
  expect(flattenObj(obj)).toMatchInlineSnapshot(`
Object {
  "a.b.c": 1,
  "d.b.c": 2,
  "d.b.e": 3,
  "f.b.g": 4,
}
`);
});



test('flattenObjValues correctly transforms object into matrix', () => {
  expect(flattenObjValues(obj)).toMatchInlineSnapshot(`
Object {
  "a": Object {
    "b.c": 1,
  },
  "d": Object {
    "b.c": 2,
    "b.e": 3,
  },
  "f": Object {
    "b.g": 4,
  },
}
`);

});


test('summPreds correctly summarizes predicates', () => {
  const preds = {
    predA: {
      ratio: 2,
      count: 3,
      sampledWalks: 2,
      walks: {
        source1: {
          nodes: ['n1', 'n2'],
          status: 'loop'
        },
        source2: {
          nodes: ['n3', 'n4', 'n5'],
          status: 'found_literal'
        }
      }
    },
    predB: {
      ratio: 0.3,
      count: 10,
      sampledWalks: 3,
      walks: {
        source1: {
          nodes: ['n6', 'n7'],
          status: 'finished_early',
        },
        source3: {
          nodes: ['n8', 'n9'],
          status: 'finished_early',
        },
        source4: {
          nodes: ['n10', 'n11'],
          status: 'finished_early',
        }
      }
    }
  };

  expect(summPreds(preds)).toMatchInlineSnapshot(`
Object {
  "predA": Object {
    "avgLen": 2.5,
    "count": 3,
    "ratio": 2,
    "sampledWalks": 2,
    "walks": Object {
      "found_literal": 1,
      "loop": 1,
    },
  },
  "predB": Object {
    "avgLen": 2,
    "count": 10,
    "ratio": 0.3,
    "sampledWalks": 3,
    "walks": Object {
      "finished_early": 3,
    },
  },
}
`);

});

test('prettyMatrix correctly generates a string from a matrix', () => {
  const obj = {
    "predA": {
      "avgLen": 2.5,
      "count": 3,
      "ratio": 2,
      "sampledWalks": 2,
      "walks": {
        "found_literal": 1,
        "loop": 1,
      },
    },
    "predB": {
      "avgLen": 2,
      "count": 10,
      "ratio": 0.3,
      "sampledWalks": 3,
      "walks": {
        "finished_early": 3,
      },
    },
  };

  expect(prettyMatrix(flattenObjValues(obj))).toMatchInlineSnapshot(`
"Predicate	avgLen	count	ratio	sampledWalks	walks.found_literal	walks.loop	walks.finished_early
predA	2.5	3	2	2	1	1	
predB	2	10	0.3	3			3"
`);


});





