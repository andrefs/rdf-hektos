interface CliOptions {
  quiet?: boolean,
  noProgressBar?: boolean,
  output?: string,
  endpoint?: string,
  repository?: string,
  help?: boolean
};

import {parse} from 'ts-command-line-args';

export const args = parse<CliOptions>(
  {
    quiet:         {type: Boolean, optional: true, alias: 'q', description: 'No output other than results'},
    noProgressBar: {type: Boolean, optional: true, alias: 'b', description: 'Remove progress bar'         },
    output:        {type: String,  optional: true, alias: 'o', description: 'Send output to file'         },
    endpoint:      {type: String,  optional: true, alias: 'e', description: 'SPARQL endpoint'             },
    repository:    {type: String,  optional: true, alias: 'r', description: 'Repository ID'               },
    help:          {type: Boolean, optional: true, alias: 'h', description: 'Display this help message'   },
  }, {
    helpArg: 'help'
  }
);

export default args;
