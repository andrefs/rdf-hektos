export interface CliOptions {
  input: string,
  output?: string,
  help?: boolean
};

import { parse } from 'ts-command-line-args';

export const args = parse<CliOptions>(
  {
    input: { type: String, alias: 'i', description: 'Load input from file' },
    output: { type: String, optional: true, alias: 'o', description: 'Send output to file' },
    help: { type: Boolean, optional: true, alias: 'h', description: 'Display this help message' },
  }, {
  helpArg: 'help'
}
);

export default args;
