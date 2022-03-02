import {flattenObj, summProps, flattenObjValues, prettyMatrix} from './utils.js';

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


test('summProps correctly summarizes properties', () => {
  const props = {
    propA: {
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
    propB: {
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

  expect(summProps(props)).toMatchInlineSnapshot(`
Object {
  "propA": Object {
    "avgLen": 2.5,
    "count": 3,
    "ratio": 2,
    "sampledWalks": 2,
    "walks": Object {
      "found_literal": 1,
      "loop": 1,
    },
  },
  "propB": Object {
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
    "propA": {
      "avgLen": 2.5,
      "count": 3,
      "ratio": 2,
      "sampledWalks": 2,
      "walks": {
        "found_literal": 1,
        "loop": 1,
      },
    },
    "propB": {
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
"Property	avgLen	count	ratio	sampledWalks	walks.found_literal	walks.loop	walks.finished_early
propA	2.5	3	2	2	1	1	
propB	2	10	0.3	3			3"
`);


});





