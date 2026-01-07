#!/usr/bin/env tsx

import * as readline from 'readline';
import N3 from 'n3';
import { setupTestGraph, engine, factory, pf, NN } from './test-data';

const n3 = setupTestGraph();

console.log(`Loaded ${n3.size} triples into the graph`);
console.log('SPARQL REPL for GraphOperations test graph');
console.log('Available global variables: n3 (N3.Store), engine (QueryEngine), pf (prefix), NN (namedNode factory)');
console.log('Commands: "dump" to show graph in Turtle format, "exit" to quit');
console.log('Multi-line input: end lines with \\ for continuation, press Enter on empty line to execute');
console.log('Type a SPARQL query and press Enter. Type "exit" to quit.');
console.log('');

// Function to dump the graph in Turtle format
function dumpTurtle() {
  console.log(`@prefix ex: <${pf}> .`);
  console.log('');

  const quads = n3.getQuads(null, null, null, null);
  quads.forEach((quad, index) => {
    const subject = quad.subject.value.startsWith(pf)
      ? `ex:${quad.subject.value.replace(pf, '')}`
      : `<${quad.subject.value}>`;

    const predicate = quad.predicate.value.startsWith(pf)
      ? `ex:${quad.predicate.value.replace(pf, '')}`
      : `<${quad.predicate.value}>`;

    let object: string;
    if (quad.object.termType === 'Literal') {
      object = `"${quad.object.value}"`;
      if (quad.object.language) {
        object += `@${quad.object.language}`;
      } else if (quad.object.datatype && quad.object.datatype.value !== 'http://www.w3.org/2001/XMLSchema#string') {
        object += `^^<${quad.object.datatype.value}>`;
      }
    } else {
      object = quad.object.value.startsWith(pf)
        ? `ex:${quad.object.value.replace(pf, '')}`
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
let inputBuffer: string[] = [];
let isMultiLineMode = false;

rl.prompt();

rl.on('line', async (line) => {
  let query = line;

  // Check for line continuation (backslash at end)
  const hasContinuation = line.endsWith('\\');
  if (hasContinuation) {
    // Remove the backslash and add to buffer
    inputBuffer.push(line.slice(0, -1));
    if (!isMultiLineMode) {
      isMultiLineMode = true;
      (rl as any).setPrompt('......> ');
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
    (rl as any).setPrompt('SPARQL> ');
  } else {
    query = query.trim();
  }

  if (query === 'exit' || query === '.exit') {
    if (pendingOperation) {
      console.log('Waiting for current operation to complete...');
      // Wait for operation to complete
      const checkComplete = () => {
        if (!pendingOperation) {
          rl.close();
        } else {
          setTimeout(checkComplete, 100);
        }
      };
      checkComplete();
    } else {
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

      const bindingsStream = await engine.queryBindings(query, { sources: [n3] });

      // Collect results
      const results: any[] = [];

      bindingsStream.on('data', (binding) => {
        results.push(binding);
      });

      bindingsStream.on('end', () => {
        pendingOperation = false;
        if (results.length === 0) {
          console.log('No results');
        } else {
          console.log(`Results (${results.length}):`);
          results.forEach((result, index) => {
            const obj: { [key: string]: string } = {};
            // Iterate over all variables in the binding
            for (const key of result.keys()) {
              const value = result.get(key);
              if (value) {
                obj[(key as any).value] = value.value;
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

    } else {
      // Execute as JavaScript code in global context
      console.log('Executing JavaScript...');
      try {
        const result = eval(query);
        console.log(result);
      } catch (jsError: any) {
        console.error('JavaScript error:', jsError.message);
      }
      rl.prompt();
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    rl.prompt();
  }
});

rl.on('close', () => {
  console.log('Goodbye!');
  process.exit(0);
});

// Make variables available globally for JavaScript evaluation
(global as any).n3 = n3;
(global as any).engine = engine;
(global as any).pf = pf;
(global as any).NN = NN;
(global as any).factory = factory;
(global as any).dumpTurtle = dumpTurtle;