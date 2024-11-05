import { promises as fs } from 'fs';
import { GlobalMetrics, Predicate, Walk } from './GraphOperations.ts';

interface PredicateSummary {
  [key: string]: any,
  ratio?: number,
  count?: number,
  subjCoverage?: number,
  objCoverage?: number,
  sampledWalks?: number,
  branchingFactor?: number,
  walks?: { [key: string]: number },
  avgLen?: number
};

//export const summPreds = (preds: { [key: string]: Predicate }) => {
//  const res: { [key: string]: PredicateSummary } = {};
//  for (const p of Object.keys(preds)) {
//    const resP = {
//      ratio: preds[p].ratio,
//      count: preds[p].count,
//      subjCoverage: preds[p].subjCoverage,
//      objCoverage: preds[p].objCoverage,
//      sampledWalks: preds[p].sampledWalks,
//      branchingFactor: preds[p].branchingFactor,
//    }
//
//    let len = 0;
//    const walks: { [key: string]: number } = {};
//    for (const w of Object.values(preds[p]?.walks ?? [])) {
//      len += w.nodes.length;
//      for (const s of w.status) {
//        walks[s] = walks[s] || 0;
//        walks[s]++;
//      }
//    }
//
//    const walksCount = Object.keys(preds[p]?.walks ?? []).length;
//
//    const avgLen = walksCount ? len / walksCount : 0;
//    res[p] = { ...resP, walks, avgLen };
//  }
//  return res;
//};

export const summMetrics = (preds: { [key: string]: Predicate }, globalMetrics: GlobalMetrics) => {
  const res: { [key: string]: PredicateSummary } = {};
  for (const p of Object.keys(preds)) {
    res[p] = {};
    res[p].coverage = ((preds[p].subjCoverage ?? 0) + (preds[p].objCoverage ?? 0)) / globalMetrics.totalSeeds;
    res[p].totalSeeds = globalMetrics.totalSeeds;
    res[p].subjCoverage = preds[p].subjCoverage;
    res[p].objCoverage = preds[p].objCoverage;
    res[p].branchingFactor = preds[p].branchingFactor;
    res[p].normBranchingFactor = preds[p].branchingFactor < 1 ?
      1 / preds[p].branchingFactor :
      preds[p].branchingFactor;

  }
  return res;
};



export const flattenObj = (obj: FlattableObject, parentKey: (string | null) = null, res: { [key: string]: any } = {}) => {
  for (let key in obj) {
    const value = obj[key];
    const predName = parentKey ? parentKey + "." + key : key;
    if (typeof value === 'number' || typeof value === 'string' || Array.isArray(value)) {
      res[predName] = obj[key];
      continue;
    }
    flattenObj(value, predName, res);
  }
  return res;
};

type NestedObject = (string | number | Array<NestedObject> | { [key: string]: NestedObject })

type FlattableObject = { [key: string]: (number | string | FlattableObject) };

export const flattenObjValues = (obj: FlattableObject) => {
  return Object.keys(obj)
    .reduce((previous, key) => {
      const value = obj[key];
      if (typeof value === 'number' || typeof value === 'string' || Array.isArray(value)) {
        previous[key] = value;
        return previous;
      }
      previous[key] = flattenObj(value);
      return previous;
    }, {} as { [key: string]: any });
};

export const ppMatrix = async (data: { [key: string]: any }, outputFile: string) => {
  const m = prettyMatrix(data);
  if (outputFile) {
    console.warn(`Saving output to ${outputFile}`)
    await fs.writeFile(outputFile, m);
    return;
  }
  console.log(m);
};


export const prettyMatrix = (data: { [key: string]: any }): string => {
  const table = [];
  const keys: { [key: string]: boolean } = {};
  for (const x of Object.values(data)) {
    for (const k of Object.keys(x)) {
      keys[k] = true;
    }
  }
  table.push(['Predicate', ...Object.keys(keys)]);
  for (const [pred, info] of Object.entries(data)) {
    const row = [pred];
    for (const k of table[0].slice(1)) {
      row.push(info[k] || '');
    }
    table.push(row);
  }


  return table.map(x => x.join('\t')).join('\n');
};

