import {summPreds, ppMatrix, flattenObjValues} from '../lib/utils'
import {promises as fs} from 'fs';

import opts from '../lib/opts'

async function run(){
  console.warn('Starting');
  const file = opts.input ;
  console.warn(`Loading file ${file}`);
  const json = await fs.readFile(file, {encoding: 'utf8'});
  const {predicates:preds, globalMetrics} = JSON.parse(json);

  const sum = summPreds(preds);

  ppMatrix(flattenObjValues(sum), opts.output);
  console.log(globalMetrics);
}

run();
