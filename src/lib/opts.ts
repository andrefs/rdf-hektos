import OptionParser from 'option-parser';
const parser = new OptionParser();

const opts: {
  showProgBar: boolean,
  quiet: boolean,
  outputFile?: string,
  sparqlEndpoint?: string,
  repository?: string
} = {
  showProgBar: true,
  quiet: false,
};

parser.addOption('h', 'help', 'Display this help message')
      .action(parser.helpAction());
parser.addOption('q', 'quiet', 'No output other than results')
      .action(() => opts.quiet = true);
parser.addOption('b', 'no-progress-bar', 'Remove progress bar')
      .action(() => opts.showProgBar = false);
parser.addOption('o', 'output', 'Send output to file')
      .argument('FILE')
      .action((value: string) => opts.outputFile = value)
parser.addOption('e', 'endpoint', 'SPARQL endpoint')
      .argument('ENDPOINT')
      .action((value: string) => opts.sparqlEndpoint = value)
parser.addOption('r', 'repository', 'Repository ID')
      .argument('REPO')
      .action((value: string) => opts.repository = value)
      ;

parser.parse();

if(opts.quiet){ opts.showProgBar = false; }

export default opts;

