;
import { parse } from 'ts-command-line-args';
export const args = parse({
    input: { type: String, alias: 'i', description: 'Load input from file' },
    output: { type: String, optional: true, alias: 'o', description: 'Send output to file' },
    help: { type: Boolean, optional: true, alias: 'h', description: 'Display this help message' },
}, {
    helpArg: 'help'
});
export default args;
//# sourceMappingURL=sum2csv-opts.js.map