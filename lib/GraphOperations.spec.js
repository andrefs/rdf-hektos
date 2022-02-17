import {jest} from '@jest/globals';
import GraphOperations from './GraphOperations.js';
import {Readable} from 'stream';

let store;

beforeEach(() => {
  const mockSelect = jest.fn();
  store = {select: mockSelect};
});

test('getProps', async() => {
  const graph = new GraphOperations(store);
  const s = new Readable.from([{a:1}, {b:2}, {c:3}]);

  //console.log('XXXXXXXXXXXXx 0', store)
  store.select.mockReturnValueOnce(s);
  const props = await graph.getProps();
  //console.log('XXXXXXXXXXXXx 1', graph)
});


