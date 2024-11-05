import { summMetrics, ppMatrix, flattenObjValues } from '../lib/utils'
import fs from 'node:fs/promises';

import opts from '../lib/sum2csv-opts'

async function run() {
  console.warn('Starting');
  const file = opts.input;
  console.warn(`Loading file ${file}`);
  const json = await fs.readFile(file, { encoding: 'utf8' });
  const { predicates: preds, globalMetrics } = JSON.parse(json);

  const sum = summMetrics(preds, globalMetrics);

  const output = opts.output || 'results.csv';

  ppMatrix(flattenObjValues(sum), output);
}

run();
