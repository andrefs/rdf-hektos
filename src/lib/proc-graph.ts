import GraphOperations, { Predicate } from "./GraphOperations";
import { CliOptions } from "./proc-graph-opts";
import { N, Q, Query, V, VALUES } from "./QueryBuilder";
import SparqlWebStore from "./stores/SparqlWebStore";

/**
 * Process the graph
 * @param store The store to query
 * @param subSelect The query to select the resources of interest
 * @param options The options for the process
 */
export async function procGraph(store: SparqlWebStore, subSelect: Query, options: CliOptions) {
  console.warn('Starting');
  console.warn('  getting predicates');

  const graph = new GraphOperations(store, { showProgBar: !options.noProgressBar });
  let basePreds = await graph.getPreds();
  let gm = await graph.globalMetrics(subSelect);

  const preds: { [key: string]: Predicate } = {};

  const scov = await graph.calcSubjectCoverage(subSelect);
  const ocov = await graph.calcObjectCoverage(subSelect);
  const bfs = await graph.calcBranchingFactor(basePreds);

  for (const [p, basePred] of Object.entries(basePreds)) {
    const s = scov[p] ?? 0;
    const o = ocov[p] ?? 0;
    const bf = bfs[p] ?? 0;
    preds[p] = {
      ...basePred,
      subjCoverage: s,
      objCoverage: o,
      branchingFactor: bf
    };
  }


  return { globalMetrics: gm, predicates: preds };
};

export function roisToSubQ(rois: string[], roiVar: string) {
  const roiQ = new Query().select(roiVar)
    .where(
      VALUES(rois.map(r => ({ [roiVar]: N(r) })))
    );
  return roiQ;
}
