import { promises as fs } from 'fs';

import SparqlWebStore from '../lib/stores/SparqlWebStore.ts';
import opts, { CliOptions } from '../lib/proc-graph-opts.ts'
import { N, Q, Query, V } from '../lib/QueryBuilder.js';
import { classToSubQ, procGraph, roisToSubQ } from '../lib/proc-graph.ts';


const run = async () => {
  const host = 'http://localhost';
  const ds = opts.dataset;
  const port = '3030';
  const endpointUrl = opts.endpoint || `${host}:${port}/${ds}/sparql`;
  if (opts.verbose) {
    console.warn(`Using endpoint: ${endpointUrl}`);
  }

  let subQ: Query;
  if (!opts.rois && !opts.roisFile && !opts.roiClass) {
    console.error('No resources of interest specified: at least one of --rois, --roisFile, or --roiClass must be provided');
    process.exit(1);
  }

  if (opts.rois) {
    subQ = roisToSubQ(opts.rois, 's');
  } else if (opts.roisFile) {
    const rois = await fs.readFile(opts.roisFile, 'utf8');
    subQ = roisToSubQ(rois.split('\n').filter(r => r), 's');
  } else if (opts.roiClass) {
    subQ = classToSubQ(opts.roiClass, 's');
  }



  const store = new SparqlWebStore({ endpointUrl })
  const res = await procGraph(store, subQ, opts);

  const file = opts.output || `${ds}-metrics.json`;
  console.warn(`Saving output to ${file}`)
  await fs.writeFile(file, JSON.stringify(res, null, 2));
}



run().then(() => console.warn('done')).catch(console.error);
