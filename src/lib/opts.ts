interface CliOptions {
  quiet: Boolean,
  noProgressBar: Boolean,
  output: String,
  endpoint: String,
  repository: String,
  help: Boolean
};

import {parse} from 'ts-command-line-args';

export const args = parse<CliOptions>(
  {
    quiet:         {type: Boolean, optional: true, alias: 'q', description: 'No output other than results'},
    noProgressBar: {type: Boolean, optional: true, alias: 'b', description: 'Remove progress bar'         },
    output:        {type: Boolean, optional: true, alias: 'o', description: 'Send output to file'         },
    endpoint:      {type: Boolean, optional: true, alias: 'e', description: 'SPARQL endpoint'             },
    repository:    {type: Boolean, optional: true, alias: 'r', description: 'Repository ID'               },
    help:          {type: Boolean, optional: true, alias: 'h', description: 'Display this help message'   },
  }, {
    helpArg: 'help'
  }
);

export default args;
