#!/usr/bin/env tsx
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const readline = __importStar(require("readline"));
const test_data_1 = require("./test-data");
const n3 = (0, test_data_1.setupTestGraph)();
console.log(`Loaded ${n3.size} triples into the graph`);
console.log('SPARQL REPL for GraphOperations test graph');
console.log('Available global variables: n3 (N3.Store), engine (QueryEngine), pf (prefix), NN (namedNode factory)');
console.log('Commands: "dump" to show graph in Turtle format, "exit" to quit');
console.log('Multi-line input: end lines with \\ for continuation, press Enter on empty line to execute');
console.log('Type a SPARQL query and press Enter. Type "exit" to quit.');
console.log('');
// Function to dump the graph in Turtle format
function dumpTurtle() {
    console.log(`@prefix ex: <${test_data_1.pf}> .`);
    console.log('');
    const quads = n3.getQuads(null, null, null, null);
    quads.forEach((quad, index) => {
        const subject = quad.subject.value.startsWith(test_data_1.pf)
            ? `ex:${quad.subject.value.replace(test_data_1.pf, '')}`
            : `<${quad.subject.value}>`;
        const predicate = quad.predicate.value.startsWith(test_data_1.pf)
            ? `ex:${quad.predicate.value.replace(test_data_1.pf, '')}`
            : `<${quad.predicate.value}>`;
        let object;
        if (quad.object.termType === 'Literal') {
            object = `"${quad.object.value}"`;
            if (quad.object.language) {
                object += `@${quad.object.language}`;
            }
            else if (quad.object.datatype && quad.object.datatype.value !== 'http://www.w3.org/2001/XMLSchema#string') {
                object += `^^<${quad.object.datatype.value}>`;
            }
        }
        else {
            object = quad.object.value.startsWith(test_data_1.pf)
                ? `ex:${quad.object.value.replace(test_data_1.pf, '')}`
                : `<${quad.object.value}>`;
        }
        console.log(`${subject} ${predicate} ${object} .`);
    });
}
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'SPARQL> '
});
let pendingOperation = false;
let inputBuffer = [];
let isMultiLineMode = false;
rl.prompt();
rl.on('line', (line) => __awaiter(void 0, void 0, void 0, function* () {
    let query = line;
    // Check for line continuation (backslash at end)
    const hasContinuation = line.endsWith('\\');
    if (hasContinuation) {
        // Remove the backslash and add to buffer
        inputBuffer.push(line.slice(0, -1));
        if (!isMultiLineMode) {
            isMultiLineMode = true;
            rl.setPrompt('......> ');
        }
        rl.prompt();
        return;
    }
    // Handle multi-line input
    if (isMultiLineMode) {
        inputBuffer.push(line);
        query = inputBuffer.join('\n');
        inputBuffer = [];
        isMultiLineMode = false;
        // Reset prompt
        rl.setPrompt('SPARQL> ');
    }
    else {
        query = query.trim();
    }
    if (query === 'exit' || query === '.exit') {
        if (pendingOperation) {
            console.log('Waiting for current operation to complete...');
            // Wait for operation to complete
            const checkComplete = () => {
                if (!pendingOperation) {
                    rl.close();
                }
                else {
                    setTimeout(checkComplete, 100);
                }
            };
            checkComplete();
        }
        else {
            // Clear multi-line buffer if exiting
            if (isMultiLineMode) {
                inputBuffer = [];
                isMultiLineMode = false;
                console.log('Exited multi-line mode');
            }
            rl.close();
        }
        return;
    }
    if (!query) {
        rl.prompt();
        return;
    }
    if (query === 'dump') {
        dumpTurtle();
        rl.prompt();
        return;
    }
    try {
        // Check if it's a SPARQL query (starts with SELECT, ASK, CONSTRUCT, DESCRIBE)
        const isSparqlQuery = /^\s*(SELECT|ASK|CONSTRUCT|DESCRIBE)/i.test(query);
        if (isSparqlQuery) {
            console.log('Executing SPARQL query...');
            pendingOperation = true;
            const bindingsStream = yield test_data_1.engine.queryBindings(query, { sources: [n3] });
            // Collect results
            const results = [];
            bindingsStream.on('data', (binding) => {
                results.push(binding);
            });
            bindingsStream.on('end', () => {
                pendingOperation = false;
                if (results.length === 0) {
                    console.log('No results');
                }
                else {
                    console.log(`Results (${results.length}):`);
                    results.forEach((result, index) => {
                        const obj = {};
                        // Iterate over all variables in the binding
                        for (const key of result.keys()) {
                            const value = result.get(key);
                            if (value) {
                                obj[key.value] = value.value;
                            }
                        }
                        console.log(`${index + 1}:`, obj);
                    });
                }
                rl.prompt();
            });
            bindingsStream.on('error', (error) => {
                pendingOperation = false;
                console.error('Query error:', error.message);
                rl.prompt();
            });
        }
        else {
            // Execute as JavaScript code in global context
            console.log('Executing JavaScript...');
            try {
                const result = eval(query);
                console.log(result);
            }
            catch (jsError) {
                console.error('JavaScript error:', jsError.message);
            }
            rl.prompt();
        }
    }
    catch (error) {
        console.error('Error:', error.message);
        rl.prompt();
    }
}));
rl.on('close', () => {
    console.log('Goodbye!');
    process.exit(0);
});
// Make variables available globally for JavaScript evaluation
global.n3 = n3;
global.engine = test_data_1.engine;
global.pf = test_data_1.pf;
global.NN = test_data_1.NN;
global.factory = test_data_1.factory;
global.dumpTurtle = dumpTurtle;
//# sourceMappingURL=repl.js.map