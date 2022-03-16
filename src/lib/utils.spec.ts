import { N } from './QueryBuilder';
import {flattenObj, summPreds, flattenObjValues, prettyMatrix} from './utils';

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
      node: N('predA'),
      sampledWalks: 2,
      branchingFactor: 2,
      coverage: 2,
      walks: {
        source1: {
          nodes: [N('n1'), N('n2')],
          status: ['found_loop']
        },
        source2: {
          nodes: [N('n3'), N('n4'), N('n5')],
          status: ['found_literal']
        }
      }
    },
    predB: {
      ratio: 0.3,
      count: 10,
      node: N('predB'),
      branchingFactor: 0.3,
      sampledWalks: 3,
      coverage: 3,
      walks: {
        source1: {
          nodes: [N('n6'), N('n7')],
          status: ['finished_early'],
        },
        source3: {
          nodes: [N('n8'), N('n9')],
          status: ['finished_early'],
        },
        source4: {
          nodes: [N('n10'), N('n11')],
          status: ['finished_early'],
        }
      }
    }
  };

  expect(summPreds(preds)).toMatchInlineSnapshot(`
Object {
  "predA": Object {
    "avgLen": 2.5,
    "branchingFactor": 2,
    "count": 3,
    "coverage": 2,
    "ratio": 2,
    "sampledWalks": 2,
    "walks": Object {
      "found_literal": 1,
      "found_loop": 1,
    },
  },
  "predB": Object {
    "avgLen": 2,
    "branchingFactor": 0.3,
    "count": 10,
    "coverage": 3,
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
      "coverage": 3,
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
      "coverage": 2,
      "walks": {
        "finished_early": 3,
      },
    },
  };

  expect(prettyMatrix(flattenObjValues(obj))).toMatchInlineSnapshot(`
"Predicate	avgLen	count	ratio	sampledWalks	coverage	walks.found_literal	walks.loop	walks.finished_early
predA	2.5	3	2	2	3	1	1	
predB	2	10	0.3	3	2			3"
`);


});





