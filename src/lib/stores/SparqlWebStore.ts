import { QueryEngine } from "@comunica/query-sparql";
import { EventEmitter } from "stream";
import Store from "./Store";
import { LoggerPretty } from "@comunica/logger-pretty";

class SparqlWebStore extends Store {
  engine: QueryEngine;
  source: string;

  constructor({ endpointUrl }: { endpointUrl: string }) {
    super();
    this.engine = new QueryEngine();
    this.source = endpointUrl;
  }

  async select(q: string): Promise<EventEmitter> {
    const preQuery = Date.now();
    console.log("XXXXXXXXXXXXXXx SparqlWebStore", { q });
    const res = await this.engine.queryBindings(q, {
      sources: [
        {
          type: "sparql",
          value: this.source,
        },
      ],
      log: new LoggerPretty({ level: "trace" }),
    });

    res.on("end", () => {
      const postQuery = Date.now();
      const duration = (postQuery - preQuery) / 1000;
      if (duration > 5) {
        console.warn(`Slow query (${duration}):\n${q}`);
      }
    });

    return res;
  }
}

export default SparqlWebStore;
