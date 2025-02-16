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
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const proc_graph_1 = require("./proc-graph");
const SparqlJs = __importStar(require("sparqljs"));
(0, vitest_1.describe)('roisToSubQ', () => {
    (0, vitest_1.it)('should return a query that selects the resources of interest', () => {
        const rois = ['http://example.org/a', 'http://example.org/b'];
        const roiQ = (0, proc_graph_1.roisToSubQ)(rois, 's');
        (0, vitest_1.expect)(roiQ).toMatchInlineSnapshot(`
      Query {
        "obj": {
          "prefixes": {},
          "queryType": "SELECT",
          "type": "query",
          "variables": [
            Variable {
              "termType": "Variable",
              "value": "s",
            },
          ],
          "where": [
            {
              "type": "values",
              "values": [
                {
                  "?s": NamedNode {
                    "termType": "NamedNode",
                    "value": "http://example.org/a",
                  },
                },
                {
                  "?s": NamedNode {
                    "termType": "NamedNode",
                    "value": "http://example.org/b",
                  },
                },
              ],
            },
          ],
        },
      }
    `);
        (0, vitest_1.expect)(() => {
            new SparqlJs.Generator().stringify(roiQ.obj);
        }).not.toThrow();
    });
});
(0, vitest_1.describe)('classToSubQ', () => {
    (0, vitest_1.it)('should return a query that selects the instances of the given class', () => {
        const classIri = 'http://example.org/Class';
        const classQ = (0, proc_graph_1.classToSubQ)(classIri, 's');
        (0, vitest_1.expect)(classQ).toMatchInlineSnapshot(`
      Query {
        "obj": {
          "prefixes": {},
          "queryType": "SELECT",
          "type": "query",
          "variables": [
            Variable {
              "termType": "Variable",
              "value": "s",
            },
          ],
          "where": [
            {
              "triples": [
                Quad {
                  "graph": DefaultGraph {
                    "termType": "DefaultGraph",
                    "value": "",
                  },
                  "object": NamedNode {
                    "termType": "NamedNode",
                    "value": "http://example.org/Class",
                  },
                  "predicate": NamedNode {
                    "termType": "NamedNode",
                    "value": "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
                  },
                  "subject": Variable {
                    "termType": "Variable",
                    "value": "s",
                  },
                  "termType": "Quad",
                  "value": "",
                },
              ],
              "type": "bgp",
            },
          ],
        },
      }
    `);
        (0, vitest_1.expect)(() => {
            new SparqlJs.Generator().stringify(classQ.obj);
        }).not.toThrow();
    });
    (0, vitest_1.it)('should return a query that selects the instances of the given class with a given predicate', () => {
        const classIri = 'http://example.org/Class';
        const predicateIri = 'http://example.org/predicate';
        const classQ = (0, proc_graph_1.classToSubQ)(classIri, 's', predicateIri);
        (0, vitest_1.expect)(classQ).toMatchInlineSnapshot(`
      Query {
        "obj": {
          "prefixes": {},
          "queryType": "SELECT",
          "type": "query",
          "variables": [
            Variable {
              "termType": "Variable",
              "value": "s",
            },
          ],
          "where": [
            {
              "triples": [
                Quad {
                  "graph": DefaultGraph {
                    "termType": "DefaultGraph",
                    "value": "",
                  },
                  "object": NamedNode {
                    "termType": "NamedNode",
                    "value": "http://example.org/Class",
                  },
                  "predicate": NamedNode {
                    "termType": "NamedNode",
                    "value": "http://example.org/predicate",
                  },
                  "subject": Variable {
                    "termType": "Variable",
                    "value": "s",
                  },
                  "termType": "Quad",
                  "value": "",
                },
              ],
              "type": "bgp",
            },
          ],
        },
      }
    `);
        (0, vitest_1.expect)(() => {
            new SparqlJs.Generator().stringify(classQ.obj);
        }).not.toThrow();
    });
});
//# sourceMappingURL=proc-graph.test.js.map