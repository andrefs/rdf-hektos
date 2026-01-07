import GraphOperations, { Predicate } from "./GraphOperations";
import { CliOptions } from "./proc-graph-opts";
import { N, Q, Query, V, VALUES, WhereArg } from "./QueryBuilder";
import SparqlWebStore from "./stores/SparqlWebStore";

/**
 * Process the graph
 * @param store The store to query
 * @param subSelect The query to select the resources of interest
 * @param options The options for the process
 */
export async function procGraph(
  store: SparqlWebStore,
  subSelect: WhereArg,
  options: CliOptions,
) {
  console.warn("Starting");
  console.warn("  getting predicates");

  const graph = new GraphOperations(store, {
    showProgBar: !options.noProgressBar,
  });
  let basePreds = await graph.getPreds();
  let gm = await graph.globalMetrics(subSelect);

  const preds: { [key: string]: Predicate } = {};

  const scov = await graph.calcSubjectCoverage(subSelect);
  const ocov = await graph.calcObjectCoverage(subSelect);
  const bfs = await graph.calcBranchingFactor(basePreds);
  const seedPR = await graph.calcSeedPosRatio(basePreds, subSelect);

  for (const [p, basePred] of Object.entries(basePreds)) {
    const s = scov[p] ?? 0;
    const o = ocov[p] ?? 0;
    const bf = bfs[p] ?? 0;
    const spr = seedPR[p] ?? 0;
    preds[p] = {
      ...basePred,
      subjCoverage: s,
      objCoverage: o,
      branchingFactor: bf,
      seedPosRatio: spr,
    };
  }

  return { globalMetrics: gm, predicates: preds };
}

/**
 * Convert a list of resources of interest (ROIs) to a select VALUES subquery
 * @param rois The list of ROIs
 * @param roiVar The variable name for the ROI
 * @returns The subquery
 */
export function roisToSubQ(rois: string[], roiVar: string) {
  const roiQ = new Query()
    .select(roiVar)
    .where(VALUES(rois.map((r) => ({ [`?${roiVar}`]: N(r) }))));
  return roiQ;
}

/**
 * Convert a list of resources of interest (ROIs) to a VALUES clause
 * @param rois The list of ROIs
 * @returns The VALUES clause
 */
export function roisToValues(rois: string[], roiVar = "seed") {
  return VALUES(rois.map((r) => ({ [`?${roiVar}`]: N(r) })));
}

/**
 * Convert a class URI to a select subquery
 * @param classUri The URI of the class
 * @param classVar The variable name for the class
 * @param a The predicate to use for the class (default: rdf:type)
 * @returns The subquery
 */
export function classToSubQ(
  classUri: string,
  classVar: string,
  a = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
) {
  const classNode = N(classUri);
  const subq = new Query()
    .select(classVar)
    .where(Q(V(classVar), N(a), classNode));
  return subq;
}
