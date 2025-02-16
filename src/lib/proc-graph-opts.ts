export interface CliOptions {
  quiet?: boolean,
  noProgressBar?: boolean,
  output?: string,
  input?: string,
  concurrency?: number,
  endpoint?: string,
  dataset?: string,
  help?: boolean,
  verbose?: boolean,
  rois?: string[],
  roisFile?: string,
  roiClass?: string,
};

import { parse } from 'ts-command-line-args';

export const args = parse<CliOptions>(
  {
    quiet: { type: Boolean, optional: true, alias: 'q', description: 'No output other than results' },
    noProgressBar: { type: Boolean, optional: true, alias: 'b', description: 'Remove progress bar' },
    output: { type: String, optional: true, alias: 'o', description: 'Send output to file' },
    input: { type: String, optional: true, alias: 'i', description: 'Load input from file' },
    concurrency: { type: Number, optional: true, alias: 'c', description: 'Number of parallel SPARQL queries' },
    endpoint: { type: String, optional: true, alias: 'e', description: 'SPARQL endpoint' },
    dataset: { type: String, optional: true, alias: 'd', description: 'Dataset ID' },
    help: { type: Boolean, optional: true, alias: 'h', description: 'Display this help message' },
    verbose: { type: Boolean, optional: true, alias: 'v', description: 'Display verbose output' },
    rois: { type: String, multiple: true, optional: true, alias: 'r', description: 'Resources of interest' },
    roisFile: { type: String, optional: true, alias: 'f', description: 'File containing resources of interest' },
    roiClass: { type: String, optional: true, alias: 'l', description: 'Class of resources of interest' },
  }, {
  helpArg: 'help'
}
);

export default args;
