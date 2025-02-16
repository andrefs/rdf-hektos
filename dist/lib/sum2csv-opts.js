"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.args = void 0;
;
const ts_command_line_args_1 = require("ts-command-line-args");
exports.args = (0, ts_command_line_args_1.parse)({
    input: { type: String, alias: 'i', description: 'Load input from file' },
    output: { type: String, optional: true, alias: 'o', description: 'Send output to file' },
    help: { type: Boolean, optional: true, alias: 'h', description: 'Display this help message' },
}, {
    helpArg: 'help'
});
exports.default = exports.args;
//# sourceMappingURL=sum2csv-opts.js.map