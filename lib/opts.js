import OptionParser from 'option-parser';
const parser = new OptionParser();

const opts = {
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
      .action((value) => opts.outputFile = value);

parser.parse();

if(opts.quiet){ opts.showProgBar = false; }

export default opts;

